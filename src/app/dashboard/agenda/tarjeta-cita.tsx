'use client';

import { useActionState } from 'react';

import { deleteAppointment, sendAppointmentReminder, updateAppointmentStatus } from './actions';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string;
  patient_id: string | null;
  date: string;
  time: string;
  type: 'presencial' | 'online';
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_url: string | null;
  patients: { name: string; email: string | null } | null;
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const ESTADO_ESTILOS: Record<string, string> = {
  scheduled:  'bg-blue-950 text-blue-400',
  completed:  'bg-green-950 text-green-400',
  cancelled:  'bg-zinc-800 text-zinc-500 line-through',
};

const ESTADO_LABELS: Record<string, string> = {
  scheduled:  'Programada',
  completed:  'Completada',
  cancelled:  'Cancelada',
};

const TIPO_ESTILOS: Record<string, string> = {
  presencial: 'bg-amber-950 text-amber-400',
  online:     'bg-violet-950 text-violet-400',
};

// ── Botón "Enviar recordatorio" ───────────────────────────────────────────────

function ReminderButton({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState(sendAppointmentReminder, {});

  if (state.success) {
    return <span className='text-xs text-emerald-500'>Recordatorio enviado</span>;
  }

  return (
    <form action={action}>
      <input type='hidden' name='appointment_id' value={appointmentId} />
      {state.error && (
        <p className='mb-1 text-xs text-red-400'>{state.error}</p>
      )}
      <button
        type='submit'
        disabled={pending}
        title='Enviar recordatorio por email al paciente'
        className='rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition-colors hover:border-violet-400 hover:text-violet-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:text-violet-400'
      >
        {pending ? '…' : '✉'}
      </button>
    </form>
  );
}

// ── Tarjeta de cita individual ────────────────────────────────────────────────

export function TarjetaCita({ cita }: { cita: Appointment }) {
  const hora = cita.time.substring(0, 5); // HH:MM

  const hasReminder =
    cita.type === 'online' &&
    !!cita.meeting_url &&
    !!cita.patients?.email &&
    cita.status === 'scheduled';

  function handleDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirm('¿Eliminar esta cita?')) e.preventDefault();
  }

  return (
    <div className='rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-semibold text-zinc-100'>{hora}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_ESTILOS[cita.type] ?? 'bg-zinc-800 text-zinc-400'}`}
            >
              {cita.type}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_ESTILOS[cita.status] ?? 'bg-zinc-800 text-zinc-400'}`}
            >
              {ESTADO_LABELS[cita.status] ?? cita.status}
            </span>
          </div>
          {cita.patients && (
            <p className='mt-1 text-sm text-zinc-300'>{cita.patients.name}</p>
          )}
          {cita.notes && (
            <p className='mt-1 line-clamp-2 text-xs text-zinc-600'>{cita.notes}</p>
          )}

          {/* Enlace de videollamada */}
          {cita.type === 'online' && cita.meeting_url && (
            <a
              href={cita.meeting_url}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-2 inline-flex items-center gap-1.5 rounded-md border border-violet-800/50 bg-violet-950/40 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:border-violet-600 hover:text-violet-200'
            >
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-3.5 w-3.5' aria-hidden='true'>
                <path d='M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z'/>
              </svg>
              Unirse a la videollamada
            </a>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className='flex flex-shrink-0 flex-col items-end gap-1.5'>
          {/* Marcar como completada */}
          {cita.status === 'scheduled' && (
            <form action={updateAppointmentStatus}>
              <input type='hidden' name='id' value={cita.id} />
              <input type='hidden' name='status' value='completed' />
              <button
                type='submit'
                className='rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition-colors hover:border-green-400 hover:text-green-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-green-700 dark:hover:text-green-400'
                title='Marcar como completada'
              >
                ✓
              </button>
            </form>
          )}

          {/* Enviar recordatorio de videollamada */}
          {hasReminder && <ReminderButton appointmentId={cita.id} />}

          {/* Eliminar */}
          <form action={deleteAppointment}>
            <input type='hidden' name='id' value={cita.id} />
            <button
              type='submit'
              className='rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 transition-colors hover:border-red-400 hover:text-red-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-800 dark:hover:text-red-400'
              title='Eliminar cita'
              onClick={handleDeleteClick}
            >
              ✕
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Grupo de citas por día ────────────────────────────────────────────────────

export function GrupoDia({ fecha, citas }: { fecha: string; citas: Appointment[] }) {
  const d = new Date(`${fecha}T00:00:00`);
  const etiquetaDia = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <p className='mb-2 text-xs font-semibold capitalize text-zinc-500'>{etiquetaDia}</p>
      <div className='flex flex-col gap-2'>
        {citas.map((cita) => (
          <TarjetaCita key={cita.id} cita={cita} />
        ))}
      </div>
    </div>
  );
}
