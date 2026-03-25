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

// Lun=1 … Dom=7 (mismo índice que day_number en PlanDay)
const DAY_TABS = [
  { number: 1, short: 'Lun' },
  { number: 2, short: 'Mar' },
  { number: 3, short: 'Mié' },
  { number: 4, short: 'Jue' },
  { number: 5, short: 'Vie' },
  { number: 6, short: 'Sáb' },
  { number: 7, short: 'Dom' },
];

/** Convierte getDay() (0=Dom,1=Lun…) al day_number del plan (1=Lun…7=Dom). */
function jsToPlannedDay(jsDay: number): number {
  return ((jsDay + 6) % 7) + 1;
}

// ── Tabs nav ──────────────────────────────────────────────────────────────────

function DayTabsNav({
  activeDay,
  todayDay,
  onSelect,
}: {
  activeDay: number;
  todayDay: number;
  onSelect: (day: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the tab strip so the active tab is visible on mobile
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.querySelector<HTMLButtonElement>(`[data-day="${activeDay}"]`);
    if (!activeEl) return;
    const { offsetLeft, offsetWidth } = activeEl;
    const { scrollLeft, clientWidth } = list;
    if (
      offsetLeft < scrollLeft ||
      offsetLeft + offsetWidth > scrollLeft + clientWidth
    ) {
      list.scrollTo({ left: offsetLeft - clientWidth / 2 + offsetWidth / 2, behavior: 'smooth' });
    }
  }, [activeDay]);

  return (
    <div className='sticky top-0 z-20 -mx-4 sm:mx-0'>
      <div className='border-b border-zinc-800 bg-zinc-950/96 backdrop-blur-sm px-4 sm:px-0 sm:rounded-xl sm:border sm:border-zinc-800'>
        <div
          ref={listRef}
          className='flex overflow-x-auto scrollbar-none'
          role='tablist'
          aria-label='Días del plan'
        >
          {DAY_TABS.map(({ number, short }) => {
            const isActive = activeDay === number;
            const isToday = todayDay === number;
            return (
              <button
                key={number}
                type='button'
                role='tab'
                aria-selected={isActive}
                data-day={number}
                onClick={() => onSelect(number)}
                className={[
                  'relative flex flex-shrink-0 flex-col items-center gap-0.5 px-4 py-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a7a45] focus-visible:ring-inset sm:flex-1',
                  isActive
                    ? 'text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-400',
                ].join(' ')}
              >
                {short}
                {/* Indicador "hoy" */}
                {isToday && (
                  <span
                    className={[
                      'h-1 w-1 rounded-full',
                      isActive ? 'bg-[#1a7a45]' : 'bg-zinc-600',
                    ].join(' ')}
                    aria-label='Hoy'
                  />
                )}
                {/* Underline del tab activo */}
                {isActive && (
                  <span className='absolute bottom-0 left-3 right-3 h-0.5 rounded-t-full bg-[#1a7a45]' />
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
  const todayDay = jsToPlannedDay(new Date().getDay());

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
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the first intersecting entry (topmost visible day)
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
    // Offset to account for sticky tabs bar (~52px) + a bit of breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Badge de sugerencias del sistema — solo en borrador, no bloqueante */}
      {isDraft && validationResult && validationResult.issues.length > 0 && (
        <div className='flex justify-end'>
          <ValidationSuggestions result={validationResult} />
        </div>
      )}

      {/* Tabs de navegación */}
      <DayTabsNav
        activeDay={activeDay}
        todayDay={todayDay}
        onSelect={handleTabSelect}
      />

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
