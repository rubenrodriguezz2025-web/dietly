'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { createAppointment } from './actions';

type Paciente = { id: string; name: string };

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
  const [patientId, setPatientId] = useState<string>('__none__');
  const [selectedTime, setSelectedTime] = useState<string>('');

  return (
    <form action={action} className='flex flex-col gap-4'>
      {/* Campos ocultos para los valores de los Selects (compatibilidad con Server Actions) */}
      <input type='hidden' name='patient_id' value={patientId === '__none__' ? '' : patientId} />
      <input type='hidden' name='type' value={tipo} />
      <input type='hidden' name='time' value={selectedTime} />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {/* Paciente */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>Paciente</label>
          <Select value={patientId} onValueChange={setPatientId} disabled={pending}>
            <SelectTrigger>
              <SelectValue placeholder='Sin paciente asignado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='__none__'>Sin paciente asignado</SelectItem>
              {pacientes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Tipo <span className='text-red-500'>*</span>
          </label>
          <Select value={tipo} onValueChange={setTipo} disabled={pending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='presencial'>Presencial</SelectItem>
              <SelectItem value='online'>Online (videollamada)</SelectItem>
            </SelectContent>
          </Select>
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
            className={inputClass}
          />
        </div>

        {/* Hora */}
        <div className='flex flex-col gap-1.5'>
          <label className='text-sm font-medium text-zinc-300'>
            Hora <span className='text-red-500'>*</span>
          </label>
          <Select value={selectedTime} onValueChange={setSelectedTime} disabled={pending}>
            <SelectTrigger>
              <SelectValue placeholder='Selecciona hora' />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {state?.success && state.conflictMessage && (
        <p className='rounded-md bg-amber-950 px-3 py-2 text-sm text-amber-400'>
          {state.conflictMessage}
        </p>
      )}

      {state?.success && !state.conflictMessage && (
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
