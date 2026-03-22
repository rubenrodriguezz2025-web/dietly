import { notFound, redirect } from 'next/navigation';

import { generateIntakeAccessToken } from '@/lib/auth/intake-tokens';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { NutritionPlan, Patient, PatientProgress } from '@/types/dietly';
import { CalcTargets, calcTargets,CalcTargetsError } from '@/utils/calc-targets';

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

  let initialTargets: CalcTargets | null = null;
  let targetsError: string | null = null;
  try {
    initialTargets = calcTargets(patient);
  } catch (err) {
    if (err instanceof CalcTargetsError) {
      targetsError = err.message;
    }
  }

  // Consultas en paralelo para minimizar latencia
  const [plansResult, progressResult, patientExtraResult, followupFormsResult, nextReminderResult, overdueReminderResult] = await Promise.all([
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

    (supabase as any)
      .from('followup_forms')
      .select('id, created_at, completed_at, answers')
      .eq('patient_id', id)
      .eq('nutritionist_id', user.id)
      .order('created_at', { ascending: false }),

    (supabase as any)
      .from('followup_reminders')
      .select('id, remind_at, status')
      .eq('patient_id', id)
      .eq('nutritionist_id', user.id)
      .in('status', ['pending'])
      .order('remind_at', { ascending: true })
      .limit(1)
      .maybeSingle(),

    (supabase as any)
      .from('followup_reminders')
      .select('id, remind_at')
      .eq('patient_id', id)
      .eq('nutritionist_id', user.id)
      .eq('status', 'sent')
      .order('remind_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const plans = plansResult.data as NutritionPlan[] | null;
  const progress = (progressResult.data ?? []) as PatientProgress[];
  const intakeToken: string | null = patientExtraResult.data?.intake_token ?? null;
  const followupForms = (followupFormsResult.data ?? []) as Array<{
    id: string;
    created_at: string;
    completed_at: string | null;
    answers: Record<string, string> | null;
  }>;
  const nextReminder = nextReminderResult.data as { id: string; remind_at: string; status: string } | null;
  const overdueReminder = overdueReminderResult.data as { id: string; remind_at: string } | null;

  const [intakeFormResult, consentResult] = await Promise.all([
    (supabaseAdminClient as any)
      .from('intake_forms')
      .select('answers, completed_at')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Consentimiento activo (no revocado) para procesamiento con IA
    (supabaseAdminClient as any)
      .from('patient_consents')
      .select('id')
      .eq('patient_id', id)
      .eq('consent_type', 'ai_processing')
      .is('revoked_at', null)
      .limit(1)
      .maybeSingle(),
  ]);

  const intakeForm = intakeFormResult.data;
  const hasConsent = !!consentResult.data;

  let intakeUrl: string | null = null;
  if (intakeToken) {
    try {
      const { url } = await generateIntakeAccessToken(intakeToken);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      intakeUrl = `${appUrl}${url}`;
    } catch {
      // Si falta PLAN_TOKEN_SECRET en dev, caer a URL sin firma
      intakeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/intake/${intakeToken}`;
    }
  }

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
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-2xl font-bold text-zinc-100'>{patient.name}</h1>
              {overdueReminder && (
                <span className='rounded-full bg-red-950 px-2.5 py-0.5 text-xs font-medium text-red-400'>
                  Revisión vencida
                </span>
              )}
              {!overdueReminder && nextReminder && (
                <span className='rounded-full bg-amber-950 px-2.5 py-0.5 text-xs font-medium text-amber-400'>
                  Próxima revisión:{' '}
                  {new Date(nextReminder.remind_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
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
            hasIntake={!!intakeForm}
            hasConsent={hasConsent}
          />
        </div>
      </div>

      {/* Tabs: Ficha | Progreso | Cuestionario */}
      {targetsError && (
        <div className='rounded-lg border border-amber-700/40 bg-amber-950/10 px-4 py-3 text-sm text-amber-300'>
          <span className='font-semibold'>Datos incompletos:</span>{' '}{targetsError}
        </div>
      )}

      <PatientTabs
        patient={patient}
        plans={plans}
        progress={progress}
        intakeForm={intakeForm}
        intakeUrl={intakeUrl}
        followupForms={followupForms}
        nextReminder={nextReminder}
        overdueReminder={overdueReminder}
      />
    </div>
  );
}
