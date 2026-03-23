'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActivityLevel } from '@/types/dietly';

// Campos permitidos para actualizar via inline edit
const ALLOWED_FIELDS = new Set([
  'name', 'email', 'phone', 'date_of_birth', 'sex',
  'weight_kg', 'height_cm', 'activity_level', 'goal',
  'dietary_restrictions', 'allergies', 'intolerances',
  'preferences', 'medical_notes',
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // dietary_restrictions se edita como texto libre (separado por comas) pero se guarda como text[]
  let dbValue: unknown = value;
  if (field === 'dietary_restrictions' && typeof value === 'string') {
    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    dbValue = items.length > 0 ? items : null;
  } else if (field === 'dietary_restrictions' && value === null) {
    dbValue = null;
  }
  const update: Record<string, unknown> = { [field]: dbValue };

  // Recalcular TMB y TDEE cuando cambia un campo biométrico
  if (['sex', 'weight_kg', 'height_cm', 'date_of_birth', 'activity_level'].includes(field)) {
    const { data: patient } = await (supabase as any)
      .from('patients')
      .select('sex, weight_kg, height_cm, date_of_birth, activity_level')
      .eq('id', patientId)
      .eq('nutritionist_id', user.id)
      .single();

    if (patient) {
      const p = { ...patient, [field]: value };
      if (p.sex && p.weight_kg && p.height_cm && p.date_of_birth) {
        const age = Math.floor(
          (Date.now() - new Date(p.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
        );
        const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * age;
        const tmb = p.sex === 'male' ? base + 5 : base - 161;
        update.tmb = Math.round(tmb);
        const factor = ACTIVITY_FACTORS[p.activity_level as ActivityLevel];
        if (factor) update.tdee = Math.round(Math.round(tmb) * factor);
      }
    }
  }

  const { error } = await (supabase as any)
    .from('patients')
    .update(update)
    .eq('id', patientId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/patients/${patientId}`);
  return {};
}
