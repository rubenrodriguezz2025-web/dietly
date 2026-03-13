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
  const college_number = (formData.get('college_number') as string).trim();

  if (!college_number || college_number.length < 4) {
    return { error: 'El número de colegiado debe tener al menos 4 caracteres.' };
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name,
    clinic_name,
    specialty,
    college_number,
  });

  if (error) {
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
