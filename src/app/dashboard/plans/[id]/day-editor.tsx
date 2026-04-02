'use client';

import { useEffect, useRef, useState } from 'react';

import type { Meal, PlanDay } from '@/types/dietly';

import { updateDay } from './actions';
import { DayHeader } from './DayHeader';
import { MacrosSummary } from './MacrosSummary';
import { MealCard } from './MealCard';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function DayEditor({
  day: initialDay,
  planId,
  isDraft,
  onDirty,
  onSaved,
}: {
  day: PlanDay;
  planId: string;
  isDraft: boolean;
  onDirty: () => void;
  onSaved: () => void;
}) {
  const [day, setDay] = useState(initialDay);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [hintDismissed, setHintDismissed] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const onSavedRef = useRef(onSaved);
  useEffect(() => { onSavedRef.current = onSaved; });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Autoguardado con debounce de 1000 ms
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await updateDay(planId, day.day_number, day);
      if (result.error) {
        setSaveStatus('error');
        setTimeout(async () => {
          const retry = await updateDay(planId, day.day_number, day);
          if (!retry.error) markSaved();
          else setSaveStatus('idle');
        }, 2000);
      } else {
        markSaved();
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, planId]);

  function markSaved() {
    setSaveStatus('saved');
    setDirty(false);
    onSavedRef.current();
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }

  const invalidMealIndexes = day.meals
    .map((m, i) => (m.calories <= 0 || m.ingredients.length < 2 ? i : -1))
    .filter((i) => i >= 0);

  function markDirty() {
    if (!dirty) {
      setDirty(true);
      setHintDismissed(true);
      onDirty();
    }
  }

  function updateMeal(mealIdx: number, updatedMeal: Meal) {
    setDay((prev) => ({
      ...prev,
      meals: prev.meals.map((m, i) => (i === mealIdx ? updatedMeal : m)),
    }));
    markDirty();
  }

  function updateDayTotals(
    patch: Partial<Pick<PlanDay, 'total_calories' | 'total_macros'>>
  ) {
    setDay((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  return (
    <div
      className={`rounded-xl bg-gray-50 dark:bg-zinc-950 transition-[box-shadow] duration-300 ${
        dirty
          ? 'shadow-[inset_0_0_0_1px_rgba(26,122,69,0.25)]'
          : invalidMealIndexes.length > 0
            ? 'shadow-[inset_0_0_0_1px_rgba(239,68,68,0.3)]'
            : ''
      }`}
    >
      <DayHeader
        day={day}
        isDraft={isDraft}
        hintDismissed={hintDismissed}
        invalidMealIndexes={invalidMealIndexes}
        planId={planId}
        onUpdateDayTotals={updateDayTotals}
        onDismissHint={() => setHintDismissed(true)}
      />

      {/* Comidas */}
      <div className='flex flex-col gap-4 p-4'>
        {day.meals.map((meal, i) => (
          <MealCard
            key={i}
            meal={meal}
            isInvalid={invalidMealIndexes.includes(i)}
            isDraft={isDraft}
            planId={planId}
            onChange={(updated) => updateMeal(i, updated)}
          />
        ))}
      </div>

      <MacrosSummary saveStatus={saveStatus} />
    </div>
  );
}
