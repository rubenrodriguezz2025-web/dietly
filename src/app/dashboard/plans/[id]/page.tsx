import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { NutritionPlan, PlanContent } from '@/types/dietly';
import { GOAL_LABELS, PLAN_STATUS_LABELS } from '@/types/dietly';

import { PlanEditor } from './plan-editor';

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: plan } = (await (supabase as any)
    .from('nutrition_plans')
    .select('*, patients(id, name)')
    .eq('id', id)
    .single()) as {
    data: (NutritionPlan & { patients: { id: string; name: string } | null }) | null;
  };

  if (!plan) notFound();

  const content = plan.content as PlanContent | null;
  const isGenerating = plan.status === 'generating';
  const hasError = plan.status === 'error';

  return (
    <div className='flex flex-col gap-8'>
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
          </div>
          {plan.status === 'draft' && (
            <p className='mt-1 text-xs text-zinc-600'>
              Borrador generado por IA · Revisa cada día y aprueba cuando esté listo
            </p>
          )}
          {plan.status === 'approved' && (
            <p className='mt-1 text-xs text-emerald-500/70'>
              Plan aprobado por el nutricionista · Listo para enviar al paciente
            </p>
          )}
        </div>

        {plan.status === 'approved' && (
          <a
            href={`/api/plans/${id}/pdf`}
            download
            className='inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7 10 12 15 17 10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
            Descargar PDF
          </a>
        )}
      </div>

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

      {/* Generating spinner */}
      {isGenerating && (
        <div className='flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
          <div className='flex items-center gap-3'>
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-200' />
            <p className='text-zinc-400'>Generando el plan nutricional... Esto puede tardar 2-3 minutos.</p>
          </div>
          <p className='text-xs text-zinc-600'>
            Si llevas más de 5 minutos aquí,{' '}
            {plan.patients && (
              <Link
                href={`/dashboard/patients/${plan.patients.id}`}
                className='text-zinc-400 underline hover:text-zinc-200'
              >
                vuelve a la ficha del paciente
              </Link>
            )}{' '}
            y genera un nuevo plan.
          </p>
        </div>
      )}

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

          <h2 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Resumen semanal
          </h2>
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
                />
                <MacroStat
                  label='Proteína media'
                  value={`${content.week_summary.weekly_averages.protein_g}g`}
                  accent
                />
                <MacroStat
                  label='Carbos media'
                  value={`${content.week_summary.weekly_averages.carbs_g}g`}
                  accent
                />
                <MacroStat
                  label='Grasa media'
                  value={`${content.week_summary.weekly_averages.fat_g}g`}
                  accent
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Days */}
      {!isGenerating && content?.days && content.days.length > 0 ? (
        <PlanEditor days={content.days} planId={id} isDraft={plan.status === 'draft'} />
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

// ── Utility components ────────────────────────────────────────────────────────

function MacroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-zinc-600'>{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-emerald-400' : 'text-zinc-200'}`}>
        {value}
      </span>
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-zinc-800 text-zinc-400'}`}
    >
      {PLAN_STATUS_LABELS[status as keyof typeof PLAN_STATUS_LABELS] ?? status}
    </span>
  );
}
