'use client';

import { useTransition } from 'react';

import type { ValidationIssue, ValidationResult } from '@/lib/validation/nutrition-validator';

import { acknowledgeValidationBlock } from './actions';

interface Props {
  result: ValidationResult;
  ackedBlocks: string[];
  planId: string;
}

export function ValidationPanel({ result, ackedBlocks, planId }: Props) {
  if (result.issues.length === 0) return null;

  const unackedBlocks = result.blocks.filter((b) => !ackedBlocks.includes(b.code));

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2.5'>
          <svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='flex-shrink-0 text-zinc-400' aria-hidden='true'>
            <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
          </svg>
          <span className='text-sm font-semibold text-zinc-200'>Validación clínica</span>
        </div>
        <div className='flex items-center gap-2'>
          {result.blocks.length > 0 && (
            <span className='rounded-full border border-red-900/50 bg-red-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-red-400'>
              {result.blocks.length} {result.blocks.length === 1 ? 'bloqueo' : 'bloqueos'}
            </span>
          )}
          {result.warnings.length > 0 && (
            <span className='rounded-full border border-amber-900/50 bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400'>
              {result.warnings.length} {result.warnings.length === 1 ? 'alerta' : 'alertas'}
            </span>
          )}
        </div>
      </div>

      {/* Mensaje de resumen */}
      {unackedBlocks.length > 0 && (
        <p className='text-xs text-red-400'>
          Hay {unackedBlocks.length === 1 ? '1 bloqueo pendiente' : `${unackedBlocks.length} bloqueos pendientes`} de revisión. Debes marcarlos como revisados para poder aprobar el plan.
        </p>
      )}

      {/* Bloques */}
      {result.blocks.map((issue) => {
        const isAcked = ackedBlocks.includes(issue.code);
        return (
          <BlockIssueCard
            key={issue.code}
            issue={issue}
            isAcked={isAcked}
            planId={planId}
          />
        );
      })}

      {/* Advertencias */}
      {result.warnings.map((issue) => (
        <WarningIssueCard key={issue.code} issue={issue} />
      ))}

      {/* Stats de referencia */}
      <div className='mt-1 border-t border-zinc-800/60 pt-3'>
        <p className='mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600'>Métricas calculadas del plan</p>
        <div className='grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4'>
          <StatItem label='Kcal media/día' value={`${Math.round(result.stats.avgCalories)} kcal`} />
          <StatItem label='Proteína' value={result.stats.proteinPerKg !== null ? `${result.stats.avgProtein}g · ${result.stats.proteinPerKg}g/kg` : `${Math.round(result.stats.avgProtein)}g`} />
          <StatItem label='HC (% VCT)' value={result.stats.carbsPctVCT !== null ? `${Math.round(result.stats.avgCarbs)}g · ${result.stats.carbsPctVCT}%` : `${Math.round(result.stats.avgCarbs)}g`} />
          <StatItem label='Grasa (% VCT)' value={result.stats.fatPctVCT !== null ? `${Math.round(result.stats.avgFat)}g · ${result.stats.fatPctVCT}%` : `${Math.round(result.stats.avgFat)}g`} />
          {result.stats.bmi !== null && <StatItem label='IMC' value={`${result.stats.bmi} kg/m²`} />}
          {result.stats.deficitPct !== null && <StatItem label='Déficit TDEE' value={`${result.stats.deficitPct}%`} />}
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function BlockIssueCard({
  issue,
  isAcked,
  planId,
}: {
  issue: ValidationIssue;
  isAcked: boolean;
  planId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleAck() {
    startTransition(async () => {
      await acknowledgeValidationBlock(planId, issue.code);
    });
  }

  return (
    <div className={`rounded-lg border px-4 py-3 transition-opacity ${isAcked ? 'border-zinc-800 opacity-50' : 'border-red-900/50 bg-red-950/15'}`}>
      <div className='flex items-start gap-3'>
        <div className='mt-0.5 flex-shrink-0'>
          {isAcked ? (
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='text-zinc-600' aria-hidden='true'>
              <polyline points='20 6 9 17 4 12' />
            </svg>
          ) : (
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-red-400' aria-hidden='true'>
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <p className={`text-sm font-medium ${isAcked ? 'text-zinc-500' : 'text-red-300'}`}>
              {issue.title}
            </p>
            {!isAcked && (
              <button
                type='button'
                disabled={isPending}
                onClick={handleAck}
                className='flex-shrink-0 rounded-md border border-red-900/50 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:border-red-700 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-40'
              >
                {isPending ? 'Guardando...' : 'He revisado esta alerta'}
              </button>
            )}
            {isAcked && (
              <span className='text-[11px] text-zinc-600'>Revisado</span>
            )}
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${isAcked ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {issue.detail}
          </p>
          {issue.affected && !isAcked && (
            <p className='mt-1.5 text-[11px] text-zinc-500'>
              <span className='text-zinc-600'>Afecta a: </span>{issue.affected}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningIssueCard({ issue }: { issue: ValidationIssue }) {
  return (
    <div className='rounded-lg border border-amber-900/30 bg-amber-950/10 px-4 py-3'>
      <div className='flex items-start gap-3'>
        <div className='mt-0.5 flex-shrink-0'>
          <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-amber-500' aria-hidden='true'>
            <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
            <line x1='12' y1='9' x2='12' y2='13' />
            <line x1='12' y1='17' x2='12.01' y2='17' />
          </svg>
        </div>
        <div>
          <p className='text-sm font-medium text-amber-300'>{issue.title}</p>
          <p className='mt-1 text-xs leading-relaxed text-zinc-400'>{issue.detail}</p>
          {issue.affected && (
            <p className='mt-1.5 text-[11px] text-zinc-500'>
              <span className='text-zinc-600'>Afecta a: </span>{issue.affected}
            </p>
          )}
        </div>
      </div>
    </div>
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
