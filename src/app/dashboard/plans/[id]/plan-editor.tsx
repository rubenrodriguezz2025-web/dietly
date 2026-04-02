'use client';

import { useEffect, useRef, useState } from 'react';

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

// ── Day tabs nav ───────────────────────────────────────────────────────────────

const DAY_SHORT: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};

function DayTabsNav({
  activeDay,
  days,
  dirtyDays,
  onSelect,
}: {
  activeDay: number;
  days: PlanDay[];
  dirtyDays: Set<number>;
  onSelect: (dayNumber: number) => void;
}) {
  return (
    <div className='sticky top-0 z-20 -mx-4 sm:mx-0'>
      <div className='border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 sm:px-2 sm:rounded-xl sm:border sm:border-gray-200 dark:sm:border-zinc-700'>
        <div className='flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {days.map((day) => {
            const isActive = day.day_number === activeDay;
            const isDirty = dirtyDays.has(day.day_number);
            const shortName = DAY_SHORT[day.day_name] ?? day.day_name.slice(0, 3);
            return (
              <button
                key={day.day_number}
                type='button'
                onClick={() => onSelect(day.day_number)}
                className={`relative flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a7a45] ${
                  isActive
                    ? 'bg-[#1a7a45] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {shortName}
                {isDirty && (
                  <span className='absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400' />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── PlanEditor ────────────────────────────────────────────────────────────────

export function PlanEditor({ days, planId, isDraft, validationResult }: Props) {
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set());
  const [activeDay, setActiveDay] = useState<number>(days[0]?.day_number ?? 1);
  const tabsRef = useRef<HTMLDivElement>(null);

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

  // ── Scroll spy via IntersectionObserver ──────────────────────────────────────
  const activeDayRef = useRef(activeDay);
  useEffect(() => { activeDayRef.current = activeDay; }, [activeDay]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const n = Number(entry.target.getAttribute('data-plan-day'));
            if (n) setActiveDay(n);
            break;
          }
        }
      },
      { rootMargin: '-60px 0px -55% 0px', threshold: 0 }
    );

    days.forEach((day) => {
      const el = document.getElementById(`plan-day-${day.day_number}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [days]);

  // ── Scroll to day on tab click ────────────────────────────────────────────
  function handleTabSelect(dayNumber: number) {
    setActiveDay(dayNumber);
    const el = document.getElementById(`plan-day-${dayNumber}`);
    if (!el) return;
    // Offset: tabs bar height (~52px) + small gap
    const tabsHeight = tabsRef.current?.offsetHeight ?? 52;
    const top = el.getBoundingClientRect().top + window.scrollY - tabsHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
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

      {/* Badge de sugerencias del sistema — solo en borrador, no bloqueante */}
      {isDraft && validationResult && validationResult.issues.length > 0 && (
        <div className='flex justify-end'>
          <ValidationSuggestions result={validationResult} />
        </div>
      )}

      {/* Tabs de días */}
      <div ref={tabsRef}>
        <DayTabsNav
          activeDay={activeDay}
          days={days}
          dirtyDays={dirtyDays}
          onSelect={handleTabSelect}
        />
      </div>

      {days.map((day) => (
        <div
          key={day.day_number}
          id={`plan-day-${day.day_number}`}
          data-plan-day={day.day_number}
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
