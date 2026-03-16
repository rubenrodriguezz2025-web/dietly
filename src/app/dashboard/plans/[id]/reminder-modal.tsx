'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { saveFollowupReminder } from './followup-actions';

type Props = {
  patientId: string;
  nutritionistId: string;
  patientName: string;
};

const OPCIONES = [
  { label: '2 semanas', days: 14 },
  { label: '1 mes', days: 30 },
  { label: '2 meses', days: 60 },
] as const;

export function ReminderModal({ patientId, nutritionistId, patientName }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | 'custom' | 'none' | null>(null);
  const [customDays, setCustomDays] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function getEffectiveDays(): number | null {
    if (selected === 'none' || selected === null) return null;
    if (selected === 'custom') {
      const n = parseInt(customDays, 10);
      return isNaN(n) || n < 1 ? null : n;
    }
    return selected;
  }

  function handleSkip() {
    router.push(`/dashboard/patients/${patientId}`);
  }

  function handleConfirm() {
    if (selected === 'none') {
      handleSkip();
      return;
    }

    if (selected === 'custom') {
      const n = parseInt(customDays, 10);
      if (isNaN(n) || n < 1) {
        setError('Introduce un número de días válido (mínimo 1).');
        return;
      }
    }

    if (selected === null) {
      setError('Selecciona una opción.');
      return;
    }

    const days = getEffectiveDays();

    startTransition(async () => {
      const result = await saveFollowupReminder(patientId, nutritionistId, days, patientName);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/patients/${patientId}`);
      }
    });
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
      <div className='mx-4 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur'>
        {/* Icono */}
        <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-950/60'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
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

        <h2 className='mb-1 text-lg font-semibold text-zinc-100'>
          Programar revisión de {patientName}
        </h2>
        <p className='mb-5 text-sm text-zinc-500'>
          ¿Cuándo quieres revisar a este paciente? Te avisaremos en el dashboard.
        </p>

        {/* Opciones */}
        <div className='flex flex-col gap-2'>
          {OPCIONES.map(({ label, days }) => (
            <button
              key={days}
              type='button'
              onClick={() => { setSelected(days); setError(null); }}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                selected === days
                  ? 'border-[#1a7a45] bg-[#1a7a45]/15 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
              }`}
            >
              <span>{label}</span>
              {selected === days && (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                >
                  <polyline points='20 6 9 17 4 12' />
                </svg>
              )}
            </button>
          ))}

          {/* Personalizado */}
          <button
            type='button'
            onClick={() => { setSelected('custom'); setError(null); }}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-150 ${
              selected === 'custom'
                ? 'border-[#1a7a45] bg-[#1a7a45]/15 text-emerald-300'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
          >
            <span>Personalizado</span>
            {selected === 'custom' && (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
            )}
          </button>

          {selected === 'custom' && (
            <div className='flex items-center gap-2 pl-1'>
              <input
                type='number'
                min='1'
                placeholder='Días'
                value={customDays}
                onChange={(e) => { setCustomDays(e.target.value); setError(null); }}
                className='w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#1a7a45] focus:outline-none focus:ring-1 focus:ring-[#1a7a45]'
              />
              <span className='text-sm text-zinc-500'>días desde hoy</span>
            </div>
          )}

          {/* Sin recordatorio */}
          <button
            type='button'
            onClick={() => { setSelected('none'); setError(null); }}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-150 ${
              selected === 'none'
                ? 'border-zinc-600 bg-zinc-800 text-zinc-400'
                : 'border-zinc-800 bg-zinc-900 text-zinc-600 hover:border-zinc-700 hover:text-zinc-500'
            }`}
          >
            <span>Sin recordatorio</span>
            {selected === 'none' && (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
            )}
          </button>
        </div>

        {error && <p className='mt-3 text-sm text-red-400'>{error}</p>}

        {/* Acciones */}
        <div className='mt-5 flex justify-end gap-3'>
          <button
            type='button'
            onClick={handleSkip}
            className='rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
          >
            Omitir
          </button>
          <button
            type='button'
            disabled={isPending || selected === null}
            onClick={handleConfirm}
            className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#155f38] disabled:cursor-not-allowed disabled:opacity-40'
          >
            {isPending ? (
              <>
                <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                Guardando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
