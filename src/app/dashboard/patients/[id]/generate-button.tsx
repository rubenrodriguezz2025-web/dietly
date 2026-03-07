'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type State = 'idle' | 'generating' | 'error';

export function GenerateButton({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [currentDay, setCurrentDay] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGenerate() {
    setState('generating');
    setCurrentDay(0);
    setErrorMsg('');

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      });

      if (!res.ok || !res.body) {
        setState('error');
        setErrorMsg('Error de conexión. Inténtalo de nuevo.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              setCurrentDay(data.day as number);
            } else if (data.type === 'done') {
              router.push(`/dashboard/plans/${data.plan_id}`);
            } else if (data.type === 'error') {
              setState('error');
              setErrorMsg(data.message as string);
            }
          } catch {
            // ignore malformed line
          }
        }
      }
    } catch {
      setState('error');
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
    }
  }

  if (state === 'error') {
    return (
      <div className='flex flex-col items-end gap-2'>
        <p className='text-xs text-red-400'>{errorMsg}</p>
        <Button variant='outline' size='sm' onClick={() => setState('idle')}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (state === 'generating') {
    return (
      <div className='flex flex-col items-end gap-2'>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 animate-spin rounded-full border border-zinc-400 border-t-transparent' />
          <span className='text-sm text-zinc-400'>
            {currentDay > 0
              ? `Generando ${DAY_NAMES[currentDay - 1]}... (${currentDay}/7)`
              : 'Iniciando...'}
          </span>
        </div>
        <div className='flex gap-1'>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-5 rounded-full transition-colors ${
                i < currentDay ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return <Button onClick={handleGenerate}>+ Generar plan</Button>;
}
