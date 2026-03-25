'use client';

import type { PlanDay } from '@/types/dietly';

import { EditableNumber, PencilIcon, XIcon } from './day-editor-shared';
import { RegenerateDayButton } from './regenerate-day-button';

export type DayHeaderProps = {
  day: PlanDay;
  isDraft: boolean;
  hintDismissed: boolean;
  invalidMealIndexes: number[];
  planId: string;
  onUpdateDayTotals: (patch: Partial<Pick<PlanDay, 'total_calories' | 'total_macros'>>) => void;
  onDismissHint: () => void;
};

export function DayHeader({
  day,
  isDraft,
  hintDismissed,
  invalidMealIndexes,
  planId,
  onUpdateDayTotals,
  onDismissHint,
}: DayHeaderProps) {
  return (
    <>
      {/* Cabecera del día */}
      <div className='flex items-center justify-between border-b border-zinc-800 px-5 py-4'>
        <div>
          <h3 className='font-semibold text-zinc-100'>{day.day_name}</h3>
          <div className='mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-600'>
            <EditableNumber
              value={day.total_calories}
              unit='kcal'
              onChange={(total_calories) => onUpdateDayTotals({ total_calories })}
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.protein_g}
              unit='g P'
              size='sm'
              onChange={(protein_g) =>
                onUpdateDayTotals({ total_macros: { ...day.total_macros, protein_g } })
              }
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.carbs_g}
              unit='g C'
              size='sm'
              onChange={(carbs_g) =>
                onUpdateDayTotals({ total_macros: { ...day.total_macros, carbs_g } })
              }
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.fat_g}
              unit='g G'
              size='sm'
              onChange={(fat_g) =>
                onUpdateDayTotals({ total_macros: { ...day.total_macros, fat_g } })
              }
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {invalidMealIndexes.length > 0 && (
            <>
              <span className='text-xs text-red-400'>
                {invalidMealIndexes.length} comida
                {invalidMealIndexes.length > 1 ? 's' : ''} con error
              </span>
              <RegenerateDayButton
                planId={planId}
                dayNumber={day.day_number}
                dayName={day.day_name}
              />
            </>
          )}
        </div>
      </div>

      {/* Hint de edición — visible hasta primera edición */}
      {isDraft && !hintDismissed && (
        <div className='flex items-center justify-between border-b border-zinc-800/50 bg-[#1a7a45]/5 px-5 py-2'>
          <div className='flex items-center gap-2 text-zinc-500'>
            <PencilIcon size={11} />
            <p className='text-xs'>Haz clic en cualquier texto subrayado para editarlo</p>
          </div>
          <button
            type='button'
            onClick={onDismissHint}
            className='text-zinc-700 transition-colors hover:text-zinc-500'
            aria-label='Cerrar ayuda'
          >
            <XIcon size={9} />
          </button>
        </div>
      )}
    </>
  );
}
