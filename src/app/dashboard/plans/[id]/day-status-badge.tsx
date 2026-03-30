'use client';

import { useTransition } from 'react';

import type { DayStatus } from '@/types/dietly';

import { approveSingleDay } from './actions';

interface Props {
  planId: string;
  dayNumber: number;
  dayName: string;
  status?: DayStatus;
  isDraft: boolean;
}

export function DayStatusBadge({ planId, dayNumber, dayName, status, isDraft }: Props) {
  const [pending, startTransition] = useTransition();
  const isApproved = status === 'approved';
  const isRegenerating = status === 'regenerating';

  if (isRegenerating) {
    return (
      <span className='inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-400'>
        <span className='h-2.5 w-2.5 animate-spin rounded-full border border-zinc-500 border-t-zinc-300' />
        Regenerando…
      </span>
    );
  }

  if (isApproved) {
    return (
      <span className='inline-flex items-center gap-1 rounded-full border border-[#1a7a45]/30 bg-[#1a7a45]/10 px-2.5 py-1 text-xs font-medium text-emerald-400'>
        <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
          <polyline points='20 6 9 17 4 12' />
        </svg>
        Revisado
      </span>
    );
  }

  if (!isDraft) return null;

  return (
    <button
      type='button'
      disabled={pending}
      aria-label={`Marcar ${dayName} como revisado`}
      onClick={() => {
        startTransition(async () => {
          await approveSingleDay(planId, dayNumber);
        });
      }}
      className='inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-400 transition-all duration-150 hover:border-[#1a7a45]/50 hover:bg-[#1a7a45]/10 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]'
    >
      {pending ? (
        <>
          <span className='h-2.5 w-2.5 animate-spin rounded-full border border-zinc-500 border-t-zinc-300' />
          Guardando…
        </>
      ) : (
        <>
          <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <polyline points='20 6 9 17 4 12' />
          </svg>
          Marcar revisado
        </>
      )}
    </button>
  );
}
