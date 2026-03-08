'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// ── Crear cita ────────────────────────────────────────────────────────────────

export async function createAppointment(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const patient_id = (formData.get('patient_id') as string) || null;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const type = (formData.get('type') as string) || 'presencial';
  const notes = (formData.get('notes') as string) || null;

  if (!date || !time) return { error: 'La fecha y la hora son obligatorias.' };

  const { error } = await (supabase as any).from('appointments').insert({
    nutritionist_id: user.id,
    patient_id,
    date,
    time,
    type,
    notes,
    status: 'scheduled',
  });

  if (error) return { error: 'Error al guardar la cita. Inténtalo de nuevo.' };

  revalidatePath('/dashboard/agenda');
  return { success: true };
}

// ── Cambiar estado de cita ────────────────────────────────────────────────────

export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  if (!id || !status) return;

  await (supabase as any)
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  revalidatePath('/dashboard/agenda');
}

// ── Eliminar cita ─────────────────────────────────────────────────────────────

export async function deleteAppointment(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  if (!id) return;

  await (supabase as any)
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  revalidatePath('/dashboard/agenda');
}
