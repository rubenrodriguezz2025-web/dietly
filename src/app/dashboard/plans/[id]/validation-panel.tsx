'use client';

import { useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ValidationResult } from '@/libs/validation/nutrition-validator';

// ── Sugerencias del sistema ────────────────────────────────────────────────────
// Badge discreto + panel lateral informativo.
// No bloquea ni requiere acción del nutricionista.

export function ValidationSuggestions({ result }: { result: ValidationResult }) {
  const [open, setOpen] = useState(false);
  const n = result.issues.length;

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='inline-flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-gray-100 dark:bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300'
      >
        <span aria-hidden='true'>ℹ️</span>
        {n} sugerencia{n !== 1 ? 's' : ''} del sistema
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='flex w-full flex-col border-zinc-800 bg-white dark:bg-zinc-950 sm:max-w-md'>
          <SheetHeader className='border-b border-zinc-800 pb-4'>
            <SheetTitle className='text-zinc-100'>Sugerencias del sistema</SheetTitle>
            <SheetDescription className='text-zinc-500'>
              Observaciones automáticas sobre el plan generado. Puedes aprobar el plan
              en cualquier momento sin necesidad de revisarlas.
            </SheetDescription>
          </SheetHeader>

          <div className='flex flex-1 flex-col gap-3 overflow-y-auto py-5'>
            {result.issues.map((issue) => (
              <div
                key={issue.code}
                className='rounded-lg border border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 px-4 py-3'
              >
                <p className='text-sm font-medium text-zinc-300'>{issue.title}</p>
                <p className='mt-1 text-xs leading-relaxed text-zinc-500'>{issue.detail}</p>
                {issue.affected && (
                  <p className='mt-1.5 text-[11px] text-zinc-600'>
                    <span className='text-zinc-700'>Afecta a: </span>
                    {issue.affected}
                  </p>
                )}
              </div>
            ))}

            {/* Métricas de referencia */}
            <div className='mt-2 border-t border-zinc-800/60 pt-4'>
              <p className='mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600'>
                Métricas calculadas del plan
              </p>
              <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                <StatItem
                  label='Kcal media/día'
                  value={`${Math.round(result.stats.avgCalories)} kcal`}
                />
                <StatItem
                  label='Proteína'
                  value={
                    result.stats.proteinPerKg !== null
                      ? `${result.stats.avgProtein}g · ${result.stats.proteinPerKg}g/kg`
                      : `${Math.round(result.stats.avgProtein)}g`
                  }
                />
                <StatItem
                  label='HC (% VCT)'
                  value={
                    result.stats.carbsPctVCT !== null
                      ? `${Math.round(result.stats.avgCarbs)}g · ${result.stats.carbsPctVCT}%`
                      : `${Math.round(result.stats.avgCarbs)}g`
                  }
                />
                <StatItem
                  label='Grasa (% VCT)'
                  value={
                    result.stats.fatPctVCT !== null
                      ? `${Math.round(result.stats.avgFat)}g · ${result.stats.fatPctVCT}%`
                      : `${Math.round(result.stats.avgFat)}g`
                  }
                />
                {result.stats.bmi !== null && (
                  <StatItem label='IMC' value={`${result.stats.bmi} kg/m²`} />
                )}
                {result.stats.deficitPct !== null && (
                  <StatItem label='Déficit TDEE' value={`${result.stats.deficitPct}%`} />
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-[11px] text-zinc-600'>{label}</span>
      <span className='text-xs font-medium tabular-nums text-zinc-400'>{value}</span>
    </div>
  );
}
