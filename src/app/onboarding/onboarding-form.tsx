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

  const [collegeNumber, setCollegeNumber] = useState('');
  const [declared, setDeclared] = useState(false);

  // Modal de AI Literacy
  const [modalVisible, setModalVisible] = useState(true);
  const [aiAcknowledged, setAiAcknowledged] = useState(false);

  const canSubmit =
    collegeNumber.trim().length >= 4 && declared && aiAcknowledged && !pending;

  return (
    <>
      {/* ── Modal de AI Literacy ──────────────────────────────────────────── */}
      {modalVisible && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='ai-modal-title'
        >
          <div className='w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl' style={{ maxHeight: 'calc(100dvh - 2rem)' }}>
            {/* Cabecera */}
            <div className='border-b border-zinc-800 px-6 py-5'>
              <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/60 ring-1 ring-amber-800/40'>
                <svg
                  className='h-5 w-5 text-amber-400'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M13 2L4.09 12.96A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.96A1 1 0 0 0 19 9.5H13.5L13 2z' />
                </svg>
              </div>
              <h2
                id='ai-modal-title'
                className='text-lg font-bold text-zinc-100'
              >
                Sobre la inteligencia artificial en Dietly
              </h2>
              <p className='mt-1 text-sm text-zinc-400'>
                Antes de empezar, es importante que conozcas cómo funciona la IA
                y cuáles son sus limitaciones.
              </p>
            </div>

            {/* Contenido */}
            <div className='divide-y divide-zinc-800 px-6'>
              {/* Qué SÍ puede hacer */}
              <div className='py-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-800/50'>
                    ✓
                  </span>
                  <h3 className='text-sm font-semibold text-zinc-200'>
                    Qué puede hacer la IA
                  </h3>
                </div>
                <ul className='space-y-2 text-sm text-zinc-400'>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    Generar un borrador de plan nutricional semanal a partir de los datos del paciente (edad, peso, talla, objetivo, restricciones).
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    Proponer comidas con ingredientes, cantidades aproximadas y preparación básica.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    Calcular macronutrientes de referencia según fórmulas estándar (Harris-Benedict, Mifflin-St Jeor).
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    Generar una lista de la compra organizada por categorías.
                  </li>
                </ul>
              </div>

              {/* Qué NO puede hacer */}
              <div className='py-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-red-950 text-[10px] font-bold text-red-400 ring-1 ring-red-800/50'>
                    ✗
                  </span>
                  <h3 className='text-sm font-semibold text-zinc-200'>
                    Qué NO puede hacer la IA
                  </h3>
                </div>
                <ul className='space-y-2 text-sm text-zinc-400'>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    <strong className='text-zinc-300'>Diagnosticar</strong> enfermedades ni condiciones clínicas.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    <strong className='text-zinc-300'>Sustituir el juicio clínico</strong> del dietista-nutricionista. El borrador siempre requiere tu revisión y aprobación.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    Adaptar el plan a patologías complejas (insuficiencia renal, trastornos alimentarios, oncología) sin supervisión especializada.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    Garantizar la idoneidad del plan para el paciente concreto sin que tú lo revises.
                  </li>
                </ul>
              </div>

              {/* Limitaciones conocidas */}
              <div className='py-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-amber-950 text-[10px] font-bold text-amber-400 ring-1 ring-amber-800/50'>
                    !
                  </span>
                  <h3 className='text-sm font-semibold text-zinc-200'>
                    Limitaciones conocidas
                  </h3>
                </div>
                <ul className='space-y-2 text-sm text-zinc-400'>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    <strong className='text-zinc-300'>Alergias e intolerancias:</strong> la IA intenta respetarlas, pero puede cometer errores. Revisa siempre los ingredientes con atención.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    <strong className='text-zinc-300'>Imprecisión calórica:</strong> los valores nutricionales son estimaciones orientativas basadas en tablas de composición, no mediciones exactas.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    <strong className='text-zinc-300'>Variabilidad del modelo:</strong> dos planes generados con los mismos datos pueden diferir. La IA no memoriza resultados anteriores.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600' />
                    <strong className='text-zinc-300'>Fechas de conocimiento:</strong> el modelo puede no conocer directrices nutricionales publicadas recientemente.
                  </li>
                </ul>
              </div>
            </div>

            {/* Pie del modal — checkbox + botón */}
            <div className='border-t border-zinc-800 px-6 py-5'>
              <label className='flex cursor-pointer items-start gap-3'>
                <input
                  type='checkbox'
                  checked={aiAcknowledged}
                  onChange={(e) => setAiAcknowledged(e.target.checked)}
                  className='mt-0.5 h-4 w-4 flex-shrink-0 rounded border-zinc-600 accent-green-600'
                />
                <span className='text-sm leading-relaxed text-zinc-300'>
                  Entiendo las capacidades y limitaciones de la IA, y asumo la
                  responsabilidad de revisar y aprobar cada borrador antes de
                  entregarlo al paciente.
                </span>
              </label>

              <Button
                type='button'
                disabled={!aiAcknowledged}
                className='mt-4 w-full'
                onClick={() => setModalVisible(false)}
              >
                Continuar con el registro
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulario de onboarding ──────────────────────────────────────── */}
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
            Número de colegiado
          </label>
          <Input
            id='college_number'
            name='college_number'
            placeholder='Ej: AND00123, MAD00456, CV-1234'
            required
            disabled={pending}
            value={collegeNumber}
            onChange={(e) => setCollegeNumber(e.target.value)}
          />
          <p className='text-xs text-muted-foreground'>
            Puedes encontrar tu número en el carné de tu colegio profesional
            autonómico.
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

        {/* Confirmación de AI Literacy (visible solo si el modal está cerrado) */}
        {!modalVisible && (
          <div className='flex items-start gap-3 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2.5'>
            <svg
              className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M13 2L4.09 12.96A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.96A1 1 0 0 0 19 9.5H13.5L13 2z' />
            </svg>
            <p className='text-xs text-amber-400/80'>
              Capacidades y limitaciones de la IA reconocidas.{' '}
              <button
                type='button'
                onClick={() => setModalVisible(true)}
                className='underline underline-offset-2 hover:text-amber-300'
              >
                Ver de nuevo
              </button>
            </p>
          </div>
        )}

        {state?.error && (
          <p className='text-sm text-red-500'>{state.error}</p>
        )}

        <Button type='submit' disabled={!canSubmit}>
          {pending ? 'Guardando...' : 'Empezar a usar Dietly'}
        </Button>
      </form>
    </>
  );
}
