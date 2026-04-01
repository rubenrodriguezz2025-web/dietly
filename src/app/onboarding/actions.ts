'use server';

import { redirect } from 'next/navigation';

import { resendClient } from '@/libs/resend/resend-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function saveProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const full_name = (formData.get('full_name') as string).trim();
  const clinic_name = (formData.get('clinic_name') as string).trim() || null;
  const specialty = formData.get('specialty') as string;
  const college_number = (formData.get('college_number') as string | null)?.trim() || null;
  const aiLiteracy = formData.get('ai_literacy') === 'on';

  if (!aiLiteracy) {
    return { error: 'Debes confirmar que conoces las capacidades y limitaciones de la IA.' };
  }

  const now = new Date().toISOString();
  const profileData = {
    id: user.id,
    full_name,
    clinic_name,
    specialty,
    ...(college_number ? { college_number } : {}),
    ai_literacy_acknowledged_at: now,
    onboarding_completed_at: now,
  };

  const { error } = await (supabase as any).from('profiles').upsert(profileData);

  // Si PostgREST no reconoce ai_literacy_acknowledged_at (schema cache stale),
  // reintentamos sin ese campo para no bloquear el onboarding
  if (error?.message?.includes('schema cache')) {
    console.warn('[onboarding] Schema cache stale — reintentando sin ai_literacy_acknowledged_at');
    const { ai_literacy_acknowledged_at: _, ...fallbackData } = profileData;
    const { error: retryError } = await (supabase as any).from('profiles').upsert(fallbackData);
    if (retryError) {
      return { error: retryError.message };
    }
  } else if (error) {
    return { error: error.message };
  }

  // Notificación interna — no bloqueamos el onboarding si el email falla
  try {
    const fecha = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await resendClient.emails.send({
      from: 'Dietly <noreply@dietly.es>',
      to: 'hola@dietly.es',
      subject: 'Nuevo registro Dietly',
      text: [
        'Nuevo usuario registrado en Dietly',
        '',
        `Nombre:              ${full_name}`,
        `Email:               ${user.email ?? '—'}`,
        `Nº colegiado:        ${college_number}`,
        `Fecha de registro:   ${fecha}`,
      ].join('\n'),
    });
  } catch {
    // El email de notificación no es crítico; continuamos igualmente
  }

  redirect('/dashboard');
}
