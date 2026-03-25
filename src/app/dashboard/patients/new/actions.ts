'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActivityLevel } from '@/types/dietly';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function calculateTMB(
  sex: string,
  weight_kg: number,
  height_cm: number,
  date_of_birth: string
): number {
  const age = Math.floor(
    (Date.now() - new Date(date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  // Mifflin-St Jeor
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export async function createPatient(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Validar consentimiento antes de crear el paciente
  const aiConsent = formData.get('ai_consent') as string | null;
  if (aiConsent !== 'granted') {
    return { error: 'Es necesario aceptar el consentimiento para el tratamiento de datos con IA.' };
  }
  const consentVersion = (formData.get('ai_consent_version') as string) || 'unknown';

  const name = formData.get('name') as string;
  const email = (formData.get('email') as string) || null;
  const date_of_birth = (formData.get('date_of_birth') as string) || null;

  // Bloquear menores de 18 años
  if (date_of_birth) {
    const birth = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 18) {
      return {
        error:
          'Este paciente es menor de edad. Para generar planes nutricionales para menores se requiere consentimiento parental por escrito. Contacta con hola@dietly.es para más información.',
      };
    }
  }
  const sex = (formData.get('sex') as string) || null;
  const weight_kg = formData.get('weight_kg') ? Number(formData.get('weight_kg')) : null;
  const height_cm = formData.get('height_cm') ? Number(formData.get('height_cm')) : null;
  const activity_level = (formData.get('activity_level') as ActivityLevel) || null;
  const goal = (formData.get('goal') as string) || null;
  const dietary_restrictions_arr = formData.getAll('dietary_restrictions') as string[];
  const dietary_restrictions = dietary_restrictions_arr.length > 0 ? dietary_restrictions_arr : null;
  const allergies = (formData.get('allergies') as string) || null;
  const intolerances = (formData.get('intolerances') as string) || null;
  const preferences = (formData.get('preferences') as string) || null;
  const medical_notes = (formData.get('medical_notes') as string) || null;

  // Calcular TMB y TDEE si hay suficientes datos
  let tmb: number | null = null;
  let tdee: number | null = null;
  if (sex && weight_kg && height_cm && date_of_birth) {
    tmb = Math.round(calculateTMB(sex, weight_kg, height_cm, date_of_birth));
    if (activity_level) {
      tdee = Math.round(tmb * ACTIVITY_FACTORS[activity_level]);
    }
  }

  // Pre-generar el UUID para no depender del SELECT post-INSERT
  // (evita errores PGRST116 si el SELECT falla por timing de RLS)
  const patientId = crypto.randomUUID();

  const { error } = await supabase.from('patients').insert({
    id: patientId,
    nutritionist_id: user.id,
    name,
    email,
    date_of_birth,
    sex,
    weight_kg,
    height_cm,
    activity_level,
    goal,
    dietary_restrictions,
    allergies,
    intolerances,
    preferences,
    medical_notes,
    tmb,
    tdee,
  });

  if (error) {
    console.error('[createPatient] Error al insertar paciente:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: `Error al guardar el paciente: ${error.message}` };
  }

  // Registrar consentimiento — obtener IP del nutricionista para auditoría RGPD
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    reqHeaders.get('x-real-ip') ??
    null;

  const { error: consentError } = await supabase.from('patient_consents').insert({
    patient_id: patientId,
    nutritionist_id: user.id,
    consent_type: 'ai_processing',
    consent_text_version: consentVersion,
    ip_address: ip,
  });

  if (consentError) {
    // No bloqueamos la creación del paciente si el consentimiento falla,
    // pero sí lo registramos para auditoría
    console.error('[createPatient] Error al registrar consentimiento:', {
      code: consentError.code,
      message: consentError.message,
      patient_id: patientId,
    });
  }

  redirect(`/dashboard/patients/${patientId}`);
}
