'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { createPatient } from './actions';

const DIETARY_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Sin gluten (celiaquía)',
  'Sin lactosa',
  'Sin frutos secos',
  'Sin mariscos',
  'Halal',
  'Kosher',
];

const selectClass =
  'h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50';

const textareaClass =
  'w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50 resize-none';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-zinc-300'>
        {label}
        {required && <span className='ml-1 text-red-500'>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className='border-b border-zinc-800 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
      {children}
    </h2>
  );
}

export function NewPatientForm() {
  const [state, action, pending] = useActionState(createPatient, {});

  return (
    <form action={action} className='flex flex-col gap-8'>
      {/* Datos personales */}
      <section className='flex flex-col gap-4'>
        <SectionTitle>Datos personales</SectionTitle>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field label='Nombre completo' required>
            <Input name='name' placeholder='Ej: Ana Martínez García' required disabled={pending} />
          </Field>
          <Field label='Email'>
            <Input name='email' type='email' placeholder='ana@ejemplo.com' disabled={pending} />
          </Field>
          <Field label='Fecha de nacimiento'>
            <Input name='date_of_birth' type='date' disabled={pending} />
          </Field>
          <Field label='Sexo'>
            <select name='sex' className={selectClass} disabled={pending}>
              <option value=''>Seleccionar</option>
              <option value='female'>Mujer</option>
              <option value='male'>Hombre</option>
              <option value='other'>Otro</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Datos antropométricos */}
      <section className='flex flex-col gap-4'>
        <SectionTitle>Datos antropométricos</SectionTitle>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field label='Peso (kg)'>
            <Input
              name='weight_kg'
              type='number'
              step='0.1'
              min='20'
              max='300'
              placeholder='Ej: 72.5'
              disabled={pending}
            />
          </Field>
          <Field label='Altura (cm)'>
            <Input
              name='height_cm'
              type='number'
              step='0.1'
              min='100'
              max='250'
              placeholder='Ej: 168'
              disabled={pending}
            />
          </Field>
          <Field label='Nivel de actividad'>
            <select name='activity_level' className={selectClass} disabled={pending}>
              <option value=''>Seleccionar</option>
              <option value='sedentary'>Sedentario (sin ejercicio)</option>
              <option value='lightly_active'>Ligero (1-3 días/semana)</option>
              <option value='moderately_active'>Moderado (3-5 días/semana)</option>
              <option value='very_active'>Activo (6-7 días/semana)</option>
              <option value='extra_active'>Muy activo (2x/día o trabajo físico)</option>
            </select>
          </Field>
          <Field label='Objetivo principal'>
            <select name='goal' className={selectClass} disabled={pending}>
              <option value=''>Seleccionar</option>
              <option value='weight_loss'>Pérdida de peso</option>
              <option value='weight_gain'>Ganancia de peso</option>
              <option value='maintenance'>Mantenimiento</option>
              <option value='muscle_gain'>Ganancia muscular</option>
              <option value='health'>Mejorar salud general</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Restricciones dietéticas */}
      <section className='flex flex-col gap-4'>
        <SectionTitle>Restricciones dietéticas</SectionTitle>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {DIETARY_OPTIONS.map((option) => (
            <label key={option} className='flex cursor-pointer items-center gap-2 text-sm text-zinc-400'>
              <input
                type='checkbox'
                name='dietary_restrictions'
                value={option}
                disabled={pending}
                className='h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-zinc-400'
              />
              {option}
            </label>
          ))}
        </div>
      </section>

      {/* Notas clínicas */}
      <section className='flex flex-col gap-4'>
        <SectionTitle>Notas clínicas</SectionTitle>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field label='Alergias'>
            <textarea
              name='allergies'
              rows={3}
              placeholder='Ej: alergia a la penicilina, alergia al látex...'
              disabled={pending}
              className={textareaClass}
            />
          </Field>
          <Field label='Intolerancias'>
            <textarea
              name='intolerances'
              rows={3}
              placeholder='Ej: intolerancia a la fructosa...'
              disabled={pending}
              className={textareaClass}
            />
          </Field>
          <Field label='Preferencias alimentarias'>
            <textarea
              name='preferences'
              rows={3}
              placeholder='Ej: no le gusta el pescado azul, prefiere cocina mediterránea...'
              disabled={pending}
              className={textareaClass}
            />
          </Field>
          <Field label='Notas médicas'>
            <textarea
              name='medical_notes'
              rows={3}
              placeholder='Ej: diabetes tipo 2 controlada, hipertensión...'
              disabled={pending}
              className={textareaClass}
            />
          </Field>
        </div>
      </section>

      {state?.error && (
        <p className='rounded-md bg-red-950 px-4 py-3 text-sm text-red-400'>{state.error}</p>
      )}

      <div className='flex justify-end'>
        <Button type='submit' disabled={pending}>
          {pending ? 'Guardando...' : 'Crear paciente'}
        </Button>
      </div>
    </form>
  );
}
