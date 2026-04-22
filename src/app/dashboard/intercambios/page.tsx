import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Meal } from '@/types/dietly';

import { IntercambiosList } from './intercambios-list';

export const metadata = { title: 'Intercambios — Dietly' };

type SwapRow = {
  id: string;
  plan_id: string;
  day_number: number;
  meal_index: number;
  original_meal: Meal;
  selected_meal: Meal;
  status: 'pending' | 'approved' | 'rejected';
  initiated_by: 'patient' | 'nutritionist';
  reason: string | null;
  created_at: string;
  patient_name: string;
  is_stale: boolean;
};

const STALE_SWAP_MS = 48 * 60 * 60 * 1000;

export default async function IntercambiosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Obtener todos los swaps del nutricionista con nombre del paciente
  const { data: swaps } = await (supabase as any)
    .from('meal_swaps')
    .select('id, plan_id, day_number, meal_index, original_meal, selected_meal, status, initiated_by, reason, created_at, patients(name)')
    .eq('nutritionist_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const now = Date.now();
  const rows: SwapRow[] = (swaps ?? []).map((s: any) => ({
    id: s.id,
    plan_id: s.plan_id,
    day_number: s.day_number,
    meal_index: s.meal_index,
    original_meal: s.original_meal as Meal,
    selected_meal: s.selected_meal as Meal,
    status: s.status,
    initiated_by: s.initiated_by,
    reason: s.reason,
    created_at: s.created_at,
    patient_name: s.patients?.name ?? 'Paciente',
    is_stale: now - new Date(s.created_at).getTime() > STALE_SWAP_MS,
  }));

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>Intercambios de platos</h1>
        <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-500'>
          Gestiona las sugerencias de cambio de tus pacientes.
        </p>
      </div>
      <IntercambiosList swaps={rows} />
    </div>
  );
}
