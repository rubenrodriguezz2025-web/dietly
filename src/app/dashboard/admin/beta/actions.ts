'use server';

import { createElement } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { BetaWelcomeEmail } from '@/features/emails/beta-welcome';
import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { render } from '@react-email/render';

const ADMIN_EMAIL = 'rubenrodriguezz2025@gmail.com';

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard');
  }
}

export async function addBetaEmail(formData: FormData): Promise<{ error?: string }> {
  await assertAdmin();

  const email = (formData.get('email') as string | null)?.toLowerCase().trim();
  const name = (formData.get('name') as string | null)?.trim() || null;
  const notes = (formData.get('notes') as string | null)?.trim() || null;

  if (!email) return { error: 'El email es obligatorio.' };

  const { error } = await supabaseAdminClient
    .from('beta_whitelist')
    .insert({ email, name, notes });

  if (error) {
    if (error.code === '23505') return { error: 'Ese email ya está en la lista.' };
    return { error: `Error al añadir: ${error.message}` };
  }

  // Enviar email de bienvenida beta (no bloquea si falla)
  try {
    const html = await render(createElement(BetaWelcomeEmail, { name }));
    await resendClient.emails.send({
      from: 'Rubén de Dietly <hola@dietly.es>',
      to: email,
      subject: 'Ya tienes acceso a Dietly 🎉',
      html,
    });
  } catch {
    // El email fallido no debe impedir añadir el email a la lista
  }

  revalidatePath('/dashboard/admin/beta');
  return {};
}

export async function removeBetaEmail(id: string): Promise<{ error?: string }> {
  await assertAdmin();

  const { error } = await supabaseAdminClient
    .from('beta_whitelist')
    .delete()
    .eq('id', id);

  if (error) return { error: `Error al eliminar: ${error.message}` };

  revalidatePath('/dashboard/admin/beta');
  return {};
}
