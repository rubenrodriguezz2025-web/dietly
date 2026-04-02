'use client';

import { useState } from 'react';

import type { ValidationResult } from '@/lib/validation/nutrition-validator';
import type { PlanDay } from '@/types/dietly';

import { DayEditor } from './day-editor';
import { ValidationSuggestions } from './validation-panel';

interface Props {
  days: PlanDay[];
  planId: string;
  isDraft: boolean;
  validationResult?: ValidationResult;
}

// ── Day short names ──────────────────────────────────────────────────────────

const DAY_SHORT: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};

// ── PlanEditor ────────────────────────────────────────────────────────────────

export function PlanEditor({ days, planId, isDraft, validationResult }: Props) {
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set());
  const [activeDay, setActiveDay] = useState<number>(days[0]?.day_number ?? 1);

  const approvedCount = days.filter((d) => d.day_status === 'approved').length;
  const totalDays = days.length;

  function handleDirty(dayNumber: number) {
    setDirtyDays((prev) => new Set(prev).add(dayNumber));
  }

  function handleSaved(dayNumber: number) {
    setDirtyDays((prev) => {
      const next = new Set(prev);
      next.delete(dayNumber);
      return next;
    });
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Progreso de revisión por día — solo en borrador */}
      {isDraft && (
        <div className='flex items-center gap-3'>
          <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800'>
            <div
              className='h-full rounded-full bg-[#1a7a45] transition-all duration-500'
              style={{ width: totalDays > 0 ? `${(approvedCount / totalDays) * 100}%` : '0%' }}
            />
          </div>
          <span className='flex-shrink-0 text-xs tabular-nums text-gray-500 dark:text-zinc-500'>
            <span
              className={
                approvedCount === totalDays
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-800 dark:text-zinc-300'
              }
            >
              {approvedCount}
            </span>
            /{totalDays} días revisados
          </span>
        </div>
      )}

      {/* Sugerencias de validación */}
      {isDraft && validationResult && validationResult.issues.length > 0 && (
        <div className='flex justify-end'>
          <ValidationSuggestions result={validationResult} />
        </div>
      )}

      {/* Tabs de días — floating, sin card wrapper */}
      <div className='flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {days.map((day) => {
          const isActive = day.day_number === activeDay;
          const isDirty = dirtyDays.has(day.day_number);
          const isApproved = day.day_status === 'approved';
          const shortName = DAY_SHORT[day.day_name] ?? day.day_name.slice(0, 3);

          return (
            <button
              key={day.day_number}
              type='button'
              onClick={() => setActiveDay(day.day_number)}
              className={`relative flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a7a45] ${
                isActive
                  ? 'bg-[#1a7a45] text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {shortName}
              {/* Indicador de cambios sin guardar */}
              {isDirty && !isActive && (
                <span className='absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-gray-50 bg-amber-400 dark:border-zinc-950' />
              )}
              {/* Indicador de aprobado */}
              {isApproved && !isActive && !isDirty && (
                <span className='absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-gray-50 bg-emerald-500 dark:border-zinc-950' />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel de contenido — todos los días montados, solo el activo visible */}
      {days.map((day) => (
        <div
          key={day.day_number}
          className={day.day_number === activeDay ? 'animate-tab-in' : 'hidden'}
        >
          <DayEditor
            day={day}
            planId={planId}
            isDraft={isDraft}
            onDirty={() => handleDirty(day.day_number)}
            onSaved={() => handleSaved(day.day_number)}
          />
        </div>
      ))}
    </div>
  );
}
