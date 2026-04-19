'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActivityLevel } from '@/types/dietly';

import { PATIENT_FIELD_SCHEMAS } from '../patient-schema';

// Campos permitidos para actualizar via inline edit
const ALLOWED_FIELDS = new Set([
  'name', 'email', 'phone', 'date_of_birth', 'sex',
  'weight_kg', 'height_cm', 'activity_level', 'goal',
  'dietary_restrictions', 'allergies', 'intolerances',
  'preferences', 'medical_notes', 'allow_meal_swaps',
  'cooking_preference',
]);

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export async function updatePatientField(
  patientId: string,
  field: string,
  value: string | number | null,
): Promise<{ error?: string }> {
  if (!ALLOWED_FIELDS.has(field)) return { error: 'Campo no permitido' };

  const schema = PATIENT_FIELD_SCHEMAS[field];
  if (!schema) return { error: 'Campo no permitido' };
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? 'Valor no válido' };
  }
  const validatedValue = parsed.data as string | number | boolean | null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // allow_meal_swaps llega como booleano casteado
  let dbValue: unknown = validatedValue;
  if (field === 'allow_meal_swaps') {
    dbValue = validatedValue === true || validatedValue === 'true' || validatedValue === 1;
  } else if (field === 'dietary_restrictions' && typeof validatedValue === 'string') {
    const items = validatedValue.split(',').map((s) => s.trim()).filter(Boolean);
    dbValue = items.length > 0 ? items : null;
  } else if (field === 'dietary_restrictions' && validatedValue === null) {
    dbValue = null;
  } else if (validatedValue === '') {
    // Schemas con z.literal('') aceptan cadena vacía → normalizamos a null en BD
    dbValue = null;
  }
  const update: Record<string, unknown> = { [field]: dbValue };

  // Recalcular TMB y TDEE cuando cambia un campo biométrico
  if (['sex', 'weight_kg', 'height_cm', 'date_of_birth', 'activity_level'].includes(field)) {
    const { data: patient } = await supabase
      .from('patients')
      .select('sex, weight_kg, height_cm, date_of_birth, activity_level')
      .eq('id', patientId)
      .eq('nutritionist_id', user.id)
      .single();

    if (patient) {
      const p = { ...patient, [field]: validatedValue };
      if (p.sex && p.weight_kg && p.height_cm && p.date_of_birth) {
        const age = Math.floor(
          (Date.now() - new Date(p.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
        );
        const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * age;
        let tmb: number;
        if (p.sex === 'male') tmb = base + 5;
        else if (p.sex === 'female') tmb = base - 161;
        else tmb = base - 78; // 'other': promedio de ambas ecuaciones, conservador y no binario
        update.tmb = Math.round(tmb);
        const factor = ACTIVITY_FACTORS[p.activity_level as ActivityLevel];
        if (factor) update.tdee = Math.round(Math.round(tmb) * factor);
      }
    }
  }

  const { error } = await supabase
    .from('patients')
    .update(update)
    .eq('id', patientId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/patients/${patientId}`);

  // Revalidar PWA cuando cambia allow_meal_swaps para que el paciente
  // vea el cambio sin esperar a que expire la caché de Next.js
  if (field === 'allow_meal_swaps') {
    const { data: plan } = await supabase
      .from('nutrition_plans')
      .select('patient_token')
      .eq('patient_id', patientId)
      .in('status', ['approved', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (plan?.patient_token) {
      revalidatePath(`/p/${plan.patient_token}`);
    } else {
      // Fallback: revalidar todas las páginas PWA si no hay plan con token
      revalidatePath('/p/[token]', 'page');
    }
  }

  return {};
}
