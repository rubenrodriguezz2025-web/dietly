'use client';

import { useState } from 'react';

import type { PlanDay } from '@/types/dietly';

import { ApproveButton } from './approve-button';
import { DayEditor } from './day-editor';

export function PlanEditor({ days, planId, isDraft }: { days: PlanDay[]; planId: string; isDraft: boolean }) {
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set());

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
      {days.map((day) => (
        <DayEditor
          key={day.day_number}
          day={day}
          planId={planId}
          onDirty={() => handleDirty(day.day_number)}
          onSaved={() => handleSaved(day.day_number)}
        />
      ))}

      {isDraft && (
        <div className='flex justify-end'>
          <ApproveButton planId={planId} hasDirty={dirtyDays.size > 0} />
        </div>
      )}
    </div>
  );
}
