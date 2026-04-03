'use server';

import { createElement } from 'react';
import { redirect } from 'next/navigation';

import { PatientWelcomeEmail } from '@/features/emails/patient-welcome';
import { generateIntakeAccessToken } from '@/libs/auth/intake-tokens';
import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { render } from '@react-email/components';

export async function sendIntakeEmail(
  patientId: string,
): Promise<{ error?: string; sent?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [patientResult, profileResult] = await Promise.all([
    supabaseAdminClient
      .from('patients')
      .select('email, name, intake_token')
      .eq('id', patientId)
      .eq('nutritionist_id', user.id)
      .single(),
    supabaseAdminClient
      .from('profiles')
      .select('full_name, clinic_name')
      .eq('id', user.id)
      .single(),
  ]);

  if (patientResult.error || !patientResult.data) {
    return { error: 'No se encontró el paciente.' };
  }

  const { email, name, intake_token } = patientResult.data;

  if (!email) {
    return { error: 'Este paciente no tiene email registrado.' };
  }

  const nutritionistName = profileResult.data?.full_name ?? 'Tu nutricionista';
  const clinicName = profileResult.data?.clinic_name ?? null;

  let intakeUrl: string;
  if (intake_token) {
    try {
      const { url } = await generateIntakeAccessToken(intake_token as string);
      intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${url}`;
    } catch {
      intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/intake/${intake_token}`;
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

  const result = await resendClient.emails.send({
    from: 'Dietly <hola@dietly.es>',
    replyTo: 'hola@dietly.es',
    to: email,
    subject: `${nutritionistName} te ha enviado el cuestionario nutricional`,
    html,
    text,
  });

  if (result.error) {
    return { error: result.error.message ?? 'Error al enviar el email.' };
  }

  return { sent: true };
}
