'use client';

import { useActionState,useState } from 'react';

import { Button } from '@/components/ui/button';

import { createAppointment } from './actions';

type Paciente = { id: string; name: string };

const selectClass =
  'h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50';

const inputClass =
  'h-10 w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50';

const textareaClass =
  'w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50 resize-none';

// Slots de 07:00 a 21:00 cada 30 minutos
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

export function NewAppointmentForm({ pacientes }: { pacientes: Paciente[] }) {
  const [state, action, pending] = useActionState(createAppointment, {});
  const [tipo, setTipo] = useState<string>('presencial');

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
          <select
            name='type'
            className={selectClass}
            disabled={pending}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value='presencial'>Presencial</option>
            <option value='online'>Online (videollamada)</option>
          </select>
        </div>

        {/* Fecha */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Fecha <span className='text-red-500'>*</span>
          </label>
          <input
            name='date'
            type='date'
            required
            disabled={pending}
            className={selectClass}
          />
        </div>

        {/* Hora */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Hora <span className='text-red-500'>*</span>
          </label>
          <select name='time' required disabled={pending} defaultValue='' className={selectClass}>
            <option value='' disabled>Selecciona hora</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>

      {/* URL de videollamada — solo para citas online */}
      {tipo === 'online' && (
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Enlace de videollamada
            <span className='ml-1 font-normal text-zinc-600'>(Google Meet, Zoom…)</span>
          </label>
          <input
            name='meeting_url'
            type='url'
            placeholder='https://meet.google.com/xxx-xxxx-xxx'
            disabled={pending}
            className={inputClass}
          />
        </div>
      )}

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

      {state?.success && (
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
