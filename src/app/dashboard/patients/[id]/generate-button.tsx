'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import type { CalcTargets, MacroOverrides } from '@/utils/calc-targets';
import type { PatientGoal } from '@/types/dietly';
import { GOAL_LABELS } from '@/types/dietly';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type State = 'idle' | 'generating' | 'error';

interface Props {
  patientId: string;
  initialTargets: CalcTargets;
  patientWeight: number;
  patientGoal: PatientGoal;
}

export function GenerateButton({ patientId, initialTargets, patientWeight, patientGoal }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>('idle');
  const [currentDay, setCurrentDay] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Overrides editables por el nutricionista
  const [kcalInput, setKcalInput] = useState('');
  const [proteinKgInput, setProteinKgInput] = useState('');
  const [carbsPctInput, setCarbsPctInput] = useState('');

  // Calcula targets en tiempo real según los campos editados
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
    const protein_kcal = protein_g * 4;
    const remaining = Math.max(calories - protein_kcal, 0);
    const carbs_pct = overrides.carbs_pct ?? initialTargets.carbs_pct;
    const fat_pct = 1 - carbs_pct;
    const carbs_g = Math.round((remaining * carbs_pct) / 4);
    const fat_g = Math.round((remaining * fat_pct) / 9);

    return { calories, protein_g, carbs_g, fat_g, protein_per_kg, carbs_pct, fat_pct, overrides };
  }

  const preview = getEffectiveTargets();
  const hasOverrides = Object.keys(preview.overrides).length > 0;

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
        let detail = `HTTP ${res.status}`;
        try {
          const body = await res.clone().json();
          detail = body.detail ?? body.error ?? detail;
          console.error('[GenerateButton] HTTP error body:', body);
        } catch {
          console.error('[GenerateButton] HTTP error status:', res.status);
        }
        setState('error');
        setErrorMsg(`Error (${detail}). Inténtalo de nuevo.`);
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
    } catch (err) {
      console.error('[GenerateButton] fetch error:', err);
      setState('error');
      setErrorMsg('Error de red. Comprueba tu conexión e inténtalo de nuevo.');
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
              className={`h-1.5 w-5 rounded-full transition-colors ${
                i < currentDay ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-end gap-3'>
      {/* Sección expandible de ajuste de macros */}
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors'
      >
        <span>Ajuste de macros (opcional)</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points='6 9 12 15 18 9' />
        </svg>
      </button>

      {expanded && (
        <div className='w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm'>
          {/* Preview automático */}
          <div className='mb-3'>
            <p className='mb-1.5 text-xs font-medium text-zinc-500'>
              Calculado automáticamente para {GOAL_LABELS[patientGoal]}
            </p>
            <div className='grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs'>
              <span className='text-zinc-500'>Kcal/día</span>
              <span className='text-right font-medium text-zinc-200'>{preview.calories} kcal</span>
              <span className='text-zinc-500'>Proteína</span>
              <span className='text-right font-medium text-zinc-200'>
                {preview.protein_g}g · {preview.protein_per_kg}g/kg
              </span>
              <span className='text-zinc-500'>Carbohidratos</span>
              <span className='text-right font-medium text-zinc-200'>
                {preview.carbs_g}g · {Math.round(preview.carbs_pct * 100)}%
              </span>
              <span className='text-zinc-500'>Grasa</span>
              <span className='text-right font-medium text-zinc-200'>
                {preview.fat_g}g · {Math.round(preview.fat_pct * 100)}%
              </span>
            </div>
            {hasOverrides && (
              <p className='mt-1.5 text-xs text-amber-500'>Valores modificados por el nutricionista</p>
            )}
          </div>

          {/* Campos editables */}
          <p className='mb-2 text-xs text-zinc-600'>
            Dietly calcula estos valores automáticamente. Puedes ajustarlos según tu criterio clínico.
          </p>
          <div className='flex flex-col gap-2'>
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
              unit='% (resto tras proteína)'
              value={carbsPctInput}
              onChange={setCarbsPctInput}
            />
          </div>
          {hasOverrides && (
            <button
              type='button'
              onClick={() => {
                setKcalInput('');
                setProteinKgInput('');
                setCarbsPctInput('');
              }}
              className='mt-2 text-xs text-zinc-600 hover:text-zinc-400 underline'
            >
              Restablecer valores automáticos
            </button>
          )}
        </div>
      )}

      <Button onClick={handleGenerate}>+ Generar plan</Button>
    </div>
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
      <span className='w-28 flex-shrink-0 text-xs text-zinc-500'>{label}</span>
      <input
        type='number'
        step='any'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-20 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none'
      />
      <span className='text-xs text-zinc-600'>{unit}</span>
    </div>
  );
}
