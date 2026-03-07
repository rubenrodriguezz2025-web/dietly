'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';

import { approvePlan } from './actions';

export function ApproveButton({ planId }: { planId: string }) {
  const [state, action, pending] = useActionState(approvePlan.bind(null, planId), {});

  return (
    <form action={action} className='flex flex-col items-end gap-1'>
      {state.error && <p className='text-xs text-red-400'>{state.error}</p>}
      <Button type='submit' disabled={pending}>
        {pending ? 'Aprobando...' : 'Aprobar plan'}
      </Button>
      <p className='text-xs text-zinc-600'>El plan pasará a estado &quot;Aprobado&quot;</p>
    </form>
  );
}
