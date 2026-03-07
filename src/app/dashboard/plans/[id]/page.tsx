import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Meal, NutritionPlan, PlanContent, PlanDay } from '@/types/dietly';
import { PLAN_STATUS_LABELS } from '@/types/dietly';

import { ApproveButton } from './approve-button';
import { RegenerateDayButton } from './regenerate-day-button';

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
            <p className='mt-1 text-xs text-green-700'>
              Plan aprobado por el nutricionista · Listo para enviar al paciente
            </p>
          )}
        </div>

        {plan.status === 'draft' && <ApproveButton planId={id} />}
      </div>

      {/* Generating spinner */}
      {isGenerating && (
        <div className='flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-200' />
          <p className='text-zinc-400'>Generando el plan nutricional... Esto puede tardar 2-3 minutos.</p>
        </div>
      )}

      {/* Weekly summary */}
      {content?.week_summary && !isGenerating && (
        <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
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
              value={`${content.week_summary.target_macros.protein_g}g`}
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
        <div className='flex flex-col gap-6'>
          {content.days.map((day) => (
            <DayCard key={day.day_number} day={day} planId={id} />
          ))}
        </div>
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

// ── Day card ──────────────────────────────────────────────────────────────────

function DayCard({ day, planId }: { day: PlanDay; planId: string }) {
  const invalidMealIndexes = day.meals
    .map((m, i) => (m.calories <= 0 || m.ingredients.length < 2 ? i : -1))
    .filter((i) => i >= 0);

  const hasInvalidMeals = invalidMealIndexes.length > 0;

  return (
    <div
      className={`rounded-xl border bg-zinc-950 ${hasInvalidMeals ? 'border-red-800' : 'border-zinc-800'}`}
    >
      {/* Day header */}
      <div className='flex items-center justify-between border-b border-zinc-800 px-5 py-4'>
        <div>
          <h3 className='font-semibold text-zinc-100'>{day.day_name}</h3>
          <div className='mt-0.5 flex gap-3 text-xs text-zinc-500'>
            <span>{day.total_calories} kcal</span>
            <span>·</span>
            <span>{day.total_macros.protein_g}g P</span>
            <span>·</span>
            <span>{day.total_macros.carbs_g}g C</span>
            <span>·</span>
            <span>{day.total_macros.fat_g}g G</span>
          </div>
        </div>
        {hasInvalidMeals && (
          <div className='flex items-center gap-3'>
            <span className='text-xs text-red-400'>
              {invalidMealIndexes.length} comida{invalidMealIndexes.length > 1 ? 's' : ''} con error
            </span>
            <RegenerateDayButton planId={planId} dayNumber={day.day_number} dayName={day.day_name} />
          </div>
        )}
      </div>

      {/* Meals */}
      <div className='divide-y divide-zinc-900'>
        {day.meals.map((meal, i) => (
          <MealCard key={i} meal={meal} isInvalid={invalidMealIndexes.includes(i)} />
        ))}
      </div>
    </div>
  );
}

// ── Meal card ─────────────────────────────────────────────────────────────────

const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

function MealCard({ meal, isInvalid }: { meal: Meal; isInvalid: boolean }) {
  return (
    <div className={`px-5 py-4 ${isInvalid ? 'bg-red-950/20' : ''}`}>
      {/* Meal header */}
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <div className='flex items-center gap-2'>
            {isInvalid && (
              <span className='rounded bg-red-900 px-1.5 py-0.5 text-xs font-medium text-red-300'>
                Error
              </span>
            )}
            <span className='text-xs font-medium uppercase tracking-wider text-zinc-600'>
              {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
            </span>
            {meal.time_suggestion && (
              <span className='text-xs text-zinc-700'>{meal.time_suggestion}</span>
            )}
          </div>
          <h4 className='mt-1 font-medium text-zinc-100'>{meal.meal_name}</h4>
        </div>

        {/* Macros — always visible (F-02) */}
        <div className='flex flex-shrink-0 gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs'>
          <MacroChip value={meal.calories} unit='kcal' bold />
          <span className='text-zinc-700'>|</span>
          <MacroChip value={meal.macros.protein_g} unit='P' />
          <MacroChip value={meal.macros.carbs_g} unit='C' />
          <MacroChip value={meal.macros.fat_g} unit='G' />
        </div>
      </div>

      {/* Ingredients — always visible (F-03) */}
      {meal.ingredients.length > 0 && (
        <ul className='mt-3 flex flex-wrap gap-2'>
          {meal.ingredients.map((ing, i) => (
            <li
              key={i}
              className='rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400'
            >
              {ing.name}{' '}
              <span className='text-zinc-600'>
                {ing.quantity} {ing.unit}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Preparation */}
      {meal.preparation && (
        <p className='mt-3 text-sm leading-relaxed text-zinc-500'>{meal.preparation}</p>
      )}

      {/* Notes */}
      {meal.notes && <p className='mt-1 text-xs italic text-zinc-600'>{meal.notes}</p>}
    </div>
  );
}

// ── Utility components ────────────────────────────────────────────────────────

function MacroChip({
  value,
  unit,
  bold,
}: {
  value: number;
  unit: string;
  bold?: boolean;
}) {
  return (
    <span className={bold ? 'font-semibold text-zinc-200' : 'text-zinc-400'}>
      {value}
      <span className='ml-0.5 text-zinc-600'>{unit}</span>
    </span>
  );
}

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
