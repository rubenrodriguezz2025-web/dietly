'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { saveProfile } from './actions';

const SPECIALTIES = [
  { value: 'weight_loss', label: 'Pérdida de peso' },
  { value: 'sports', label: 'Deportiva' },
  { value: 'clinical', label: 'Clínica' },
  { value: 'general', label: 'General' },
] as const;

const initialState = { error: undefined as string | undefined };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      return (await saveProfile(formData)) ?? initialState;
    },
    initialState,
  );

  const [declared, setDeclared] = useState(false);
  const [aiAcknowledged, setAiAcknowledged] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);

  const canSubmit = declared && aiAcknowledged && !pending;

  return (
    <form action={action} className='flex flex-col gap-6'>
      {/* Campo oculto para pasar el reconocimiento de IA al servidor */}
      <input
        type='checkbox'
        name='ai_literacy'
        defaultChecked={aiAcknowledged}
        checked={aiAcknowledged}
        readOnly
        className='hidden'
        aria-hidden='true'
      />

      <div className='flex flex-col gap-2'>
        <label htmlFor='full_name' className='text-sm font-medium'>
          Nombre completo
        </label>
        <Input
          id='full_name'
          name='full_name'
          placeholder='Ej: María García López'
          required
          disabled={pending}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='clinic_name' className='text-sm font-medium'>
          Nombre de la clínica{' '}
          <span className='font-normal text-zinc-500'>(opcional)</span>
        </label>
        <Input
          id='clinic_name'
          name='clinic_name'
          placeholder='Ej: Clínica Nutrición Activa o tu nombre profesional'
          disabled={pending}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='specialty' className='text-sm font-medium'>
          Especialidad
        </label>
        <select
          id='specialty'
          name='specialty'
          required
          disabled={pending}
          className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <option value=''>Selecciona tu especialidad</option>
          {SPECIALTIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='college_number' className='text-sm font-medium'>
          Número de colegiado{' '}
          <span className='font-normal text-zinc-500'>(opcional)</span>
        </label>
        <Input
          id='college_number'
          name='college_number'
          placeholder='Lo puedes añadir después en Ajustes'
          disabled={pending}
        />
        <p className='text-xs text-muted-foreground'>
          Necesario antes de aprobar tu primer plan nutricional.
        </p>
      </div>

      {/* Declaración profesional */}
      <label className='flex cursor-pointer items-start gap-3'>
        <input
          type='checkbox'
          name='declaration'
          required
          disabled={pending}
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
          className='mt-0.5 h-4 w-4 flex-shrink-0 rounded border-zinc-600 accent-green-600'
        />
        <span className='text-sm leading-relaxed text-muted-foreground'>
          Declaro ser dietista-nutricionista colegiado en España, habilitado
          legalmente para prescribir planes nutricionales personalizados.
        </span>
      </label>

      {/* ── AI Literacy — nota inline colapsable ─────────────────────────── */}
      <div className='rounded-lg border border-zinc-700/60 bg-gray-50 dark:bg-zinc-900/50'>
        <div className='px-4 py-3'>
          <div className='flex items-start gap-3'>
            <input
              type='checkbox'
              checked={aiAcknowledged}
              onChange={(e) => setAiAcknowledged(e.target.checked)}
              className='mt-0.5 h-4 w-4 flex-shrink-0 rounded border-zinc-600 accent-green-600'
            />
            <div className='flex-1'>
              <p className='text-sm leading-relaxed text-zinc-300'>
                Entiendo que la IA genera <strong className='text-zinc-200'>borradores</strong> que
                requieren mi revisión profesional. Los valores nutricionales son estimaciones
                orientativas.
              </p>
              <button
                type='button'
                onClick={() => setAiExpanded(!aiExpanded)}
                className='mt-1 text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-300'
              >
                {aiExpanded ? 'Ocultar detalles' : 'Ver capacidades y limitaciones'}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido expandible */}
        {aiExpanded && (
          <div className='border-t border-zinc-800 px-4 py-4'>
            <div className='space-y-4 text-sm text-zinc-400'>
              <div>
                <h4 className='mb-1.5 flex items-center gap-1.5 font-medium text-zinc-300'>
                  <span className='flex h-4 w-4 items-center justify-center rounded-full bg-emerald-950 text-[9px] text-emerald-400 ring-1 ring-emerald-800/50'>
                    ✓
                  </span>
                  Qué puede hacer
                </h4>
                <ul className='ml-6 list-disc space-y-1'>
                  <li>Generar borradores de plan semanal a partir de datos del paciente</li>
                  <li>Proponer comidas con ingredientes, cantidades y preparación</li>
                  <li>Calcular macros de referencia (Mifflin-St Jeor)</li>
                  <li>Generar lista de la compra por categorías</li>
                </ul>
              </div>

              <div>
                <h4 className='mb-1.5 flex items-center gap-1.5 font-medium text-zinc-300'>
                  <span className='flex h-4 w-4 items-center justify-center rounded-full bg-red-950 text-[9px] text-red-400 ring-1 ring-red-800/50'>
                    ✗
                  </span>
                  Qué NO puede hacer
                </h4>
                <ul className='ml-6 list-disc space-y-1'>
                  <li>Diagnosticar enfermedades ni condiciones clínicas</li>
                  <li>Sustituir tu juicio clínico — siempre requiere revisión</li>
                  <li>Adaptar a patologías complejas sin supervisión especializada</li>
                </ul>
              </div>

              <div>
                <h4 className='mb-1.5 flex items-center gap-1.5 font-medium text-zinc-300'>
                  <span className='flex h-4 w-4 items-center justify-center rounded-full bg-amber-950 text-[9px] text-amber-400 ring-1 ring-amber-800/50'>
                    !
                  </span>
                  Limitaciones
                </h4>
                <ul className='ml-6 list-disc space-y-1'>
                  <li>Puede cometer errores con alergias — revisa siempre los ingredientes</li>
                  <li>Valores nutricionales son estimaciones, no mediciones exactas</li>
                  <li>Dos planes con los mismos datos pueden diferir entre sí</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {state?.error && (
        <p className='text-sm text-red-500'>{state.error}</p>
      )}

      <Button type='submit' disabled={!canSubmit}>
        {pending ? 'Guardando...' : 'Empezar a usar Dietly'}
      </Button>
    </form>
  );
}
