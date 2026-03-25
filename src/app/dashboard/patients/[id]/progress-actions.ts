'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

type ProgressData = {
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  waist_cm: number | null;
  notes: string | null;
};

export async function addProgressEntry(
  patientId: string,
  data: ProgressData,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('patient_progress').insert({
    patient_id: patientId,
    nutritionist_id: user.id,
    ...data,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/patients/${patientId}`);
  return {};
}

export async function deleteProgressEntry(
  entryId: string,
  patientId: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('patient_progress')
    .delete()
    .eq('id', entryId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/patients/${patientId}`);
  return {};
}
