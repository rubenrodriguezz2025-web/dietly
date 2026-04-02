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

// ── Arrow nav ─────────────────────────────────────────────────────────────────

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {dir === 'left' ? (
        <polyline points='15 18 9 12 15 6' />
      ) : (
        <polyline points='9 18 15 12 9 6' />
      )}
    </svg>
  );
}

function DayArrowNav({
  activeDay,
  animDir,
  days,
  onSelect,
}: {
  activeDay: number;
  animDir: 'left' | 'right';
  days: PlanDay[];
  onSelect: (day: number, dir: 'left' | 'right') => void;
}) {
  const totalDays = days.length;
  const currentDayData = days.find((d) => d.day_number === activeDay) ?? days[0];
  const dayName = currentDayData?.day_name ?? `Día ${activeDay}`;

  const canGoPrev = activeDay > 1;
  const canGoNext = activeDay < totalDays;

  const btnBase =
    'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a7a45]';
  const btnEnabled =
    'text-gray-500 hover:bg-gray-100 hover:text-[#1a7a45] dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-[#1a7a45]';
  const btnDisabled =
    'cursor-not-allowed opacity-25 text-gray-400 dark:text-zinc-600 pointer-events-none';

  return (
    <div className='sticky top-0 z-20 -mx-4 sm:mx-0'>
      <div className='border-b border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/96 backdrop-blur-sm px-4 sm:px-2 sm:rounded-xl sm:border sm:border-gray-200 dark:sm:border-zinc-800'>
        <div className='flex items-center justify-between py-2'>
          {/* Flecha izquierda */}
          <button
            type='button'
            aria-label='Día anterior'
            disabled={!canGoPrev}
            onClick={() => canGoPrev && onSelect(activeDay - 1, 'left')}
            className={`${btnBase} ${canGoPrev ? btnEnabled : btnDisabled}`}
          >
            <ChevronIcon dir='left' />
          </button>

          {/* Día actual */}
          <div className='flex flex-col items-center gap-0.5 overflow-hidden text-center'>
            <span
              key={`${activeDay}-name`}
              className={`text-sm font-semibold text-gray-900 dark:text-zinc-100 ${
                animDir === 'right' ? 'animate-tab-in' : 'animate-tab-in-reverse'
              }`}
            >
              {dayName}
            </span>
            <span
              key={`${activeDay}-count`}
              className='text-xs tabular-nums text-gray-500 dark:text-zinc-500'
            >
              Día {activeDay} de {totalDays}
            </span>
          </div>

          {/* Flecha derecha */}
          <button
            type='button'
            aria-label='Día siguiente'
            disabled={!canGoNext}
            onClick={() => canGoNext && onSelect(activeDay + 1, 'right')}
            className={`${btnBase} ${canGoNext ? btnEnabled : btnDisabled}`}
          >
            <ChevronIcon dir='right' />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PlanEditor ────────────────────────────────────────────────────────────────

export function PlanEditor({ days, planId, isDraft, validationResult }: Props) {
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set());
  const [activeDay, setActiveDay] = useState<number>(days[0]?.day_number ?? 1);
  const [animDir, setAnimDir] = useState<'left' | 'right'>('right');

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
            if (n) {
              setAnimDir(n > activeDayRef.current ? 'right' : 'left');
              setActiveDay(n);
            }
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

  // ── Scroll to day on arrow click ────────────────────────────────────────────
  function handleArrowSelect(dayNumber: number, dir: 'left' | 'right') {
    setAnimDir(dir);
    setActiveDay(dayNumber);
    const el = document.getElementById(`plan-day-${dayNumber}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
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

      {/* Navegación con flechas */}
      <DayArrowNav
        activeDay={activeDay}
        animDir={animDir}
        days={days}
        onSelect={handleArrowSelect}
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
