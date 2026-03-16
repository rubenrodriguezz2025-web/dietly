'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { PatientGoal } from '@/types/dietly';
import { GOAL_LABELS } from '@/types/dietly';
import type { CalcTargets, MacroOverrides } from '@/utils/calc-targets';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type State = 'idle' | 'confirm' | 'generating' | 'error';

interface Props {
  patientId: string;
  initialTargets: CalcTargets;
  patientWeight: number;
  patientGoal: PatientGoal;
  hasIntake?: boolean;
  onGoToIntake?: () => void;
}

export function GenerateButton({ patientId, initialTargets, patientWeight, patientGoal, hasIntake, onGoToIntake }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [currentDay, setCurrentDay] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [kcalInput, setKcalInput] = useState('');
  const [proteinKgInput, setProteinKgInput] = useState('');
  const [carbsPctInput, setCarbsPctInput] = useState('');

  function getEffectiveTargets(): CalcTargets & { overrides: MacroOverrides } {
    const overrides: MacroOverrides = {};
    const kcalVal = parseFloat(kcalInput);
    if (!isNaN(kcalVal) && kcalVal > 0) overrides.calories = Math.round(kcalVal);
    const proteinKgVal = parseFloat(proteinKgInput);
    if (!isNaN(proteinKgVal) && proteinKgVal > 0) overrides.protein_per_kg = proteinKgVal;
    const carbsPctVal = parseFloat(carbsPctInput);
    if (!isNaN(carbsPctVal) && carbsPctVal > 0 && carbsPctVal < 100) {
      overrides.carbs_pct = carbsPctVal / 100;
    }
    const calories = overrides.calories ?? initialTargets.calories;
    const protein_per_kg = overrides.protein_per_kg ?? initialTargets.protein_per_kg;
    const protein_g = Math.round(patientWeight * protein_per_kg);
    const remaining = Math.max(calories - protein_g * 4, 0);
    const carbs_pct = overrides.carbs_pct ?? initialTargets.carbs_pct;
    const fat_pct = 1 - carbs_pct;
    const carbs_g = Math.round((remaining * carbs_pct) / 4);
    const fat_g = Math.round((remaining * fat_pct) / 9);
    return { calories, protein_g, carbs_g, fat_g, protein_per_kg, carbs_pct, fat_pct, overrides };
  }

  function handleCancel() {
    setState('idle');
    setAdjustOpen(false);
    setKcalInput('');
    setProteinKgInput('');
    setCarbsPctInput('');
  }

  async function handleGenerate() {
    setState('generating');
    setCurrentDay(0);
    setErrorMsg('');
    const { overrides } = getEffectiveTargets();
    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          macro_overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
        }),
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') setCurrentDay(data.day as number);
            else if (data.type === 'done') { doneReceived = true; router.push(`/dashboard/plans/${data.plan_id}`); }
            else if (data.type === 'error') { setState('error'); setErrorMsg(data.message as string); return; }
          } catch { /* ignore malformed */ }
        }
      }
      // Stream cerrado sin recibir 'done' — el servidor ha tardado demasiado o se ha cortado la conexión
      if (!doneReceived) {
        setState('error');
        setErrorMsg('La generación tardó demasiado o se cortó la conexión. Revisa la sección de planes — puede que se haya guardado. Si no, inténtalo de nuevo.');
      }
    } catch {
      setState('error');
      setErrorMsg('Error de red. Comprueba tu conexión e inténtalo de nuevo.');
    }
  }

  // ── Error ────────────────────────────────────────────────────────────────────
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

  // ── Generando ────────────────────────────────────────────────────────────────
  if (state === 'generating') {
    return (
      <div className='flex flex-col items-end gap-2'>
        <div className='flex items-center gap-2'>
          <div className='h-3 w-3 animate-spin rounded-full border border-zinc-400 border-t-transparent' />
          <span className='text-sm text-zinc-400'>
            {currentDay > 0
              ? currentDay <= 7
                ? `Generando ${DAY_NAMES[currentDay - 1]}... (${currentDay}/7)`
                : 'Generando lista de la compra...'
              : 'Iniciando...'}
          </span>
        </div>
        <div className='flex gap-1'>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${
                i < currentDay ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Confirmación de generación ────────────────────────────────────────────────
  if (state === 'confirm') {
    const preview = getEffectiveTargets();
    const hasOverrides = Object.keys(preview.overrides).length > 0;
    return (
      <div className='w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl'>
        {/* Header */}
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
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        </div>

        <div className='px-4 pt-3 pb-4'>
          {/* Banner estado del cuestionario */}
          {hasIntake ? (
            <div className='mb-3 flex items-center gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='flex-shrink-0 text-emerald-500'
                aria-hidden='true'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
              <p className='text-[11px] leading-snug text-emerald-400'>
                Cuestionario completado — el plan incluirá las preferencias y hábitos del paciente
              </p>
            </div>
          ) : (
            <div className='mb-3 rounded-lg border border-amber-600/40 bg-[#1a0a00] px-3 py-2.5'>
              <div className='flex gap-2'>
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
                  className='mt-px flex-shrink-0 text-amber-500'
                  aria-hidden='true'
                >
                  <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
                  <line x1='12' y1='9' x2='12' y2='13' />
                  <line x1='12' y1='17' x2='12.01' y2='17' />
                </svg>
                <div className='flex flex-col gap-1.5'>
                  <p className='text-[11px] leading-snug text-amber-200/80'>
                    Este paciente no ha completado el cuestionario. El plan se generará solo con los
                    datos básicos — sin horarios, preferencias ni hábitos del paciente.
                  </p>
                  {onGoToIntake && (
                    <button
                      type='button'
                      onClick={() => { handleCancel(); onGoToIntake(); }}
                      className='w-fit text-[11px] text-amber-500 transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:underline'
                    >
                      Enviar cuestionario primero →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Objetivo */}
          <p className='mb-2 text-[11px] font-medium text-zinc-500'>
            {GOAL_LABELS[patientGoal]}
          </p>

          {/* Tabla de macros */}
          <div className='mb-1 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-zinc-800/60 px-3 py-2.5'>
            <span className='text-[12px] text-zinc-500'>Kcal/día</span>
            <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>
              {preview.calories} kcal
            </span>
            <span className='text-[12px] text-zinc-500'>Proteína</span>
            <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>
              {preview.protein_g}g · {preview.protein_per_kg}g/kg
            </span>
            <span className='text-[12px] text-zinc-500'>Carbohidratos</span>
            <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>
              {preview.carbs_g}g · {Math.round(preview.carbs_pct * 100)}%
            </span>
            <span className='text-[12px] text-zinc-500'>Grasa</span>
            <span className='text-right text-[12px] font-semibold tabular-nums text-zinc-200'>
              {preview.fat_g}g · {Math.round(preview.fat_pct * 100)}%
            </span>
          </div>
          {hasOverrides && (
            <p className='mb-2 mt-1 text-[11px] text-amber-500/80'>
              Valores ajustados manualmente
            </p>
          )}

          {/* Ajuste opcional */}
          <div className='mt-2'>
            <button
              type='button'
              onClick={() => setAdjustOpen((v) => !v)}
              className='flex w-full items-center gap-1.5 py-1 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='11'
                height='11'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
                className={`transition-transform duration-200 ${adjustOpen ? 'rotate-180' : ''}`}
              >
                <polyline points='6 9 12 15 18 9' />
              </svg>
              Ajustar macros según criterio clínico
            </button>

            {adjustOpen && (
              <div className='mt-2 flex flex-col gap-2 border-t border-zinc-800 pt-3'>
                <p className='text-[11px] text-zinc-600'>
                  Vacío = valores automáticos.
                </p>
                <MacroField
                  label='Kcal objetivo'
                  placeholder={String(initialTargets.calories)}
                  unit='kcal'
                  value={kcalInput}
                  onChange={setKcalInput}
                />
                <MacroField
                  label='Proteína'
                  placeholder={String(initialTargets.protein_per_kg)}
                  unit='g/kg'
                  value={proteinKgInput}
                  onChange={setProteinKgInput}
                />
                <MacroField
                  label='Carbohidratos'
                  placeholder={String(Math.round(initialTargets.carbs_pct * 100))}
                  unit='%'
                  value={carbsPctInput}
                  onChange={setCarbsPctInput}
                />
                {hasOverrides && (
                  <button
                    type='button'
                    onClick={() => {
                      setKcalInput('');
                      setProteinKgInput('');
                      setCarbsPctInput('');
                    }}
                    className='text-left text-[11px] text-zinc-600 underline transition-colors hover:text-zinc-400 focus-visible:outline-none'
                  >
                    Restablecer automáticos
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className='mt-4 flex gap-2'>
            <button
              type='button'
              onClick={handleCancel}
              className='flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'
            >
              Cancelar
            </button>
            <button
              type='button'
              onClick={handleGenerate}
              className='flex-1 rounded-lg bg-[#1a7a45] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#155f38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900 active:bg-[#0f4a2c]'
            >
              Generar plan
            </button>
          </div>
        </div>
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

function MacroField({
  label,
  placeholder,
  unit,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className='flex items-center gap-2'>
      <span className='w-24 flex-shrink-0 text-[11px] text-zinc-500'>{label}</span>
      <input
        type='number'
        step='any'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-20 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[12px] text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500'
      />
      <span className='text-[11px] text-zinc-600'>{unit}</span>
    </div>
  );
}
