'use client';

import { useActionState, useCallback, useRef, useState } from 'react';

import { ConsentForm } from '@/components/patients/ConsentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { createPatient } from './actions';

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function validateField(name: string, value: string): string {
  if (name === 'name') {
    if (!value.trim()) return 'El nombre es obligatorio';
  }
  if (name === 'email' && value.trim()) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    if (!ok) return 'Introduce un email válido';
  }
  if (name === 'weight_kg' && value.trim()) {
    const n = parseFloat(value);
    if (isNaN(n) || n < 20 || n > 300) return 'El peso debe estar entre 20 y 300 kg';
  }
  if (name === 'height_cm' && value.trim()) {
    const n = parseFloat(value);
    if (isNaN(n) || n < 100 || n > 250) return 'La altura debe estar entre 100 y 250 cm';
  }
  return '';
}

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
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='flex flex-col gap-1.5'>
        <span className='text-sm font-medium text-zinc-300'>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
          {optional && <span className='ml-1 font-normal text-zinc-600'>(opcional)</span>}
        </span>
        {children}
      </label>
      {error && (
        <p className='text-xs text-red-400'>{error}</p>
      )}
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

function ChipInput({
  name,
  chips,
  onAdd,
  onRemove,
  placeholder,
  disabled,
}: {
  name: string;
  chips: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = (e.target as HTMLInputElement).value.trim();
        if (val) {
          onAdd(val);
          (e.target as HTMLInputElement).value = '';
        }
      }
      if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && chips.length > 0) {
        onRemove(chips.length - 1);
      }
    },
    [onAdd, onRemove, chips.length]
  );

  return (
    <div>
      <input type='hidden' name={name} value={chips.join('|||')} />
      <div
        className='flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-md border border-zinc-800 bg-black px-2.5 py-1.5 transition-colors focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500'
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((chip, i) => (
          <span
            key={i}
            className='inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700'
          >
            {chip}
            <button
              type='button'
              onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              disabled={disabled}
              className='ml-0.5 rounded-full p-0.5 text-zinc-500 transition-colors hover:bg-zinc-600 hover:text-zinc-300'
              aria-label={`Eliminar ${chip}`}
            >
              <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round'>
                <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type='text'
          disabled={disabled}
          placeholder={chips.length === 0 ? placeholder : ''}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val) { onAdd(val); e.target.value = ''; }
          }}
          className='min-w-[120px] flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none'
        />
      </div>
      <p className='mt-1 text-xs text-zinc-600'>Escribe y pulsa Enter para añadir</p>
    </div>
  );
}

export function NewPatientForm() {
  const [state, action, pending] = useActionState(createPatient, {});
  const [dob, setDob] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClinicalNotes, setShowClinicalNotes] = useState(false);
  const [allergyChips, setAllergyChips] = useState<string[]>([]);
  const [intoleranceChips, setIntoleranceChips] = useState<string[]>([]);
  const isMinor = dob ? calcAge(dob) < 18 : false;

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg }));
  }

  const inputClass = (fieldName: string) =>
    errors[fieldName]
      ? 'border-red-500 focus-visible:ring-red-500'
      : '';

  return (
    <form action={action} className='flex flex-col gap-8'>
      {/* Datos personales */}
      <section className='flex flex-col gap-4'>
        <SectionTitle>Datos personales</SectionTitle>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field label='Nombre completo' required error={errors['name']}>
            <Input
              name='name'
              placeholder='Ej: Ana Martínez García'
              required
              disabled={pending}
              onBlur={handleBlur}
              className={inputClass('name')}
            />
          </Field>
          <Field label='Email' optional error={errors['email']}>
            <Input
              name='email'
              type='email'
              placeholder='ana@ejemplo.com'
              disabled={pending}
              onBlur={handleBlur}
              className={inputClass('email')}
            />
          </Field>
          <Field label='Fecha de nacimiento'>
            <Input
              name='date_of_birth'
              type='date'
              disabled={pending}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
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
          <Field label='Peso (kg)' error={errors['weight_kg']}>
            <Input
              name='weight_kg'
              type='number'
              step='0.1'
              min='20'
              max='300'
              placeholder='Ej: 72.5'
              disabled={pending}
              onBlur={handleBlur}
              className={inputClass('weight_kg')}
            />
          </Field>
          <Field label='Altura (cm)' error={errors['height_cm']}>
            <Input
              name='height_cm'
              type='number'
              step='0.1'
              min='100'
              max='250'
              placeholder='Ej: 168'
              disabled={pending}
              onBlur={handleBlur}
              className={inputClass('height_cm')}
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
                className='h-4 w-4 rounded border-zinc-700 bg-gray-100 dark:bg-zinc-900 accent-zinc-400'
              />
              {option}
            </label>
          ))}
        </div>
      </section>

      {/* Alergias e intolerancias — visibles siempre */}
      <section className='flex flex-col gap-4'>
        <SectionTitle>Alergias e intolerancias</SectionTitle>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field label='Alergias alimentarias'>
            <ChipInput
              name='allergies'
              chips={allergyChips}
              onAdd={(v) => setAllergyChips((prev) => [...prev, v])}
              onRemove={(i) => setAllergyChips((prev) => prev.filter((_, idx) => idx !== i))}
              placeholder='Ej: frutos secos, marisco, huevo...'
              disabled={pending}
            />
          </Field>
          <Field label='Intolerancias'>
            <ChipInput
              name='intolerances'
              chips={intoleranceChips}
              onAdd={(v) => setIntoleranceChips((prev) => [...prev, v])}
              onRemove={(i) => setIntoleranceChips((prev) => prev.filter((_, idx) => idx !== i))}
              placeholder='Ej: lactosa, fructosa, gluten...'
              disabled={pending}
            />
          </Field>
        </div>
      </section>

      {/* Notas clínicas — colapsable */}
      <section className='flex flex-col gap-4'>
        <button
          type='button'
          onClick={() => setShowClinicalNotes((v) => !v)}
          className='flex items-center gap-2 border-b border-zinc-800 pb-2'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className={`text-zinc-500 transition-transform ${showClinicalNotes ? 'rotate-90' : ''}`}
          >
            <polyline points='9 18 15 12 9 6' />
          </svg>
          <span className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Notas clínicas
          </span>
          <span className='text-xs text-zinc-600'>(opcional)</span>
        </button>
        {showClinicalNotes && (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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
        )}
      </section>

      {/* Consentimiento informado — obligatorio para habilitar la generación de planes con IA */}
      <ConsentForm disabled={pending} />

      {isMinor && (
        <div className='rounded-lg border border-amber-700/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300'>
          <span className='font-semibold'>Paciente menor de edad.</span>{' '}
          Para generar planes nutricionales para menores se requiere consentimiento parental por
          escrito. Contacta con{' '}
          <a href='mailto:hola@dietly.es' className='underline hover:text-amber-200'>
            hola@dietly.es
          </a>{' '}
          para más información.
        </div>
      )}

      {state?.error && (
        <p className='rounded-md bg-red-950 px-4 py-3 text-sm text-red-400'>{state.error}</p>
      )}

      <div className='flex justify-end'>
        <Button type='submit' disabled={pending || isMinor}>
          {pending ? 'Guardando...' : 'Crear paciente'}
        </Button>
      </div>
    </form>
  );
}
