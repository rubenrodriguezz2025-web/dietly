'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  patientId: string;
  daysCompleted: number;
}

export function RetryGenerationButton({ patientId, daysCompleted }: Props) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'generating' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function handleRetry() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('generating');
    setErrorMsg('');

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setState('error');
        setErrorMsg(`Error HTTP ${res.status}. Inténtalo de nuevo.`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'done') {
              router.push(`/dashboard/plans/${data.plan_id}`);
              return;
            }
            if (data.type === 'error') {
              setState('error');
              setErrorMsg((data.message as string) ?? 'Error al regenerar el plan.');
              return;
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setState('error');
      setErrorMsg('Error de red. Comprueba tu conexión e inténtalo de nuevo.');
    }
  }

  if (state === 'generating') {
    return (
      <div className='flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300'>
        <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200' />
        <span>Reintentando... (2-5 min)</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <button
        type='button'
        onClick={handleRetry}
        className='w-fit rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#155f38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950'
      >
        Reintentar generación
      </button>
      <p className='text-[11px] text-zinc-500'>
        Se creará un plan nuevo desde cero. {daysCompleted > 0 ? `Este borrador (${daysCompleted}/7 días) se conservará como referencia.` : ''}
      </p>
      {state === 'error' && (
        <p className='text-xs text-red-400'>{errorMsg}</p>
      )}
    </div>
  );
}
