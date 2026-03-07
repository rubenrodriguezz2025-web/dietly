'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { createAppointment } from './actions';

type Paciente = { id: string; name: string };

const selectClass =
  'h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50';

const textareaClass =
  'w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50 resize-none';

export function NewAppointmentForm({ pacientes }: { pacientes: Paciente[] }) {
  const [state, action, pending] = useActionState(createAppointment, {});

  return (
    <form action={action} className='flex flex-col gap-4'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {/* Paciente */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>Paciente</label>
          <select name='patient_id' className={selectClass} disabled={pending}>
            <option value=''>Sin paciente asignado</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Tipo <span className='text-red-500'>*</span>
          </label>
          <select name='type' className={selectClass} disabled={pending} defaultValue='presencial'>
            <option value='presencial'>Presencial</option>
            <option value='online'>Online (videollamada)</option>
          </select>
        </div>

        {/* Fecha */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Fecha <span className='text-red-500'>*</span>
          </label>
          <Input name='date' type='date' required disabled={pending} />
        </div>

        {/* Hora */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Hora <span className='text-red-500'>*</span>
          </label>
          <Input name='time' type='time' required disabled={pending} />
        </div>
      </div>

      {/* Notas */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-zinc-300'>Notas</label>
        <textarea
          name='notes'
          rows={2}
          placeholder='Motivo de la consulta, indicaciones previas...'
          disabled={pending}
          className={textareaClass}
        />
      </div>

      {state?.error && (
        <p className='rounded-md bg-red-950 px-3 py-2 text-sm text-red-400'>{state.error}</p>
      )}

      {!state?.error && state && Object.keys(state).length === 0 && (
        <p className='text-sm text-emerald-500'>Cita guardada correctamente.</p>
      )}

      <div className='flex justify-end'>
        <Button type='submit' disabled={pending}>
          {pending ? 'Guardando...' : 'Crear cita'}
        </Button>
      </div>
    </form>
  );
}
