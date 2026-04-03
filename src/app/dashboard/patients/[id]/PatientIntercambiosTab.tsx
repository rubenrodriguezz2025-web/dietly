'use client';

import type { Meal, MealSwap } from '@/types/dietly';

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
};

export function PatientIntercambiosTab({ swaps }: Props) {
  if (swaps.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-16'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/50'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#71717a' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='17 1 21 5 17 9' />
            <path d='M3 11V9a4 4 0 014-4h14' />
            <polyline points='7 23 3 19 7 15' />
            <path d='M21 13v2a4 4 0 01-4 4H3' />
          </svg>
        </div>
        <p className='text-sm text-zinc-500'>
          El paciente aún no ha realizado intercambios de platos.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='mb-2 flex items-center justify-between'>
        <p className='text-sm text-zinc-400'>
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
            className='rounded-xl border border-zinc-800 bg-zinc-900/50 p-4'
          >
            {/* Header */}
            <div className='mb-3 flex items-start justify-between'>
              <div className='flex flex-col gap-0.5'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-medium text-zinc-500'>
                    {NOMBRE_DIA[swap.day_number] ?? `Día ${swap.day_number}`}
                  </span>
                  <span className='text-zinc-700'>·</span>
                  <span className='text-xs font-medium text-zinc-500'>
                    {NOMBRE_TIPO[original.meal_type] ?? original.meal_type}
                  </span>
                  {isReverted && (
                    <span className='rounded-full bg-amber-950 px-2 py-0.5 text-[10px] font-medium text-amber-400'>
                      Revertido
                    </span>
                  )}
                </div>
                <time className='text-[11px] text-zinc-600'>
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
              <div className='flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5'>
                <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600'>
                  Original
                </p>
                <p className='text-sm font-medium text-zinc-300'>
                  {original.meal_name}
                </p>
                <p className='mt-1 text-xs tabular-nums text-zinc-500'>
                  {original.calories} kcal · P{original.macros.protein_g} C{original.macros.carbs_g} G{original.macros.fat_g}
                </p>
              </div>

              {/* Flecha */}
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#3f3f46' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='flex-shrink-0'>
                <path d='M5 12h14M12 5l7 7-7 7' />
              </svg>

              {/* Nuevo */}
              <div className='flex-1 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2.5'>
                <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700'>
                  Nuevo
                </p>
                <p className='text-sm font-medium text-zinc-200'>
                  {selected.meal_name}
                </p>
                <p className='mt-1 text-xs tabular-nums text-zinc-500'>
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
                <p className='mt-2 text-[11px] tabular-nums text-zinc-600'>
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
