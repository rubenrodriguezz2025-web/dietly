'use client';

import { useCallback, useActionState, useState } from 'react';

import { sendPlanToPatient } from './actions';

export function SendPlanButton({
  planId,
  hasEmail,
  patientToken,
  alreadySent,
}: {
  planId: string;
  hasEmail: boolean;
  patientToken: string;
  alreadySent: boolean;
}) {
  const [state, action, pending] = useActionState(
    sendPlanToPatient.bind(null, planId),
    {}
  );
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const planUrl = `${appUrl}/p/${patientToken}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(planUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [planUrl]);

  return (
    <div className='flex flex-col items-end gap-2'>
      <div className='flex items-center gap-2'>
        {/* Copiar enlace */}
        <button
          type='button'
          onClick={handleCopy}
          title='Copiar enlace para el paciente'
          className='inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700'
        >
          {copied ? (
            <>
              <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='20 6 9 17 4 12' />
              </svg>
              Copiado
            </>
          ) : (
            <>
              <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
                <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
              </svg>
              Copiar enlace
            </>
          )}
        </button>

        {/* Enviar por email */}
        {!hasEmail ? (
          <button
            disabled
            title='El paciente no tiene email. Añádelo en su ficha.'
            className='inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white opacity-40'
          >
            Enviar al paciente
          </button>
        ) : (
          <form action={action}>
            <button
              type='submit'
              disabled={pending}
              className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-60'
            >
              {pending ? (
                <>
                  <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  Enviando...
                </>
              ) : (
                <>
                  <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <line x1='22' y1='2' x2='11' y2='13' />
                    <polygon points='22 2 15 22 11 13 2 9 22 2' />
                  </svg>
                  {alreadySent ? 'Reenviar al paciente' : 'Enviar al paciente'}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Feedback */}
      {state.ok && (
        <p className='text-xs text-emerald-500'>✓ Email enviado correctamente</p>
      )}
      {state.error && (
        <p className='max-w-xs text-right text-xs text-red-400'>{state.error}</p>
      )}
      {!hasEmail && (
        <p className='text-xs text-zinc-600'>
          El paciente no tiene email — usa &quot;Copiar enlace&quot; para compartirlo manualmente
        </p>
      )}
    </div>
  );
}
