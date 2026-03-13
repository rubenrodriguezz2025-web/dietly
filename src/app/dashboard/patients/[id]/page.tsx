import { notFound, redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { NutritionPlan, Patient, PatientProgress } from '@/types/dietly';

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
        <GenerateButton patientId={id} />
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
