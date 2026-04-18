'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { sendPlanToPatient } from './actions';

type Props = {
  planId: string;
  hasEmail: boolean;
};

export function PostApprovalBanner({ planId, hasEmail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSend = () => {
    setError(null);
    startTransition(async () => {
      const res = await sendPlanToPatient(planId, {}, new FormData());
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-amber-700/40 bg-amber-950/25 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5'>
      <div className='flex items-start gap-3'>
        <span aria-hidden='true' className='mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-900/40 text-base'>
          ✅
        </span>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-semibold text-amber-100'>
            Plan aprobado. El paciente aún NO lo ha recibido.
          </p>
          <p className='text-xs leading-relaxed text-amber-200/70'>
            Pulsa &quot;Enviar al paciente&quot; para notificárselo por email.
          </p>
          {error && (
            <p className='mt-1 text-xs text-red-400'>{error}</p>
          )}
        </div>
      </div>

      <div className='flex flex-shrink-0 items-center gap-2'>
        {hasEmail ? (
          <button
            type='button'
            onClick={handleSend}
            disabled={isPending}
            className='inline-flex items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#155f38] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60'
          >
            {isPending ? 'Enviando…' : 'Enviar al paciente →'}
          </button>
        ) : (
          <p className='text-xs text-amber-200/80'>
            Sin email — usa &quot;Copiar enlace&quot; o &quot;WhatsApp&quot; en la barra superior.
          </p>
        )}
      </div>
    </div>
  );
}
