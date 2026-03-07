'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';

import { approvePlan } from './actions';

export function ApproveButton({ planId, hasDirty }: { planId: string; hasDirty?: boolean }) {
  const [state, action, pending] = useActionState(approvePlan.bind(null, planId), {});

  return (
    <form action={action} className='flex flex-col items-end gap-1'>
      {state.error && <p className='text-xs text-red-400'>{state.error}</p>}
      {hasDirty && (
        <p className='text-xs text-amber-500'>Guarda todos los cambios antes de aprobar</p>
      )}
      <Button type='submit' disabled={pending || hasDirty}>
        {pending ? 'Aprobando...' : 'Aprobar plan'}
      </Button>
      <p className='text-xs text-zinc-600'>El plan pasará a estado &quot;Aprobado&quot;</p>
    </form>
  );
}
