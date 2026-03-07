'use client';

import { useActionState } from 'react';

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
    initialState
  );

  return (
    <form action={action} className='flex flex-col gap-6'>
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

      {state?.error && (
        <p className='text-sm text-red-500'>{state.error}</p>
      )}

      <Button type='submit' disabled={pending}>
        {pending ? 'Guardando...' : 'Empezar a usar Dietly'}
      </Button>
    </form>
  );
}
