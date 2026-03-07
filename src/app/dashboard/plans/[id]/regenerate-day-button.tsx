'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';

import { regenerateDay } from './actions';

export function RegenerateDayButton({
  planId,
  dayNumber,
  dayName,
}: {
  planId: string;
  dayNumber: number;
  dayName: string;
}) {
  const [state, action, pending] = useActionState(
    regenerateDay.bind(null, planId, dayNumber),
    {}
  );

  return (
    <form action={action}>
      {state.error && <p className='mb-1 text-xs text-red-400'>{state.error}</p>}
      <Button type='submit' variant='outline' size='sm' disabled={pending}>
        {pending ? (
          <span className='flex items-center gap-1.5'>
            <span className='h-3 w-3 animate-spin rounded-full border border-zinc-400 border-t-transparent' />
            Regenerando...
          </span>
        ) : (
          `Regenerar ${dayName}`
        )}
      </Button>
    </form>
  );
}
