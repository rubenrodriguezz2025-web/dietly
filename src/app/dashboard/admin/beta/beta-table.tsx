'use client';

import { useOptimistic, useTransition } from 'react';

import { removeBetaEmail } from './actions';

interface BetaEntry {
  id: string;
  email: string;
  name: string | null;
  added_at: string;
  notes: string | null;
}

export function BetaTable({ entries }: { entries: BetaEntry[] }) {
  const [optimisticEntries, removeOptimistic] = useOptimistic(
    entries,
    (state, idToRemove: string) => state.filter((e) => e.id !== idToRemove),
  );
  const [, startTransition] = useTransition();

  function handleRemove(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      await removeBetaEmail(id);
    });
  }

  if (optimisticEntries.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-zinc-600'>
        No hay emails en la lista todavía.
      </p>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-zinc-800'>
            <th className='pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>Nombre</th>
            <th className='pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>Email</th>
            <th className='hidden pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell'>Notas</th>
            <th className='pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>Añadido</th>
            <th className='pb-2' />
          </tr>
        </thead>
        <tbody className='divide-y divide-zinc-800/60'>
          {optimisticEntries.map((entry) => (
            <tr key={entry.id} className='group'>
              <td className='py-3 pr-4 text-zinc-300'>
                {entry.name ?? <span className='text-zinc-600'>—</span>}
              </td>
              <td className='py-3 pr-4 font-mono text-xs text-zinc-400'>{entry.email}</td>
              <td className='hidden py-3 pr-4 text-zinc-500 sm:table-cell'>
                {entry.notes ?? <span className='text-zinc-700'>—</span>}
              </td>
              <td className='py-3 pr-4 text-xs text-zinc-600 tabular-nums'>
                {new Date(entry.added_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className='py-3 text-right'>
                <button
                  type='button'
                  onClick={() => handleRemove(entry.id)}
                  className='rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500'
                  aria-label={`Eliminar ${entry.email}`}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
