import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type React from 'react';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { validateNutritionPlan, type ValidatorPatient } from '@/libs/validation/nutrition-validator';
import type { NutritionPlan, Patient, PlanContent } from '@/types/dietly';
import { GOAL_LABELS, PLAN_STATUS_LABELS } from '@/types/dietly';

import { GeneratingPoller } from './generating-poller';
import { PlanActionsBar } from './plan-actions-bar';
import { PlanEditor } from './plan-editor';
import { ReminderModal } from './reminder-modal';

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ approved?: string }>;
}) {
  const { id } = await params;
  const { approved } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: plan } = (await (supabase as any)
    .from('nutrition_plans')
    .select('*, patients(*), validation_acked_blocks')
    .eq('id', id)
    .single()) as {
    data: (NutritionPlan & {
      patients: Patient | null;
      validation_acked_blocks: string[];
    }) | null;
  };

  if (!plan) notFound();

  const content = plan.content as PlanContent | null;
  const isGenerating = plan.status === 'generating';
  const hasError = plan.status === 'error';

  // Ejecutar validación clínica sobre el borrador
  const validationResult =
    plan.status === 'draft' && content?.days?.length
      ? validateNutritionPlan(content, (plan.patients as unknown as ValidatorPatient) ?? {} as ValidatorPatient)
      : undefined;

  const showReminderModal = approved === '1' && plan.status === 'approved' && !!plan.patients;

  // Obtener registro de visitas y perfil del nutricionista en paralelo
  const [{ data: planView }, { data: profile }] = await Promise.all([
    (supabase as any)
      .from('plan_views')
      .select('open_count, last_opened_at')
      .eq('plan_id', id)
      .maybeSingle() as Promise<{ data: { open_count: number; last_opened_at: string } | null }>,
    (supabase as any)
      .from('profiles')
      .select('college_number')
      .eq('id', user.id)
      .single() as Promise<{ data: { college_number: string | null } | null }>,
  ]);

  const hasCollegeNumber = !!profile?.college_number && profile.college_number.trim().length >= 4;

  return (
    <div className='flex flex-col gap-8'>
      {/* Modal de recordatorio post-aprobación */}
      {showReminderModal && plan.patients && (
        <ReminderModal
          patientId={plan.patients.id}
          nutritionistId={user.id}
          patientName={plan.patients.name}
        />
      )}
      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 text-sm text-zinc-500'>
            {plan.patients && (
              <>
                <Link
                  href={`/dashboard/patients/${plan.patients.id}`}
                  className='hover:text-zinc-300'
                >
                  {plan.patients.name}
                </Link>
                <span className='text-zinc-700'>/</span>
              </>
            )}
            <span>
              Semana del{' '}
              {new Date(plan.week_start_date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className='mt-1 flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-bold text-zinc-100'>Plan nutricional</h1>
            <StatusBadge status={plan.status} />
            <PlanViewBadge view={planView} />
          </div>
          {plan.status === 'draft' && (
            <AiBadge generatedAt={plan.generated_at} />
          )}
          {plan.status === 'approved' && (
            <p className='mt-1 text-xs text-emerald-500/70'>
              Plan aprobado por el nutricionista · Listo para enviar al paciente
            </p>
          )}
        </div>

        {!isGenerating && !hasError && (
          <PlanActionsBar
            planId={id}
            status={plan.status}
            patientToken={plan.patient_token}
            patientName={plan.patients?.name ?? ''}
            patientEmail={plan.patients?.email ?? ''}
            planTitle={`Semana del ${new Date(plan.week_start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            hasEmail={!!plan.patients?.email}
            hasCollegeNumber={hasCollegeNumber}
            approvedDaysCount={content?.days?.filter((d) => d.day_status === 'approved').length ?? 0}
            totalDaysCount={content?.days?.length ?? 7}
            sentAt={plan.sent_at ?? null}
          />
        )}
      </div>

      {/* Lifecycle stepper */}
      {!isGenerating && !hasError && (
        <PlanLifecycle status={plan.status} />
      )}

      {/* Error state */}
      {hasError && (
        <div className='flex flex-col gap-3 rounded-xl border border-red-900 bg-red-950/30 p-6'>
          <p className='text-sm font-medium text-red-400'>
            La generación del plan falló en algún punto.
          </p>
          {plan.patients && (
            <Link
              href={`/dashboard/patients/${plan.patients.id}`}
              className='w-fit rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-700'
            >
              ← Volver al paciente y generar de nuevo
            </Link>
          )}
        </div>
      )}

      {/* Generating — poller con auto-refresh cuando el plan termina */}
      {isGenerating && <GeneratingPoller planId={id} />}

      {/* Weekly summary */}
      {content?.week_summary && !isGenerating && (
        <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
          {/* Card de criterios del plan */}
          {content.week_summary.protein_per_kg && (
            <div className='mb-4 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5'>
              <p className='text-xs text-zinc-400'>
                <span className='font-medium text-zinc-300'>Plan generado con: </span>
                {content.week_summary.target_daily_calories} kcal/día
                {' · '}
                {content.week_summary.target_macros.protein_g}g proteína ({content.week_summary.protein_per_kg}g/kg)
                {' · '}
                {Math.round((content.week_summary.carbs_pct ?? 0.55) * 100)}% carbohidratos
                {' · '}
                {Math.round((content.week_summary.fat_pct ?? 0.45) * 100)}% grasa
                {content.week_summary.goal && (
                  <>
                    {' · '}Objetivo: {GOAL_LABELS[content.week_summary.goal as keyof typeof GOAL_LABELS] ?? content.week_summary.goal}
                  </>
                )}
              </p>
            </div>
          )}

          <div className='mb-4 flex items-center gap-2'>
            <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              Resumen semanal
            </h2>
            {/* Tooltip de transparencia IA — solo visible para el nutricionista */}
            <div className='group relative'>
              <button
                type='button'
                aria-label='Información sobre los valores nutricionales'
                className='flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[9px] font-bold text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-400'
              >
                i
              </button>
              <div className='pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-72 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs leading-relaxed text-zinc-400 opacity-0 shadow-xl shadow-black/40 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100'>
                <p className='font-medium text-zinc-300'>Sobre los valores nutricionales</p>
                <p className='mt-1.5'>
                  Los valores nutricionales son <strong className='text-zinc-200'>estimaciones generadas por IA</strong> basadas en la composición media de los alimentos. No proceden de una base de datos verificada externa.
                </p>
                <p className='mt-1.5'>
                  El plan ha sido revisado y aprobado por el nutricionista responsable.
                </p>
                <div className='absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-zinc-700 bg-zinc-900' />
              </div>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <MacroStat
              label='Kcal objetivo/día'
              value={`${content.week_summary.target_daily_calories} kcal`}
            />
            <MacroStat
              label='Proteína objetivo'
              value={
                content.week_summary.protein_per_kg
                  ? `${content.week_summary.target_macros.protein_g}g (${content.week_summary.protein_per_kg}g/kg)`
                  : `${content.week_summary.target_macros.protein_g}g`
              }
            />
            <MacroStat
              label='Carbohidratos objetivo'
              value={`${content.week_summary.target_macros.carbs_g}g`}
            />
            <MacroStat
              label='Grasa objetivo'
              value={`${content.week_summary.target_macros.fat_g}g`}
            />
          </div>

          {content.week_summary.weekly_averages.calories > 0 && (
            <div className='mt-4 border-t border-zinc-800 pt-4'>
              <p className='mb-3 text-xs text-zinc-600'>Promedios reales del plan generado</p>
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <MacroStat
                  label='Kcal media/día'
                  value={`${content.week_summary.weekly_averages.calories} kcal`}
                  accent
                  target={content.week_summary.target_daily_calories}
                  actual={content.week_summary.weekly_averages.calories}
                />
                <MacroStat
                  label='Proteína media'
                  value={`${content.week_summary.weekly_averages.protein_g}g`}
                  accent
                  target={content.week_summary.target_macros.protein_g}
                  actual={content.week_summary.weekly_averages.protein_g}
                />
                <MacroStat
                  label='Carbos media'
                  value={`${content.week_summary.weekly_averages.carbs_g}g`}
                  accent
                  target={content.week_summary.target_macros.carbs_g}
                  actual={content.week_summary.weekly_averages.carbs_g}
                />
                <MacroStat
                  label='Grasa media'
                  value={`${content.week_summary.weekly_averages.fat_g}g`}
                  accent
                  target={content.week_summary.target_macros.fat_g}
                  actual={content.week_summary.weekly_averages.fat_g}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Days */}
      {!isGenerating && content?.days && content.days.length > 0 ? (
        <PlanEditor
          days={content.days}
          planId={id}
          isDraft={plan.status === 'draft'}
          validationResult={validationResult}
        />
      ) : (
        !isGenerating && (
          <div className='rounded-xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500'>
            Sin datos de plan.
          </div>
        )
      )}
    </div>
  );
}

// ── Plan lifecycle stepper ────────────────────────────────────────────────────

const LIFECYCLE_STEPS = [
  { key: 'draft',    label: 'Borrador generado' },
  { key: 'approved', label: 'Aprobado por ti' },
  { key: 'sent',     label: 'Enviado al paciente' },
] as const;

const STATUS_STEP: Record<string, number> = {
  draft:    0,
  approved: 1,
  sent:     2,
};

function PlanLifecycle({ status }: { status: string }) {
  const current = STATUS_STEP[status] ?? 0;
  return (
    <div className='flex items-center gap-0'>
      {LIFECYCLE_STEPS.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={step.key} className='flex flex-1 items-center'>
            <div className='flex flex-1 flex-col items-center gap-1.5'>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-[#1a7a45] text-white'
                    : active
                      ? 'border-2 border-[#1a7a45] bg-[#1a7a45]/10 text-emerald-400'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-700'
                }`}
              >
                {done ? (
                  <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-center text-[11px] font-medium leading-tight ${done || active ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {step.label}
              </span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className={`mb-5 h-px flex-1 transition-colors ${i < current ? 'bg-[#1a7a45]/60' : 'bg-zinc-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Utility components ────────────────────────────────────────────────────────

function AiBadge({ generatedAt }: { generatedAt: string | null }) {
  const fechaGeneracion = generatedAt
    ? new Date(generatedAt).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className='mt-2 flex items-start gap-2.5 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2'>
      {/* Icono de chispa */}
      <svg
        className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500'
        viewBox='0 0 24 24'
        fill='currentColor'
      >
        <path d='M13 2L4.09 12.96A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.96A1 1 0 0 0 19 9.5H13.5L13 2z' />
      </svg>
      <div className='min-w-0'>
        <p className='text-xs font-medium text-amber-400'>
          Borrador generado por IA · Revisa cada día y aprueba cuando estés listo
        </p>
        {fechaGeneracion && (
          <p className='mt-0.5 text-[11px] text-zinc-600'>Generado el {fechaGeneracion}</p>
        )}
      </div>
    </div>
  );
}

function MacroStat({
  label,
  value,
  accent,
  target,
  actual,
}: {
  label: string;
  value: string;
  accent?: boolean;
  target?: number;
  actual?: number;
}) {
  let indicator: React.ReactNode = null;
  if (target !== undefined && actual !== undefined && target > 0) {
    const pct = Math.abs((actual - target) / target * 100);
    if (pct > 10) {
      indicator = (
        <span
          title={`Desviación del ${Math.round(pct)}% respecto al objetivo`}
          className='cursor-help text-xs text-amber-400'
          aria-label={`Desviación del ${Math.round(pct)}%`}
        >
          ⚠ {Math.round(pct)}%
        </span>
      );
    } else {
      indicator = (
        <span
          title={`Dentro del objetivo (${Math.round(pct)}% desviación)`}
          className='cursor-help text-xs text-emerald-500'
          aria-label='Dentro del objetivo'
        >
          ✓
        </span>
      );
    }
  }

  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-zinc-600'>{label}</span>
      <div className='flex items-center gap-1.5'>
        <span className={`text-sm font-medium ${accent ? 'text-emerald-400' : 'text-zinc-200'}`}>
          {value}
        </span>
        {indicator}
      </div>
    </div>
  );
}

const STATUS_COLORS: Partial<Record<string, string>> = {
  generating: 'bg-zinc-800 text-zinc-400',
  draft: 'bg-amber-950 text-amber-400',
  approved: 'bg-green-950 text-green-400',
  sent: 'bg-blue-950 text-blue-400',
  error: 'bg-red-950 text-red-400',
};

function PlanViewBadge({
  view,
}: {
  view: { open_count: number; last_opened_at: string } | null;
}) {
  if (!view || view.open_count === 0) {
    return (
      <span className='rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs text-zinc-500'>
        No abierto aún
      </span>
    );
  }

  const fecha = new Date(view.last_opened_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const hora = new Date(view.last_opened_at).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <span className='rounded-full border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-0.5 text-xs text-emerald-400'>
      ✓ Visto el {fecha} a las {hora}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-zinc-800 text-zinc-400'}`}
    >
      {PLAN_STATUS_LABELS[status as keyof typeof PLAN_STATUS_LABELS] ?? status}
    </span>
  );
}
