import { notFound, redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { NutritionPlan, Patient, PatientProgress } from '@/types/dietly';
import { calcTargets } from '@/utils/calc-targets';

import { GenerateButton } from './generate-button';
import { PatientTabs } from './patient-tabs';

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: patient } = (await (supabase as any)
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()) as { data: Patient | null };

  if (!patient) notFound();

  const initialTargets = calcTargets(patient);

  // Consultas en paralelo para minimizar latencia
  const [plansResult, progressResult, patientExtraResult] = await Promise.all([
    (supabase as any)
      .from('nutrition_plans')
      .select('id, status, week_start_date, created_at')
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),

    (supabase as any)
      .from('patient_progress')
      .select('*')
      .eq('patient_id', id)
      .order('recorded_at', { ascending: false }),

    (supabaseAdminClient as any)
      .from('patients')
      .select('intake_token')
      .eq('id', id)
      .single(),
  ]);

  const plans = plansResult.data as NutritionPlan[] | null;
  const progress = (progressResult.data ?? []) as PatientProgress[];
  const intakeToken: string | null = patientExtraResult.data?.intake_token ?? null;

  const { data: intakeForm } = await (supabaseAdminClient as any)
    .from('intake_forms')
    .select('answers, completed_at')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const intakeUrl = intakeToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/p/intake/${intakeToken}`
    : null;

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-medium text-zinc-300'>
            {patient.name
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <h1 className='text-2xl font-bold text-zinc-100'>{patient.name}</h1>
            {patient.email && <p className='mt-0.5 text-sm text-zinc-500'>{patient.email}</p>}
          </div>
        </div>
        <div className='flex flex-col items-end gap-2'>
          {intakeForm ? (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-400'>
              <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
              Cuestionario completado
            </span>
          ) : (
            <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-400'>
              <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />
              Sin cuestionario — se usarán solo los datos básicos
            </span>
          )}
          <GenerateButton
            patientId={id}
            initialTargets={initialTargets}
            patientWeight={patient.weight_kg ?? 70}
            patientGoal={patient.goal ?? 'health'}
          />
        </div>
      </div>

      {/* Tabs: Ficha | Progreso | Cuestionario */}
      <PatientTabs
        patient={patient}
        plans={plans}
        progress={progress}
        intakeForm={intakeForm}
        intakeUrl={intakeUrl}
      />
    </div>
  );
}
