'use client';

import { useState } from 'react';
import Link from 'next/link';

type DueReminder = {
  id: string;
  remind_at: string;
  patients: { id: string; name: string } | null;
};

export function DueRemindersBanner({ reminders }: { reminders: DueReminder[] }) {
  const [collapsed, setCollapsed] = useState(reminders.length > 3);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || reminders.length === 0) return null;

  const visibles = collapsed ? reminders.slice(0, 3) : reminders;
  const hayMas = reminders.length > 3;

  return (
    <div className='rounded-xl border border-amber-900/40 bg-amber-950/30 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex-shrink-0'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='text-amber-400'
              aria-hidden='true'
            >
              <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
              <path d='M13.73 21a2 2 0 0 1-3.46 0' />
            </svg>
          </div>
          <div className='flex flex-col gap-2'>
            <p className='text-sm font-semibold text-amber-400'>
              {reminders.length === 1
                ? 'Tienes 1 paciente pendiente de revisión'
                : `Tienes ${reminders.length} pacientes pendientes de revisión`}
            </p>
            <ul className='flex flex-col gap-1'>
              {visibles.map((r) =>
                r.patients ? (
                  <li key={r.id} className='flex items-center gap-2'>
                    <span className='h-1 w-1 rounded-full bg-amber-600' />
                    <Link
                      href={`/dashboard/patients/${r.patients.id}`}
                      className='text-sm text-amber-300 underline-offset-2 transition-colors hover:text-amber-200 hover:underline'
                    >
                      {r.patients.name}
                    </Link>
                    <span className='text-xs text-amber-700'>
                      (revisión el{' '}
                      {new Date(r.remind_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      )
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
            {hayMas && (
              <button
                type='button'
                onClick={() => setCollapsed((c) => !c)}
                className='mt-1 w-fit text-xs text-amber-600 transition-colors hover:text-amber-400'
              >
                {collapsed
                  ? `Ver ${reminders.length - 3} más →`
                  : 'Ver menos'}
              </button>
            )}
          </div>
        </div>

        {/* Cerrar banner */}
        <button
          type='button'
          onClick={() => setDismissed(true)}
          aria-label='Cerrar aviso'
          className='flex-shrink-0 text-amber-700 transition-colors hover:text-amber-500'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <line x1='18' y1='6' x2='6' y2='18' />
            <line x1='6' y1='6' x2='18' y2='18' />
          </svg>
        </button>
      </div>
    </div>
  );
}
