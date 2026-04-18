'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export type DuplicatePlanResult =
  | { exists: false }
  | { exists: true; planId: string; status: string };

// Calcula el lunes de la próxima semana — debe coincidir con /api/plans/generate
function getNextMondayISO(): string {
  const now = new Date();
  const daysUntilMonday = ((8 - now.getDay()) % 7) || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + daysUntilMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split('T')[0];
}

export async function checkDuplicatePlan(patientId: string): Promise<DuplicatePlanResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exists: false };

  const weekStartDate = getNextMondayISO();

  const { data } = await (supabase as any)
    .from('nutrition_plans')
    .select('id, status')
    .eq('patient_id', patientId)
    .eq('nutritionist_id', user.id)
    .eq('week_start_date', weekStartDate)
    .neq('status', 'error')
    .limit(1)
    .maybeSingle();

  if (!data) return { exists: false };
  return { exists: true, planId: data.id as string, status: data.status as string };
}
