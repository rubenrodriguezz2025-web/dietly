'use client';

import { useState } from 'react';

import type { ValidationResult } from '@/lib/validation/nutrition-validator';
import type { PlanDay } from '@/types/dietly';

import { ApproveButton } from './approve-button';
import { DayEditor } from './day-editor';
import { ValidationPanel } from './validation-panel';

interface Props {
  days: PlanDay[];
  planId: string;
  isDraft: boolean;
  validationResult?: ValidationResult;
  ackedBlocks?: string[];
}

export function PlanEditor({ days, planId, isDraft, validationResult, ackedBlocks = [] }: Props) {
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

  // Bloques activos aún no reconocidos por el D-N
  const unackedBlocks = validationResult
    ? validationResult.blocks.filter((b) => !ackedBlocks.includes(b.code)).map((b) => b.code)
    : [];

  return (
    <div className='flex flex-col gap-6'>
      {/* Panel de validación clínica — solo en borrador */}
      {isDraft && validationResult && validationResult.issues.length > 0 && (
        <ValidationPanel
          result={validationResult}
          ackedBlocks={ackedBlocks}
          planId={planId}
        />
      )}

      {days.map((day) => (
        <DayEditor
          key={day.day_number}
          day={day}
          planId={planId}
          isDraft={isDraft}
          onDirty={() => handleDirty(day.day_number)}
          onSaved={() => handleSaved(day.day_number)}
        />
      ))}

      {isDraft && (
        <div className='flex justify-end'>
          <ApproveButton
            planId={planId}
            hasDirty={dirtyDays.size > 0}
            unackedBlocks={unackedBlocks}
          />
        </div>
      )}
    </div>
  );
}
