'use server';

import { createElement } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { PatientWelcomeEmail } from '@/features/emails/patient-welcome';
import { generateIntakeAccessToken } from '@/libs/auth/intake-tokens';
import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActivityLevel } from '@/types/dietly';
import { render } from '@react-email/components';

import { createPatientSchema } from '../patient-schema';

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
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  // 'other': promedio de ambas ecuaciones (base − 78), conservador y no binario
  return base - 78;
}

export async function createPatient(
  _prev: { error?: string; code?: string },
  formData: FormData
): Promise<{ error?: string; code?: string }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // ── Freemium guard: límite 2 pacientes sin suscripción ─────────────────
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'rubenrodriguezz2025@gmail.com';
  const isAdmin = user.email === ADMIN_EMAIL;

  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    const status = profile?.subscription_status;
    const hasActiveSubscription = status === 'trialing' || status === 'active';

    if (!hasActiveSubscription) {
      const { count } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('nutritionist_id', user.id);

      if ((count ?? 0) >= 2) {
        return {
          error: 'Has alcanzado el límite de 2 pacientes gratis. Suscríbete para añadir pacientes ilimitados.',
          code: 'LIMIT_REACHED' as const,
        };
      }
    }
  }

  // Validar consentimiento antes de crear el paciente
  const aiConsent = formData.get('ai_consent') as string | null;
  if (aiConsent !== 'granted') {
    return { error: 'Es necesario aceptar el consentimiento para el tratamiento de datos con IA.' };
  }
  const consentVersion = (formData.get('ai_consent_version') as string) || 'unknown';

  // Extraer y normalizar FormData antes de validar con Zod
  const allergiesRaw = (formData.get('allergies') as string) || '';
  const allergiesNormalized = allergiesRaw.includes('|||')
    ? allergiesRaw.split('|||').filter(Boolean).join(', ')
    : allergiesRaw;
  const intolerancesRaw = (formData.get('intolerances') as string) || '';
  const intolerancesNormalized = intolerancesRaw.includes('|||')
    ? intolerancesRaw.split('|||').filter(Boolean).join(', ')
    : intolerancesRaw;
  const dietaryArr = formData.getAll('dietary_restrictions') as string[];

  const parsed = createPatientSchema.safeParse({
    name: formData.get('name') ?? '',
    email: formData.get('email') ?? '',
    date_of_birth: formData.get('date_of_birth') ?? '',
    sex: formData.get('sex') ?? '',
    weight_kg: formData.get('weight_kg') ?? '',
    height_cm: formData.get('height_cm') ?? '',
    activity_level: formData.get('activity_level') ?? '',
    goal: formData.get('goal') ?? '',
    dietary_restrictions: dietaryArr.length > 0 ? dietaryArr : null,
    allergies: allergiesNormalized,
    intolerances: intolerancesNormalized,
    preferences: formData.get('preferences') ?? '',
    medical_notes: formData.get('medical_notes') ?? '',
    cooking_preference: formData.get('cooking_preference') ?? '',
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = firstIssue?.path?.[0] ? ` (${String(firstIssue.path[0])})` : '';
    return { error: `${firstIssue?.message ?? 'Datos no válidos'}${field}` };
  }

  const {
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
    cooking_preference,
  } = parsed.data;

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
    cooking_preference,
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

  if (email) {
    try {
      const [profileResult, patientTokenResult] = await Promise.all([
        supabaseAdminClient
          .from('profiles')
          .select('full_name, clinic_name')
          .eq('id', user.id)
          .single(),
        supabaseAdminClient
          .from('patients')
          .select('intake_token')
          .eq('id', patientId)
          .single(),
      ]);

      const nutritionistName = profileResult.data?.full_name ?? 'Tu nutricionista';
      const clinicName = profileResult.data?.clinic_name ?? null;
      const intakeToken = patientTokenResult.data?.intake_token as string | null;

      let intakeUrl: string;
      if (intakeToken) {
        try {
          const { url } = await generateIntakeAccessToken(intakeToken);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
          intakeUrl = `${appUrl}${url}`;
        } catch {
          // PLAN_TOKEN_SECRET no configurado en dev — usar URL sin firma
          intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/intake/${intakeToken}`;
        }
      } else {
        intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/patients/${patientId}`;
      }

      const emailElement = createElement(PatientWelcomeEmail, {
        patientName: name,
        nutritionistName,
        clinicName,
        intakeUrl,
      });

      const [html, text] = await Promise.all([
        render(emailElement),
        render(emailElement, { plainText: true }),
      ]);

      const sendResult = await resendClient.emails.send({
        from: 'Dietly <hola@dietly.es>',
        replyTo: 'hola@dietly.es',
        to: email,
        subject: `${nutritionistName} te ha registrado en Dietly`,
        html,
        text,
      });

    } catch (emailError) {
      console.error('[createPatient:email] Excepción al enviar email de bienvenida:', emailError);
    }
  }

  redirect(`/dashboard/patients/${patientId}?created=1`);
}
