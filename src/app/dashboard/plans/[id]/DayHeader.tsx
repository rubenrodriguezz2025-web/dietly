'use client';

import type { PlanDay } from '@/types/dietly';

import { EditableNumber, PencilIcon, XIcon } from './day-editor-shared';
import { DayStatusBadge } from './day-status-badge';
import { RegenerateDayButton } from './regenerate-day-button';

export type DayHeaderProps = {
  day: PlanDay;
  isDraft: boolean;
  hintDismissed: boolean;
  invalidMealIndexes: number[];
  planId: string;
  onUpdateDayTotals: (patch: Partial<Pick<PlanDay, 'total_calories' | 'total_macros'>>) => void;
  onDismissHint: () => void;
  readOnly?: boolean;
};

export function DayHeader({
  day,
  isDraft,
  hintDismissed,
  invalidMealIndexes,
  planId,
  onUpdateDayTotals,
  onDismissHint,
  readOnly = false,
}: DayHeaderProps) {
  return (
    <>
      {/* Cabecera del día */}
      <div className='flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-gray-900 dark:text-zinc-100'>{day.day_name}</h3>
            {day.day_theme && (
              <span className='text-xs text-gray-500 dark:text-zinc-500'>· {day.day_theme}</span>
            )}
          </div>
          <div className='mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400'>
            <EditableNumber
              value={day.total_calories}
              unit='kcal'
              onChange={(total_calories) => onUpdateDayTotals({ total_calories })}
              readOnly={readOnly}
            />
            <span className='select-none text-gray-300 dark:text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.protein_g}
              unit='g P'
              size='sm'
              onChange={(protein_g) =>
                onUpdateDayTotals({ total_macros: { ...day.total_macros, protein_g } })
              }
              readOnly={readOnly}
            />
            <span className='select-none text-gray-300 dark:text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.carbs_g}
              unit='g C'
              size='sm'
              onChange={(carbs_g) =>
                onUpdateDayTotals({ total_macros: { ...day.total_macros, carbs_g } })
              }
              readOnly={readOnly}
            />
            <span className='select-none text-gray-300 dark:text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.fat_g}
              unit='g G'
              size='sm'
              onChange={(fat_g) =>
                onUpdateDayTotals({ total_macros: { ...day.total_macros, fat_g } })
              }
              readOnly={readOnly}
            />
          </div>
        </div>

        <div className='flex items-center gap-3 flex-shrink-0'>
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
          <DayStatusBadge
            planId={planId}
            dayNumber={day.day_number}
            dayName={day.day_name}
            status={day.day_status}
            isDraft={isDraft}
          />
        </div>
      </div>

      {/* Hint de edición — visible hasta primera edición */}
      {isDraft && !hintDismissed && (
        <div className='flex items-center justify-between border-b border-gray-200 dark:border-zinc-800/50 bg-[#1a7a45]/5 px-5 py-2'>
          <div className='flex items-center gap-2 text-gray-500 dark:text-zinc-500'>
            <PencilIcon size={11} />
            <p className='text-xs'>Haz clic en cualquier texto subrayado para editarlo</p>
          </div>
          <button
            type='button'
            onClick={onDismissHint}
            className='text-gray-400 dark:text-zinc-500 transition-colors hover:text-gray-600 dark:hover:text-zinc-300'
            aria-label='Cerrar ayuda'
          >
            <XIcon size={9} />
          </button>
        </div>
      )}
    </>
  );
}
