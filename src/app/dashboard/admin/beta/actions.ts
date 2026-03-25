'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

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
