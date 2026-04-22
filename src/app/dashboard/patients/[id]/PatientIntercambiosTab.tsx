'use client';

import { useState, useTransition } from 'react';

import type { Meal, MealSwap } from '@/types/dietly';

import { updatePatientField } from './update-actions';

const NOMBRE_DIA: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

const NOMBRE_TIPO: Record<string, string> = {
  desayuno: 'Desayuno', media_manana: 'Media mañana',
  almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena',
};

type Props = {
  swaps: MealSwap[];
  patientId: string;
  medicalNotes: string | null;
};

/** Analiza los swaps y devuelve los platos rechazados ordenados por frecuencia */
function getRejectedMeals(swaps: MealSwap[]): { name: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const s of swaps) {
    const original = s.original_meal as Meal;
    const key = original.meal_name.toLowerCase().trim();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function PatientIntercambiosTab({ swaps, patientId, medicalNotes }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  if (swaps.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-16'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='text-zinc-500 dark:text-zinc-500'>
            <polyline points='17 1 21 5 17 9' />
            <path d='M3 11V9a4 4 0 014-4h14' />
            <polyline points='7 23 3 19 7 15' />
            <path d='M21 13v2a4 4 0 01-4 4H3' />
          </svg>
        </div>
        <p className='text-sm text-zinc-600 dark:text-zinc-500'>
          El paciente aún no ha realizado intercambios de platos.
        </p>
      </div>
    );
  }

  const rejected = getRejectedMeals(swaps);
  const topRejected = rejected.slice(0, 5);

  function handleSaveToNotes() {
    const insight = `[Intercambios] Platos rechazados: ${topRejected.map((r) => `${r.name} (×${r.count})`).join(', ')}. Considerar evitar en futuros planes.`;
    const updated = medicalNotes
      ? `${medicalNotes}\n${insight}`
      : insight;
    startSaving(async () => {
      const result = await updatePatientField(patientId, 'medical_notes', updated);
      if (!result.error) setSaved(true);
    });
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* Insight: platos más rechazados */}
      {topRejected.length > 0 && (
        <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20'>
          <div className='mb-2 flex items-center gap-2'>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-amber-600 dark:text-amber-500'>
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400'>
              Platos más rechazados
            </h3>
          </div>
          <div className='mb-3 flex flex-wrap gap-2'>
            {topRejected.map((r) => (
              <span
                key={r.name}
                className='inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              >
                {r.name}
                <span className='rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-900 dark:bg-amber-900/50 dark:text-amber-400'>
                  ×{r.count}
                </span>
              </span>
            ))}
          </div>
          <p className='mb-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-200/60'>
            Estos platos han sido sustituidos por el paciente. Considera tenerlo en cuenta en futuros planes.
          </p>
          {saved ? (
            <div className='flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400'>
              <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='20 6 9 17 4 12' />
              </svg>
              Guardado en notas clínicas
            </div>
          ) : (
            <button
              type='button'
              onClick={handleSaveToNotes}
              disabled={saving}
              className='rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:border-amber-400 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:opacity-50 dark:border-amber-700/40 dark:text-amber-300 dark:hover:border-amber-600 dark:hover:text-amber-200'
            >
              {saving ? 'Guardando…' : 'Tener en cuenta →'}
            </button>
          )}
        </div>
      )}

      <div className='flex items-center justify-between'>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          {swaps.length} intercambio{swaps.length !== 1 ? 's' : ''} realizados
        </p>
      </div>

      {swaps.map((swap) => {
        const original = swap.original_meal as Meal;
        const selected = swap.selected_meal as Meal;
        const isReverted = !!swap.reverted_at;

        return (
          <div
            key={swap.id}
            className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50'
          >
            {/* Header */}
            <div className='mb-3 flex items-start justify-between'>
              <div className='flex flex-col gap-0.5'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-medium text-zinc-600 dark:text-zinc-500'>
                    {NOMBRE_DIA[swap.day_number] ?? `Día ${swap.day_number}`}
                  </span>
                  <span className='text-zinc-400 dark:text-zinc-700'>·</span>
                  <span className='text-xs font-medium text-zinc-600 dark:text-zinc-500'>
                    {NOMBRE_TIPO[original.meal_type] ?? original.meal_type}
                  </span>
                  {isReverted && (
                    <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-400'>
                      Revertido
                    </span>
                  )}
                </div>
                <time className='text-[11px] text-zinc-500 dark:text-zinc-600'>
                  {new Date(swap.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>

            {/* Original → Nuevo */}
            <div className='flex items-center gap-3'>
              {/* Original */}
              <div className='flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50'>
                <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-600'>
                  Original
                </p>
                <p className='text-sm font-medium text-zinc-800 dark:text-zinc-300'>
                  {original.meal_name}
                </p>
                <p className='mt-1 text-xs tabular-nums text-zinc-600 dark:text-zinc-500'>
                  {original.calories} kcal · P{original.macros.protein_g} C{original.macros.carbs_g} G{original.macros.fat_g}
                </p>
              </div>

              {/* Flecha */}
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='flex-shrink-0 text-zinc-300 dark:text-zinc-700'>
                <path d='M5 12h14M12 5l7 7-7 7' />
              </svg>

              {/* Nuevo */}
              <div className='flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20'>
                <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500'>
                  Nuevo
                </p>
                <p className='text-sm font-medium text-zinc-900 dark:text-zinc-200'>
                  {selected.meal_name}
                </p>
                <p className='mt-1 text-xs tabular-nums text-zinc-600 dark:text-zinc-500'>
                  {selected.calories} kcal · P{selected.macros.protein_g} C{selected.macros.carbs_g} G{selected.macros.fat_g}
                </p>
              </div>
            </div>

            {/* Diferencia calórica */}
            {(() => {
              const diff = selected.calories - original.calories;
              if (diff === 0) return null;
              const sign = diff > 0 ? '+' : '';
              return (
                <p className='mt-2 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-600'>
                  {sign}{diff} kcal
                </p>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
