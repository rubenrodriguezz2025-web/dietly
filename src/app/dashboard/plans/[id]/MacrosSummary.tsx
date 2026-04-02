'use client';

import { CheckIcon } from './day-editor-shared';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type MacrosSummaryProps = {
  saveStatus: SaveStatus;
};

export function MacrosSummary({ saveStatus }: MacrosSummaryProps) {
  if (saveStatus === 'idle') return null;

  return (
    <div className='flex justify-end border-t border-gray-200 dark:border-zinc-800/60 px-5 py-2'>
      {saveStatus === 'saving' && (
        <span className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-600'>
          <span className='inline-block h-2.5 w-2.5 animate-spin rounded-full border border-gray-400 dark:border-zinc-600 border-t-transparent' />
          Guardando…
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className='flex items-center gap-1.5 text-xs text-emerald-600'>
          <CheckIcon size={10} />
          Guardado
        </span>
      )}
      {saveStatus === 'error' && (
        <span className='text-xs text-amber-500'>Error al guardar — reintentando…</span>
      )}
    </div>
  );
}
