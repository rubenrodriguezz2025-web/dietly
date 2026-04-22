'use client';

import { useState } from 'react';

import type { Patient } from '@/types/dietly';
import type { CalcTargets } from '@/utils/calc-targets';

// ── Etiquetas y estilos por objetivo ─────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Pérdida de peso',
  weight_gain: 'Ganancia de peso',
  maintenance: 'Mantenimiento',
  muscle_gain: 'Ganancia muscular',
  health:      'Salud general',
};

const GOAL_BADGE_CLASS: Record<string, string> = {
  weight_loss: 'bg-sky-100 text-sky-800 border border-sky-200',
  weight_gain: 'bg-orange-100 text-orange-800 border border-orange-200',
  maintenance: 'bg-zinc-100 text-zinc-800 border border-zinc-200',
  muscle_gain: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  health:      'bg-teal-100 text-teal-800 border border-teal-200',
};

// ── Componente principal ──────────────────────────────────────────────────────

type Props = {
  patient: Patient;
  targets: CalcTargets;
};

export function MacroTransparencyCard({ patient, targets }: Props) {
  const [open, setOpen] = useState(true);
  const goal = patient.goal ?? 'health';

  // Porcentajes reales sobre calorías totales (más informativos que los ratios internos)
  const proteinPct = Math.round((targets.protein_g * 4) / targets.calories * 100);
  const carbsPct   = Math.round((targets.carbs_g   * 4) / targets.calories * 100);
  const fatPct     = Math.round((targets.fat_g      * 9) / targets.calories * 100);

  return (
    <div className='rounded-xl border border-zinc-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50'>
      {/* ── Header / toggle ──────────────────────────────────────────────── */}
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className='flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left'
      >
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium text-zinc-800 dark:text-zinc-300'>Objetivos calculados</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${GOAL_BADGE_CLASS[goal] ?? GOAL_BADGE_CLASS.health}`}
          >
            {GOAL_LABELS[goal] ?? goal}
          </span>
          {targets.estimated && (
            <span className='rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800'>
              Estimado con Mifflin-St Jeor
            </span>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>

      {/* ── Cuerpo colapsable ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 350ms cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <div className='overflow-hidden'>
          <div className='border-t border-zinc-200 px-5 py-4 dark:border-zinc-800'>
            <div className='grid gap-5 sm:grid-cols-2'>

              {/* Columna izquierda — metabolismo */}
              <div>
                <p className='mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600'>
                  Metabolismo
                </p>
                <dl className='grid grid-cols-2 gap-x-4 gap-y-2.5'>
                  {targets.tmb !== null && (
                    <>
                      <dt className='text-xs text-zinc-600 dark:text-zinc-500'>TMB</dt>
                      <dd className='text-right text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-300'>
                        {targets.tmb}{' '}
                        <span className='font-normal text-zinc-500 dark:text-zinc-600'>kcal</span>
                      </dd>
                    </>
                  )}
                  <dt className='text-xs text-zinc-600 dark:text-zinc-500'>TDEE</dt>
                  <dd className='text-right text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-300'>
                    {targets.tdee}{' '}
                    <span className='font-normal text-zinc-500 dark:text-zinc-600'>kcal</span>
                  </dd>
                  <dt className='text-xs text-zinc-600 dark:text-zinc-500'>Objetivo</dt>
                  <dd className='text-right text-xs font-semibold tabular-nums text-zinc-900 dark:text-zinc-200'>
                    {targets.calories}{' '}
                    <span className='font-normal text-zinc-500 dark:text-zinc-600'>kcal</span>
                  </dd>
                  <dt className='text-xs text-zinc-600 dark:text-zinc-500'>Balance</dt>
                  <dd className='text-right'>
                    <BalanceValue value={targets.calorie_balance} />
                  </dd>
                </dl>
              </div>

              {/* Columna derecha — macronutrientes */}
              <div className='sm:border-l sm:border-zinc-200 sm:pl-5 dark:sm:border-zinc-800'>
                <p className='mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600'>
                  Macronutrientes
                </p>
                <dl className='grid grid-cols-2 gap-x-4 gap-y-2.5'>
                  <dt className='text-xs text-zinc-600 dark:text-zinc-500'>Proteína</dt>
                  <dd className='text-right text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-300'>
                    {targets.protein_g}g{' '}
                    <span className='font-normal text-zinc-500 dark:text-zinc-600'>
                      · {targets.protein_per_kg} g/kg · {proteinPct}%
                    </span>
                  </dd>
                  <dt className='text-xs text-zinc-600 dark:text-zinc-500'>Carbohidratos</dt>
                  <dd className='text-right text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-300'>
                    {targets.carbs_g}g{' '}
                    <span className='font-normal text-zinc-500 dark:text-zinc-600'>· {carbsPct}%</span>
                  </dd>
                  <dt className='text-xs text-zinc-600 dark:text-zinc-500'>Grasa</dt>
                  <dd className='text-right text-xs font-medium tabular-nums text-zinc-800 dark:text-zinc-300'>
                    {targets.fat_g}g{' '}
                    <span className='font-normal text-zinc-500 dark:text-zinc-600'>· {fatPct}%</span>
                  </dd>
                </dl>
              </div>
            </div>

            {targets.estimated && (
              <p className='mt-4 text-[10px] text-zinc-500 dark:text-zinc-700'>
                * TDEE estimado con Mifflin-St Jeor a partir de los datos del paciente. Para mayor
                precisión, introduce el TDEE medido en la ficha del paciente.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function BalanceValue({ value }: { value: number }) {
  if (value === 0)
    return <span className='text-xs font-medium text-zinc-600 dark:text-zinc-500'>±0 kcal</span>;
  if (value < 0)
    return (
      <span className='text-xs font-semibold tabular-nums text-sky-600 dark:text-sky-400'>
        {value}{' '}
        <span className='font-normal text-sky-700/80 dark:text-sky-600/70'>kcal</span>
      </span>
    );
  return (
    <span className='text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400'>
      +{value}{' '}
      <span className='font-normal text-emerald-700/80 dark:text-emerald-600/70'>kcal</span>
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='flex-shrink-0 text-zinc-500 dark:text-zinc-600'
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 350ms cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      <polyline points='6 9 12 15 18 9' />
    </svg>
  );
}
