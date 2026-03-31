'use client';

import { useActionState } from 'react';

import { updateProfile } from './actions';

type State = { error?: string; success?: boolean };
const initial: State = {};

export function ProfileForm({
  fullName,
  clinicName,
  collegeNumber,
  whatsappNumber,
}: {
  fullName: string;
  clinicName: string | null;
  collegeNumber: string | null;
  whatsappNumber: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className='flex flex-col gap-4'>
      {!collegeNumber && (
        <div className='flex items-start gap-2.5 rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3'>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400'
            aria-hidden
          >
            <path d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z' />
          </svg>
          <p className='text-sm text-amber-300'>
            Añade tu número de colegiado para completar tu perfil profesional.
          </p>
        </div>
      )}

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

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='whatsapp_number' className='text-sm font-medium text-zinc-300'>
          Número de WhatsApp{' '}
          <span className='font-normal text-zinc-600'>(opcional)</span>
        </label>
        <input
          id='whatsapp_number'
          name='whatsapp_number'
          defaultValue={whatsappNumber ?? ''}
          disabled={pending}
          placeholder='+34 600 000 000'
          className='h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-50'
        />
        <p className='text-xs text-zinc-600'>
          Aparecerá como botón flotante en el plan del paciente para que pueda contactarte.
        </p>
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
