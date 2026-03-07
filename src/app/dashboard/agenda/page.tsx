import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { deleteAppointment, updateAppointmentStatus } from './actions';
import { NewAppointmentForm } from './new-appointment-form';

// ── Tipos locales ─────────────────────────────────────────────────────────────

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

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Parsear mes (YYYY-MM) o usar el mes actual
  const hoy = new Date();
  let año = hoy.getFullYear();
  let mes_num = hoy.getMonth() + 1;

  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const partes = mes.split('-');
    año = parseInt(partes[0], 10);
    mes_num = parseInt(partes[1], 10);
  }

  const primerDia = new Date(año, mes_num - 1, 1);
  const ultimoDia = new Date(año, mes_num, 0);
  const primerDiaStr = primerDia.toISOString().split('T')[0];
  const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];

  // Mes anterior / siguiente para navegación
  const mesPrev = new Date(año, mes_num - 2, 1);
  const mesSig = new Date(año, mes_num, 1);
  const mesPrevStr = `${mesPrev.getFullYear()}-${String(mesPrev.getMonth() + 1).padStart(2, '0')}`;
  const mesSigStr = `${mesSig.getFullYear()}-${String(mesSig.getMonth() + 1).padStart(2, '0')}`;

  const mesLabel = primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Citas del mes
  const { data: citas } = (await (supabase as any)
    .from('appointments')
    .select('*, patients(name)')
    .eq('nutritionist_id', user.id)
    .gte('date', primerDiaStr)
    .lte('date', ultimoDiaStr)
    .order('date', { ascending: true })
    .order('time', { ascending: true })) as { data: Appointment[] | null };

  // Pacientes para el formulario nueva cita
  const { data: pacientes } = await (supabase as any)
    .from('patients')
    .select('id, name')
    .order('name', { ascending: true });

  // Agrupar citas por día
  const citasPorDia = new Map<string, Appointment[]>();
  for (const cita of citas ?? []) {
    const lista = citasPorDia.get(cita.date) ?? [];
    lista.push(cita);
    citasPorDia.set(cita.date, lista);
  }

  const diasConCitas = Array.from(citasPorDia.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className='flex flex-col gap-8'>
      {/* Cabecera con navegación de mes */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold capitalize text-zinc-100'>{mesLabel}</h1>
          <p className='mt-0.5 text-sm text-zinc-500'>
            {citas?.length ?? 0} cita{citas?.length !== 1 ? 's' : ''} este mes
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href={`/dashboard/agenda?mes=${mesPrevStr}`}
            className='rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
          >
            ← Anterior
          </Link>
          <Link
            href={`/dashboard/agenda?mes=${mesSigStr}`}
            className='rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Lista de citas del mes */}
        <div className='flex flex-col gap-4 lg:col-span-2'>
          {diasConCitas.length === 0 ? (
            <div className='flex items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center'>
              <p className='text-zinc-500'>Sin citas este mes.</p>
            </div>
          ) : (
            diasConCitas.map(([fecha, citasDelDia]) => (
              <GrupoDia key={fecha} fecha={fecha} citas={citasDelDia} />
            ))
          )}
        </div>

        {/* Formulario nueva cita */}
        <div className='flex flex-col gap-4'>
          <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
            <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              Nueva cita
            </h2>
            <NewAppointmentForm pacientes={pacientes ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Grupo de citas por día ────────────────────────────────────────────────────

function GrupoDia({ fecha, citas }: { fecha: string; citas: Appointment[] }) {
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

// ── Tarjeta de cita individual ────────────────────────────────────────────────

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

function TarjetaCita({ cita }: { cita: Appointment }) {
  const hora = cita.time.substring(0, 5); // HH:MM

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
              onClick={(e) => {
                if (!confirm('¿Eliminar esta cita?')) e.preventDefault();
              }}
            >
              ✕
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
