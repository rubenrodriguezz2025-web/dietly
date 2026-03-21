'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function updateRequestStatus(
  requestId: string,
  status: 'in_progress' | 'completed' | 'rejected'
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const update: Record<string, string> = { status };
  if (status === 'completed' || status === 'rejected') {
    update.responded_at = new Date().toISOString();
  }

  const { error } = await (supabase as any)
    .from('data_rights_requests')
    .update(update)
    .eq('id', requestId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error al actualizar la solicitud' };

  revalidatePath('/dashboard/derechos-datos');
  return {};
}
