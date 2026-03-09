'use client';

import { deleteAppointment, updateAppointmentStatus } from './actions';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string;
  patient_id: string | null;
  date: string;
  time: string;
  type: 'presencial' | 'online';
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  patients: { name: string } | null;
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

// ── Tarjeta de cita individual ────────────────────────────────────────────────

export function TarjetaCita({ cita }: { cita: Appointment }) {
  const hora = cita.time.substring(0, 5); // HH:MM

  function handleDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirm('¿Eliminar esta cita?')) e.preventDefault();
  }

  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-sm font-semibold text-zinc-100'>
              {hora}
            </span>
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
            <p className='mt-1 text-xs text-zinc-600 line-clamp-2'>{cita.notes}</p>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className='flex flex-shrink-0 gap-1.5'>
          {cita.status === 'scheduled' && (
            <form action={updateAppointmentStatus}>
              <input type='hidden' name='id' value={cita.id} />
              <input type='hidden' name='status' value='completed' />
              <button
                type='submit'
                className='rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-green-700 hover:text-green-400'
                title='Marcar como completada'
              >
                ✓
              </button>
            </form>
          )}
          <form action={deleteAppointment}>
            <input type='hidden' name='id' value={cita.id} />
            <button
              type='submit'
              className='rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-colors hover:border-red-800 hover:text-red-400'
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
