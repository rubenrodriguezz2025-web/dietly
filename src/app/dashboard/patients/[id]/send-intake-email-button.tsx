'use client';

import { useEffect, useState, useTransition } from 'react';

import { sendIntakeEmail } from './send-intake-email-action';

type Props = {
  patientId: string;
  patientEmail: string | null;
};

type ButtonState = 'idle' | 'sending' | 'sent' | 'error';

export function SendIntakeEmailButton({ patientId, patientEmail }: Props) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ButtonState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resetear a 'idle' tras 4 s para que el botón vuelva a estar disponible
  useEffect(() => {
    if (state === 'sent' || state === 'error') {
      const timer = setTimeout(() => {
        setState('idle');
        setErrorMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const currentState: ButtonState = isPending ? 'sending' : state;
  const disabled = currentState === 'sending' || currentState === 'sent' || !patientEmail;

  function handleClick() {
    if (disabled) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await sendIntakeEmail(patientId);
      if (result.error) {
        setState('error');
        setErrorMsg(result.error);
      } else {
        setState('sent');
      }
    });
  }

  return (
    <div className='flex flex-1 flex-col gap-1.5'>
      <button
        type='button'
        onClick={handleClick}
        disabled={disabled}
        title={!patientEmail ? 'El paciente no tiene email registrado' : undefined}
        className={`group flex flex-1 flex-col items-center gap-2.5 rounded-xl border px-5 py-5 text-center transition-all duration-200 active:scale-[0.99]
          ${currentState === 'sent'
            ? 'border-emerald-800/50 bg-emerald-950/20 cursor-default'
            : currentState === 'error'
              ? 'border-red-800/50 bg-red-950/20 cursor-default'
              : !patientEmail
                ? 'cursor-not-allowed border-zinc-800/50 bg-zinc-900/20 opacity-50'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
          }`}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors
            ${currentState === 'sent'
              ? 'bg-emerald-900/50 text-emerald-400'
              : currentState === 'error'
                ? 'bg-red-900/50 text-red-400'
                : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
            }`}
        >
          {currentState === 'sending' ? (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='animate-spin'
              aria-hidden='true'
            >
              <path d='M21 12a9 9 0 1 1-6.219-8.56' />
            </svg>
          ) : currentState === 'sent' ? (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <polyline points='20 6 9 17 4 12' />
            </svg>
          ) : currentState === 'error' ? (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'
            >
              <line x1='22' y1='2' x2='11' y2='13' />
              <polygon points='22 2 15 22 11 13 2 9 22 2' />
            </svg>
          )}
        </div>

        <div>
          <p
            className={`text-sm font-semibold ${
              currentState === 'sent'
                ? 'text-emerald-400'
                : currentState === 'error'
                  ? 'text-red-400'
                  : 'text-zinc-300'
            }`}
          >
            {currentState === 'sending'
              ? 'Enviando…'
              : currentState === 'sent'
                ? 'Enviado'
                : currentState === 'error'
                  ? 'Error al enviar'
                  : 'Enviar al paciente'}
          </p>
          <p className='mt-0.5 text-xs text-zinc-600'>
            {currentState === 'sent'
              ? `Email enviado a ${patientEmail}`
              : currentState === 'error'
                ? (errorMsg ?? 'Inténtalo de nuevo')
                : !patientEmail
                  ? 'Sin email registrado'
                  : 'Link por email para rellenarlo desde casa'}
          </p>
        </div>
      </button>
    </div>
  );
}
