'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL_MS = 4_000;

const STEPS = [
  'Calculando objetivos nutricionales...',
  'Generando Lunes...',
  'Generando Martes...',
  'Generando Miércoles...',
  'Generando Jueves...',
  'Generando Viernes...',
  'Generando Sábado...',
  'Generando Domingo...',
  'Preparando lista de la compra...',
  'Guardando el plan...',
];

export function GeneratingPoller({ planId }: { planId: string }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    // Avanza el texto del paso cada ~20s para dar sensación de progreso
    const stepTimer = setInterval(() => {
      const next = Math.min(stepRef.current + 1, STEPS.length - 1);
      stepRef.current = next;
      setStepIndex(next);
    }, 20_000);

    // Polling: comprueba el estado del plan en la DB cada 4s
    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/plans/${planId}/status`);
        if (!res.ok) return;
        const { status } = await res.json() as { status: string };
        if (status !== 'generating') {
          clearInterval(pollTimer);
          clearInterval(stepTimer);
          router.refresh();
        }
      } catch {
        // error de red — ignorar y reintentar en el siguiente tick
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollTimer);
      clearInterval(stepTimer);
    };
  }, [planId, router]);

  const pct = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <div className='flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
      <div className='flex items-center gap-3'>
        <div className='h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200' />
        <p className='text-sm text-zinc-300'>{STEPS[stepIndex]}</p>
      </div>

      {/* Barra de progreso animada */}
      <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
        <div
          className='h-full rounded-full bg-emerald-600 transition-all duration-[2000ms] ease-in-out'
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className='text-xs text-zinc-600'>
        La generación tarda entre 2 y 5 minutos. La página se actualizará automáticamente al terminar.
      </p>
    </div>
  );
}
