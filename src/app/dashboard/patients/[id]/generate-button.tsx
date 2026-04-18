'use client';

import { useCallback,useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PaywallModal } from '@/components/PaywallModal';
import { Button } from '@/components/ui/button';
import type { AnthropicErrorCode } from '@/libs/ai/resilience';
import type { PatientGoal } from '@/types/dietly';
import { GOAL_LABELS } from '@/types/dietly';
import type { CalcTargets } from '@/utils/calc-targets';
import { cn } from '@/utils/cn';

import { checkDuplicatePlan } from './check-duplicate-plan';
import { PlanGenerationStatus } from './plan-generation-status';


type State = 'idle' | 'checking' | 'duplicate' | 'confirm' | 'generating' | 'error' | 'timeout';

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

interface Props {
  patientId: string;
  initialTargets: CalcTargets | null;
  patientWeight: number;
  patientGoal: PatientGoal;
  hasIntake?: boolean;
  hasConsent?: boolean;
  onGoToIntake?: () => void;
  rejectedMeals?: string[];
}

export function GenerateButton({ patientId, initialTargets, patientWeight, patientGoal, hasIntake, hasConsent = true, onGoToIntake, rejectedMeals = [] }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [currentDay, setCurrentDay] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<AnthropicErrorCode | string | undefined>();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [duplicatePlanId, setDuplicatePlanId] = useState<string | null>(null);

  // Overrides de macros (strings porque los inputs son controlados; '' = usar calculado).
  // carbs_pct se almacena como porcentaje 10-80 (se convierte a decimal al enviar).
  const [edits, setEdits] = useState({ calories: '', protein_per_kg: '', carbs_pct: '' });

  // Complejidad de las recetas (afecta al prompt de generación).
  const [cookingComplexity, setCookingComplexity] = useState<'simple' | 'medium' | 'elaborate'>('medium');

  const calcCalories = initialTargets?.calories ?? null;
  const calcProteinPerKg = initialTargets?.protein_per_kg ?? null;
  const calcCarbsPct = initialTargets ? Math.round(initialTargets.carbs_pct * 100) : null;

  const parsedCalories = edits.calories === '' ? null : Number(edits.calories);
  const parsedProtein = edits.protein_per_kg === '' ? null : Number(edits.protein_per_kg);
  const parsedCarbs = edits.carbs_pct === '' ? null : Number(edits.carbs_pct);

  const errCalories = parsedCalories !== null && (Number.isNaN(parsedCalories) || parsedCalories < 1200 || parsedCalories > 5000);
  const errProtein = parsedProtein !== null && (Number.isNaN(parsedProtein) || parsedProtein < 0.5 || parsedProtein > 4);
  const errCarbs = parsedCarbs !== null && (Number.isNaN(parsedCarbs) || parsedCarbs < 10 || parsedCarbs > 80);
  const hasErrors = errCalories || errProtein || errCarbs;

  // Grasa derivada en vivo (solo lectura): 100% − carbs%.
  const effectiveCarbsPct = !errCarbs && parsedCarbs !== null ? parsedCarbs : calcCarbsPct;
  const derivedFatPct = effectiveCarbsPct !== null ? 100 - effectiveCarbsPct : null;

  const handleRestore = () => setEdits({ calories: '', protein_per_kg: '', carbs_pct: '' });

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
    setDuplicatePlanId(null);
  }

  const handleStart = useCallback(async () => {
    setState('checking');
    try {
      const result = await checkDuplicatePlan(patientId);
      if (result.exists) {
        setDuplicatePlanId(result.planId);
        setState('duplicate');
      } else {
        setState('confirm');
      }
    } catch {
      // Si el check falla, no bloquear — pasar al flujo normal
      setState('confirm');
    }
  }, [patientId]);

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

    // Construir macro_overrides desde el estado actual (solo campos editados
     // y válidos distintos al calculado).
    const cal = edits.calories === '' ? null : Number(edits.calories);
    const pro = edits.protein_per_kg === '' ? null : Number(edits.protein_per_kg);
    const carb = edits.carbs_pct === '' ? null : Number(edits.carbs_pct);
    const initCalories = initialTargets?.calories ?? null;
    const initProtein = initialTargets?.protein_per_kg ?? null;
    const initCarbs = initialTargets ? Math.round(initialTargets.carbs_pct * 100) : null;

    const overrides: { calories?: number; protein_per_kg?: number; carbs_pct?: number } = {};
    if (cal !== null && !Number.isNaN(cal) && cal !== initCalories) overrides.calories = cal;
    if (pro !== null && !Number.isNaN(pro) && pro !== initProtein) overrides.protein_per_kg = pro;
    if (carb !== null && !Number.isNaN(carb) && carb !== initCarbs) overrides.carbs_pct = carb / 100;
    const hasOverrides = Object.keys(overrides).length > 0;

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...(hasOverrides ? { macro_overrides: overrides } : {}),
          cooking_complexity: cookingComplexity,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        let msg = `Error HTTP ${res.status}. Inténtalo de nuevo.`;
        try {
          const b = await res.clone().json();
          if (b.code === 'SUBSCRIPTION_REQUIRED') {
            setState('idle');
            setPaywallOpen(true);
            return;
          }
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
                if (data.code === 'SUBSCRIPTION_REQUIRED') {
                  setState('idle');
                  setPaywallOpen(true);
                  return;
                }
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
  }, [patientId, router, edits, initialTargets, cookingComplexity]);

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

  // ── Comprobando duplicado ──────────────────────────────────────────────────
  if (state === 'checking') {
    return (
      <div className='inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400'>
        <span className='inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent' aria-hidden='true' />
        Comprobando planes existentes…
      </div>
    );
  }

  // ── Aviso de plan duplicado ────────────────────────────────────────────────
  if (state === 'duplicate') {
    return (
      <div className='w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-amber-600/40 bg-amber-950/20 shadow-xl'>
        <div className='flex items-center justify-between border-b border-amber-900/40 px-4 py-3'>
          <span className='text-xs font-semibold uppercase tracking-wider text-amber-400'>
            Plan ya existe
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
          <p className='text-xs leading-relaxed text-amber-200/90'>
            Ya existe un plan para este paciente en la semana de inicio. Generar uno nuevo creará un plan duplicado.
          </p>
          <div className='mt-4 flex flex-col gap-2'>
            {duplicatePlanId && (
              <Link
                href={`/dashboard/plans/${duplicatePlanId}`}
                className='rounded-lg border border-zinc-700 bg-zinc-900 py-2 text-center text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'
              >
                Ver plan existente →
              </Link>
            )}
            <button
              type='button'
              onClick={() => setState('confirm')}
              className='rounded-lg bg-amber-600/80 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900'
            >
              Generar uno nuevo de todos modos
            </button>
            <button
              type='button'
              onClick={handleCancel}
              className='rounded-lg py-1.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:underline'
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmación de generación ────────────────────────────────────────────────
  if (state === 'confirm') {
    return (
      <div className='w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl'>
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

          {/* Banner platos rechazados */}
          {rejectedMeals.length > 0 && (
            <div className='mb-3 flex gap-2 rounded-lg border border-violet-900/50 bg-violet-950/20 px-3 py-2.5'>
              <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='mt-0.5 flex-shrink-0 text-violet-400' aria-hidden='true'>
                <polyline points='17 1 21 5 17 9' />
                <path d='M3 11V9a4 4 0 014-4h14' />
                <polyline points='7 23 3 19 7 15' />
                <path d='M21 13v2a4 4 0 01-4 4H3' />
              </svg>
              <div className='flex flex-col gap-1'>
                <p className='text-[11px] leading-snug text-violet-300'>
                  El paciente ha rechazado {rejectedMeals.length} plato{rejectedMeals.length !== 1 ? 's' : ''} en planes anteriores
                </p>
                <p className='text-[10px] leading-snug text-violet-400/60'>
                  {rejectedMeals.slice(0, 3).join(', ')}{rejectedMeals.length > 3 ? ` y ${rejectedMeals.length - 3} más` : ''}. Se evitarán en el nuevo plan.
                </p>
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
            <>
              <div className='space-y-2 rounded-lg bg-zinc-800/60 px-3 py-2.5'>
                {/* Calorías */}
                <div className='flex items-center justify-between gap-2'>
                  <label htmlFor='macro-calories' className='text-[12px] text-zinc-500'>
                    Kcal/día
                  </label>
                  <div className='flex items-center gap-1.5'>
                    <input
                      id='macro-calories'
                      type='number'
                      inputMode='numeric'
                      min={1200}
                      max={5000}
                      step={10}
                      placeholder={String(calcCalories)}
                      value={edits.calories}
                      onChange={(e) => setEdits((s) => ({ ...s, calories: e.target.value }))}
                      aria-invalid={errCalories}
                      className={cn(
                        'w-20 rounded-md border bg-zinc-950/60 px-2 py-0.5 text-right text-[12px] font-semibold tabular-nums text-zinc-200 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-1',
                        errCalories
                          ? 'border-red-500/70 focus-visible:ring-red-500'
                          : 'border-zinc-700 hover:border-zinc-600 focus-visible:ring-[#1a7a45]'
                      )}
                    />
                    <span className='w-[60px] text-right text-[10px] text-zinc-600'>
                      (calc: {calcCalories})
                    </span>
                  </div>
                </div>

                {/* Proteína */}
                <div className='flex items-center justify-between gap-2'>
                  <label htmlFor='macro-protein' className='text-[12px] text-zinc-500'>
                    Proteína g/kg
                  </label>
                  <div className='flex items-center gap-1.5'>
                    <input
                      id='macro-protein'
                      type='number'
                      inputMode='decimal'
                      min={0.5}
                      max={4}
                      step={0.1}
                      placeholder={String(calcProteinPerKg)}
                      value={edits.protein_per_kg}
                      onChange={(e) => setEdits((s) => ({ ...s, protein_per_kg: e.target.value }))}
                      aria-invalid={errProtein}
                      className={cn(
                        'w-20 rounded-md border bg-zinc-950/60 px-2 py-0.5 text-right text-[12px] font-semibold tabular-nums text-zinc-200 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-1',
                        errProtein
                          ? 'border-red-500/70 focus-visible:ring-red-500'
                          : 'border-zinc-700 hover:border-zinc-600 focus-visible:ring-[#1a7a45]'
                      )}
                    />
                    <span className='w-[60px] text-right text-[10px] text-zinc-600'>
                      (calc: {calcProteinPerKg})
                    </span>
                  </div>
                </div>

                {/* Carbohidratos */}
                <div className='flex items-center justify-between gap-2'>
                  <label htmlFor='macro-carbs' className='text-[12px] text-zinc-500'>
                    Carbs %
                  </label>
                  <div className='flex items-center gap-1.5'>
                    <input
                      id='macro-carbs'
                      type='number'
                      inputMode='numeric'
                      min={10}
                      max={80}
                      step={1}
                      placeholder={String(calcCarbsPct)}
                      value={edits.carbs_pct}
                      onChange={(e) => setEdits((s) => ({ ...s, carbs_pct: e.target.value }))}
                      aria-invalid={errCarbs}
                      className={cn(
                        'w-20 rounded-md border bg-zinc-950/60 px-2 py-0.5 text-right text-[12px] font-semibold tabular-nums text-zinc-200 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-1',
                        errCarbs
                          ? 'border-red-500/70 focus-visible:ring-red-500'
                          : 'border-zinc-700 hover:border-zinc-600 focus-visible:ring-[#1a7a45]'
                      )}
                    />
                    <span className='w-[60px] text-right text-[10px] text-zinc-600'>
                      (calc: {calcCarbsPct})
                    </span>
                  </div>
                </div>

                {/* Grasa (derivada, solo lectura) */}
                <div className='flex items-center justify-between gap-2 border-t border-zinc-700/50 pt-2'>
                  <span className='text-[12px] text-zinc-500'>Grasa %</span>
                  <div className='flex items-center gap-1.5'>
                    <span className='inline-flex h-[22px] w-20 items-center justify-end rounded-md bg-zinc-950/40 px-2 text-[12px] font-semibold tabular-nums text-zinc-400'>
                      {derivedFatPct ?? '—'}%
                    </span>
                    <span className='w-[60px] text-right text-[10px] text-zinc-600'>
                      (auto)
                    </span>
                  </div>
                </div>
              </div>

              {/* Hint + restaurar */}
              <div className='mt-2 flex items-start justify-between gap-2'>
                <p
                  className={cn(
                    'text-[10px] leading-snug',
                    hasErrors ? 'text-red-400' : 'text-zinc-500'
                  )}
                >
                  {hasErrors
                    ? 'Hay valores fuera de rango. Revísalos antes de generar.'
                    : 'Ajusta los macros si necesitas cambiar los valores calculados.'}
                </p>
                <button
                  type='button'
                  onClick={handleRestore}
                  className='whitespace-nowrap text-[10px] text-zinc-500 transition-colors hover:text-zinc-300 hover:underline focus-visible:outline-none focus-visible:underline'
                >
                  Restaurar calculados
                </button>
              </div>
            </>
          ) : (
            <p className='rounded-lg bg-amber-950/40 px-3 py-2.5 text-[11px] text-amber-400'>
              Completa peso, altura y fecha de nacimiento para ver los objetivos estimados.
            </p>
          )}

          {/* Complejidad de las recetas */}
          <div className='mt-4'>
            <label className='mb-1.5 block text-[11px] font-medium text-zinc-500'>
              Complejidad de las recetas
            </label>
            <div
              role='radiogroup'
              aria-label='Complejidad de las recetas'
              className='flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950/60'
            >
              {[
                { value: 'simple' as const, label: 'Rápidas', hint: '5-10 min' },
                { value: 'medium' as const, label: 'Normales', hint: '15-20 min' },
                { value: 'elaborate' as const, label: 'Elaboradas', hint: null },
              ].map((opt, idx) => {
                const selected = cookingComplexity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type='button'
                    role='radio'
                    aria-checked={selected}
                    onClick={() => setCookingComplexity(opt.value)}
                    className={cn(
                      'flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a7a45] focus-visible:ring-inset',
                      idx > 0 && 'border-l border-zinc-700',
                      selected
                        ? 'bg-[#1a7a45] text-white'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    )}
                  >
                    <span className='block leading-tight'>{opt.label}</span>
                    {opt.hint && (
                      <span
                        className={cn(
                          'block text-[9px] leading-tight',
                          selected ? 'text-white/80' : 'text-zinc-600'
                        )}
                      >
                        {opt.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className='mt-1.5 text-[10px] leading-snug text-zinc-500'>
              Adapta las recetas al estilo de cocina del paciente.
            </p>
          </div>

          {/* Acciones */}
          <div className='mt-4 flex gap-2'>
            <button type='button' onClick={handleCancel} className='flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'>
              Cancelar
            </button>
            <button
              type='button'
              onClick={handleGenerate}
              disabled={hasErrors}
              className={cn(
                'flex-1 rounded-lg bg-[#1a7a45] py-2 text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900',
                hasErrors
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-[#155f38] active:bg-[#0f4a2c]'
              )}
            >
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
        <div className='flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 px-3 py-1.5'>
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
    <>
      <Button onClick={handleStart}>
        + Generar plan
      </Button>
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason='SUBSCRIPTION_REQUIRED'
      />
    </>
  );
}
