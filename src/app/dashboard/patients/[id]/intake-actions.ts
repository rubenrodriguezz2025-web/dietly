'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function saveIntakeFromDashboard(
  patientId: string,
  answers: Record<string, unknown>
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verificar que el paciente pertenece a este nutricionista
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('nutritionist_id', user.id)
    .maybeSingle();

  if (!patient) return { error: 'Paciente no encontrado.' };

  const now = new Date().toISOString();

  // Comprobar si ya existe un intake para este paciente
  const { data: existing } = await supabaseAdminClient
    .from('intake_forms')
    .select('id')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdminClient
      .from('intake_forms')
      .update({
        answers,
        completed_at: now,
        filled_by: 'nutritionist',
        filled_at: now,
      })
      .eq('id', existing.id);

    if (error) return { error: 'Error al guardar el cuestionario.' };
  } else {
    const { error } = await supabaseAdminClient
      .from('intake_forms')
      .insert({
        patient_id: patientId,
        answers,
        completed_at: now,
        filled_by: 'nutritionist',
        filled_at: now,
      });

    if (error) return { error: 'Error al guardar el cuestionario.' };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  return {};
}
