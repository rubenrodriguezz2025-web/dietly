'use client';

import { useCallback,useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { AnthropicErrorCode } from '@/libs/ai/resilience';
import type { PatientGoal } from '@/types/dietly';
import { GOAL_LABELS } from '@/types/dietly';
import type { CalcTargets } from '@/utils/calc-targets';

import { PlanGenerationStatus } from './plan-generation-status';


type State = 'idle' | 'confirm' | 'generating' | 'error' | 'timeout';

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

interface Props {
  patientId: string;
  initialTargets: CalcTargets | null;
  patientWeight: number;
  patientGoal: PatientGoal;
  hasIntake?: boolean;
  hasConsent?: boolean;
  onGoToIntake?: () => void;
}

export function GenerateButton({ patientId, initialTargets, patientWeight, patientGoal, hasIntake, hasConsent = true, onGoToIntake }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [currentDay, setCurrentDay] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<AnthropicErrorCode | string | undefined>();

  // A-11: AbortController ref para cancelar el stream al desmontar
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleCancel() {
    abortRef.current?.abort();
    setState('idle');
  }

  function handleRetry() {
    setState('idle');
    setErrorMsg('');
    setErrorCode(undefined);
  }

  const handleGenerate = useCallback(async () => {
    // Cancelar stream previo si existe
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState('generating');
    setCurrentDay(0);
    setErrorMsg('');
    setErrorCode(undefined);

    // A-11: Timeout de 5 minutos
    timeoutRef.current = setTimeout(() => {
      if (controller.signal.aborted) return;
      setState('timeout');
    }, GENERATION_TIMEOUT_MS);

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        let msg = `Error HTTP ${res.status}. Inténtalo de nuevo.`;
        try {
          const b = await res.clone().json();
          if (b.beta_limit_reached) {
            msg = b.error as string;
          } else if (b.error || b.detail) {
            msg = `Error (${b.detail ?? b.error}). Inténtalo de nuevo.`;
          }
        } catch { /* ignore */ }
        setState('error');
        setErrorMsg(msg);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let doneReceived = false;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'progress') setCurrentDay(data.day as number);
              else if (data.type === 'done') { doneReceived = true; router.push(`/dashboard/plans/${data.plan_id}`); }
              else if (data.type === 'error') {
                setState('error');
                setErrorMsg(data.message as string);
                setErrorCode(data.error_code as AnthropicErrorCode | undefined);
                return;
              }
            } catch { /* ignore malformed */ }
          }
        }
      } catch (readErr) {
        // Si fue abort intencional (desmontaje), no mostramos error
        if (controller.signal.aborted) return;
        throw readErr;
      }
      // Stream cerrado sin recibir 'done'
      if (!doneReceived) {
        setState('error');
        setErrorMsg('La conexión se ha cortado inesperadamente. El plan parcial puede haberse guardado — revisa la sección de planes. Si no aparece, inténtalo de nuevo.');
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setState('error');
      setErrorMsg('Error de red. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [patientId, router]);

  // ── Error ────────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <PlanGenerationStatus
        variant='error'
        message={errorMsg}
        errorCode={errorCode}
        onRetry={handleRetry}
      />
    );
  }

  // ── Timeout (A-11) ──────────────────────────────────────────────────────────
  if (state === 'timeout') {
    return (
      <div className='flex w-72 flex-col gap-3 rounded-lg border border-amber-600/30 bg-amber-950/20 p-3.5'>
        <div className='flex items-start gap-2.5'>
          <svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='mt-0.5 flex-shrink-0 text-amber-500' aria-hidden='true'>
            <circle cx='12' cy='12' r='10' /><polyline points='12 6 12 12 16 14' />
          </svg>
          <div className='flex flex-col gap-1'>
            <p className='text-xs font-medium text-amber-300'>
              La generación está tardando más de lo habitual
            </p>
            <p className='text-[11px] leading-relaxed text-amber-200/60'>
              Lleva más de 5 minutos. Puedes esperar o reintentar la generación.
            </p>
          </div>
        </div>
        <button
          type='button'
          onClick={() => {
            abortRef.current?.abort();
            handleRetry();
          }}
          className='w-full rounded-md border border-amber-600/40 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:border-amber-500/60 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500'
        >
          Reintentar generación
        </button>
      </div>
    );
  }

  // ── Generando ────────────────────────────────────────────────────────────────
  if (state === 'generating') {
    return <PlanGenerationStatus variant='generating' currentDay={currentDay} />;
  }

  // ── Confirmación de generación ────────────────────────────────────────────────
  if (state === 'confirm') {
    return (
      <div className='w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl'>
        <div className='flex items-center justify-between border-b border-zinc-800 px-4 py-3'>
          <span className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Confirmar generación
          </span>
          <button
            type='button'
            onClick={handleCancel}
            aria-label='Cancelar'
            className='rounded p-1 text-zinc-600 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        </div>

        <div className='px-4 pt-3 pb-4'>
          {/* Banner cuestionario */}
          {hasIntake ? (
            <div className='mb-3 flex items-center gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2'>
              <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='flex-shrink-0 text-emerald-500' aria-hidden='true'>
                <polyline points='20 6 9 17 4 12' />
              </svg>
              <p className='text-[11px] leading-snug text-emerald-400'>
                Cuestionario completado — el plan incluirá las preferencias del paciente
              </p>
            </div>
          ) : (
            <div className='mb-3 rounded-lg border border-amber-600/40 bg-[#1a0a00] px-3 py-2.5'>
              <div className='flex gap-2'>
                <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='mt-px flex-shrink-0 text-amber-500' aria-hidden='true'>
                  <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
                  <line x1='12' y1='9' x2='12' y2='13' /><line x1='12' y1='17' x2='12.01' y2='17' />
                </svg>
                <div className='flex flex-col gap-1.5'>
                  <p className='text-[11px] leading-snug text-amber-200/80'>
                    Sin cuestionario — el plan se generará solo con los datos básicos.
                  </p>
                  {onGoToIntake && (
                    <button type='button' onClick={() => { handleCancel(); onGoToIntake(); }} className='w-fit text-[11px] text-amber-500 transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:underline'>
                      Enviar cuestionario primero →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Objetivo + macros calculados */}
          <div className='mb-2 flex items-center justify-between'>
            <p className='text-[11px] font-medium text-zinc-500'>{GOAL_LABELS[patientGoal]}</p>
            {initialTargets?.estimated && (
              <span className='rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500'>
                ~ estimado
              </span>
            )}
          </div>
          {initialTargets ? (
            <div className='grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-zinc-800/60 px-3 py-2.5'>
              <span className='text-[12px] text-zinc-500'>Kcal/día</span>
              <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>{initialTargets.calories} kcal</span>
              <span className='text-[12px] text-zinc-500'>Proteína</span>
              <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>{initialTargets.protein_g}g · {initialTargets.protein_per_kg}g/kg</span>
              <span className='text-[12px] text-zinc-500'>Carbohidratos</span>
              <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>{initialTargets.carbs_g}g · {Math.round(initialTargets.carbs_pct * 100)}%</span>
              <span className='text-[12px] text-zinc-500'>Grasa</span>
              <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>{initialTargets.fat_g}g · {Math.round(initialTargets.fat_pct * 100)}%</span>
            </div>
          ) : (
            <p className='rounded-lg bg-amber-950/40 px-3 py-2.5 text-[11px] text-amber-400'>
              Completa peso, altura y fecha de nacimiento para ver los objetivos estimados.
            </p>
          )}

          {/* Acciones */}
          <div className='mt-4 flex gap-2'>
            <button type='button' onClick={handleCancel} className='flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'>
              Cancelar
            </button>
            <button type='button' onClick={handleGenerate} className='flex-1 rounded-lg bg-[#1a7a45] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#155f38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900 active:bg-[#0f4a2c]'>
              Generar plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sin consentimiento ───────────────────────────────────────────────────────
  if (!hasConsent) {
    return (
      <div className='flex flex-col items-end gap-1.5'>
        <div className='flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='11'
            height='11'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='flex-shrink-0 text-zinc-500'
            aria-hidden='true'
          >
            <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
            <path d='M7 11V7a5 5 0 0 1 10 0v4' />
          </svg>
          <span className='text-[11px] text-zinc-500'>Sin consentimiento IA</span>
        </div>
        <Button disabled title='El paciente no ha dado consentimiento para procesar sus datos con IA'>
          + Generar plan
        </Button>
      </div>
    );
  }

  // ── Idle ────────────────────────────────────────────────────────────────────
  return (
    <Button onClick={() => setState('confirm')}>
      + Generar plan
    </Button>
  );
}
