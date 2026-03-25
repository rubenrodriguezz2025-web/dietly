'use client';

import { useActionState } from 'react';

import { approvePlan } from './actions';

export function ApproveButton({
  planId,
  hasDirty,
}: {
  planId: string;
  hasDirty?: boolean;
}) {
  const [state, action, pending] = useActionState(approvePlan.bind(null, planId), {});

  return (
    <div className='flex flex-col items-end gap-1'>
      {hasDirty && (
        <p className='text-xs text-amber-500'>Guarda todos los cambios antes de aprobar</p>
      )}
      <form action={action}>
        <button
          type='submit'
          disabled={hasDirty || pending}
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
