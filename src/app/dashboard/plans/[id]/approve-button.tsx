'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { approvePlan } from './actions';

export function ApproveButton({
  planId,
  hasDirty,
  hasCollegeNumber,
}: {
  planId: string;
  hasDirty?: boolean;
  hasCollegeNumber?: boolean;
}) {
  const [state, action, pending] = useActionState(approvePlan.bind(null, planId), {});

  const missingCollege = hasCollegeNumber === false;

  return (
    <div className='flex flex-col items-end gap-1'>
      {missingCollege && (
        <div className='mb-2 flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2.5'>
          <svg className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <circle cx='12' cy='12' r='10'/>
            <line x1='12' y1='8' x2='12' y2='12'/>
            <line x1='12' y1='16' x2='12.01' y2='16'/>
          </svg>
          <p className='text-xs text-amber-400'>
            Para aprobar planes necesitas añadir tu nº de colegiado en{' '}
            <Link href='/dashboard/ajustes' className='font-medium underline underline-offset-2 hover:text-amber-300'>
              Ajustes
            </Link>.
          </p>
        </div>
      )}
      {hasDirty && (
        <p className='text-xs text-amber-500'>Guarda todos los cambios antes de aprobar</p>
      )}
      <form action={action}>
        <button
          type='submit'
          disabled={hasDirty || missingCollege || pending}
          className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40'
        >
          {pending ? (
            <>
              <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
              Aprobando...
            </>
          ) : (
            'Aprobar plan'
          )}
        </button>
      </form>
      {state.error && (
        <p className='text-xs text-red-400'>{state.error}</p>
      )}
      <p className='text-xs text-zinc-600'>El plan pasará a estado &quot;Aprobado&quot;</p>
    </div>
  );
}
