'use client';

import { useState, useTransition } from 'react';

import { getIntakeFileUrl } from './intake-file-url-action';

function fileNameFromPath(path: string): string {
  const last = path.split('/').pop() ?? path;
  // Los paths incluyen un timestamp prefijo "1698765432123_nombre.pdf"
  return last.replace(/^\d{10,}_/, '');
}

export function IntakeAttachedFiles({ paths }: { paths: string[] }) {
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDownload(path: string) {
    setError(null);
    setLoadingPath(path);
    startTransition(async () => {
      const res = await getIntakeFileUrl(path);
      setLoadingPath(null);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      window.open(res.url, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <div className='flex flex-col gap-1.5'>
      {paths.map((path) => (
        <button
          key={path}
          type='button'
          disabled={isPending && loadingPath === path}
          onClick={() => handleDownload(path)}
          className='flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-700/60 dark:hover:text-emerald-400'
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14 2 14 8 20 8' />
          </svg>
          <span className='truncate'>{fileNameFromPath(path)}</span>
          {isPending && loadingPath === path && (
            <span className='ml-auto text-xs text-zinc-400'>Abriendo...</span>
          )}
        </button>
      ))}
      {error && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  );
}
