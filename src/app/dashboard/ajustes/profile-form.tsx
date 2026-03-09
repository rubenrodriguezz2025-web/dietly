'use client';

import { useActionState } from 'react';

import { updateProfile } from './actions';

type State = { error?: string; success?: boolean };
const initial: State = {};

export function ProfileForm({
  fullName,
  clinicName,
  collegeNumber,
}: {
  fullName: string;
  clinicName: string | null;
  collegeNumber: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='full_name' className='text-sm font-medium text-zinc-300'>
          Nombre completo
        </label>
        <input
          id='full_name'
          name='full_name'
          defaultValue={fullName}
          required
          disabled={pending}
          className='h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50'
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='clinic_name' className='text-sm font-medium text-zinc-300'>
          Nombre de la clínica{' '}
          <span className='font-normal text-zinc-600'>(opcional)</span>
        </label>
        <input
          id='clinic_name'
          name='clinic_name'
          defaultValue={clinicName ?? ''}
          disabled={pending}
          placeholder='Ej: Clínica Nutrición Activa'
          className='h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50'
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='college_number' className='text-sm font-medium text-zinc-300'>
          Número de colegiado{' '}
          <span className='font-normal text-zinc-600'>(opcional)</span>
        </label>
        <input
          id='college_number'
          name='college_number'
          defaultValue={collegeNumber ?? ''}
          disabled={pending}
          placeholder='Ej: CV-1234'
          className='h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50'
        />
        <p className='text-xs text-zinc-600'>Aparecerá en el pie de cada página del PDF.</p>
      </div>

      {state.error && <p className='text-sm text-red-400'>{state.error}</p>}
      {state.success && <p className='text-sm text-green-400'>Perfil actualizado.</p>}

      <button
        type='submit'
        disabled={pending}
        className='self-start rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 disabled:opacity-40'
      >
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
