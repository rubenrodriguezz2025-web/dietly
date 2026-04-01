import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { CalendarioSemanal, NavSemana } from './calendario-semanal';
import { NewAppointmentForm } from './new-appointment-form';
import { GrupoDia } from './tarjeta-cita';

// ── Tipos locales ─────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; vista?: string; semana?: string }>;
}) {
  const { mes, vista, semana } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hoy = new Date();
  const esSemana = vista === 'semana';

  // Pacientes para el formulario (ambas vistas)
  const { data: pacientes } = await (supabase as any)
    .from('patients')
    .select('id, name')
    .eq('nutritionist_id', user.id)
    .order('name', { ascending: true });

  // ── Vista semanal ─────────────────────────────────────────────────────────

  if (esSemana) {
    let monday: Date;
    if (semana && /^\d{4}-\d{2}-\d{2}$/.test(semana)) {
      const [y, m, d] = semana.split('-').map(Number);
      monday = new Date(y, m - 1, d);
      monday.setHours(0, 0, 0, 0);
    } else {
      monday = getMondayOf(hoy);
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const semanaInicioStr = toDateStr(monday);
    const semanaFinStr = toDateStr(sunday);

    const { data: citasSemana } = (await (supabase as any)
      .from('appointments')
      .select('*, patients(name, email)')
      .eq('nutritionist_id', user.id)
      .gte('date', semanaInicioStr)
      .lte('date', semanaFinStr)
      .order('date', { ascending: true })
      .order('time', { ascending: true })) as { data: Appointment[] | null };

    const semanaLabel = monday.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return (
      <div className='flex flex-col gap-6'>
        {/* Cabecera */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold capitalize text-zinc-100'>Agenda</h1>
            <p className='mt-0.5 text-sm capitalize text-zinc-500'>{semanaLabel}</p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {/* Toggle vista */}
            <div className='flex rounded-lg border border-zinc-800 p-0.5'>
              <Link
                href='/dashboard/agenda'
                className='rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300'
              >
                Lista
              </Link>
              <span className='rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200'>
                Semana
              </span>
            </div>
            <NavSemana semanaInicioStr={semanaInicioStr} />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Calendario semanal */}
          <div className='lg:col-span-2'>
            <CalendarioSemanal citas={citasSemana ?? []} semanaInicioStr={semanaInicioStr} />
          </div>

          {/* Formulario nueva cita */}
          <div className='flex flex-col gap-4'>
            <div className='rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 p-5'>
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

  // ── Vista de lista mensual ─────────────────────────────────────────────────

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

  const mesPrev = new Date(año, mes_num - 2, 1);
  const mesSig = new Date(año, mes_num, 1);
  const mesPrevStr = `${mesPrev.getFullYear()}-${String(mesPrev.getMonth() + 1).padStart(2, '0')}`;
  const mesSigStr = `${mesSig.getFullYear()}-${String(mesSig.getMonth() + 1).padStart(2, '0')}`;

  const mesLabel = primerDia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const { data: citas } = (await (supabase as any)
    .from('appointments')
    .select('*, patients(name, email)')
    .eq('nutritionist_id', user.id)
    .gte('date', primerDiaStr)
    .lte('date', ultimoDiaStr)
    .order('date', { ascending: true })
    .order('time', { ascending: true })) as { data: Appointment[] | null };

  const citasPorDia = new Map<string, Appointment[]>();
  for (const cita of citas ?? []) {
    const lista = citasPorDia.get(cita.date) ?? [];
    lista.push(cita);
    citasPorDia.set(cita.date, lista);
  }

  const diasConCitas = Array.from(citasPorDia.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const esMesActual = !mes || mes === mesActual;

  // Semana actual para el enlace de toggle a vista semanal
  const semanaActualStr = toDateStr(getMondayOf(hoy));

  return (
    <div className='flex flex-col gap-8'>
      {/* Cabecera con navegación de mes */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold capitalize text-zinc-100'>{mesLabel}</h1>
          <p className='mt-0.5 text-sm text-zinc-500'>
            {citas?.length ?? 0} cita{citas?.length !== 1 ? 's' : ''} este mes
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {/* Toggle vista */}
          <div className='flex rounded-lg border border-zinc-800 p-0.5'>
            <span className='rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200'>
              Lista
            </span>
            <Link
              href={`/dashboard/agenda?vista=semana&semana=${semanaActualStr}`}
              className='rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300'
            >
              Semana
            </Link>
          </div>
          {/* Botón "Hoy" solo cuando no estamos en el mes actual */}
          {!esMesActual && (
            <Link
              href='/dashboard/agenda'
              className='rounded-lg border border-[#1a7a45]/40 bg-[#1a7a45]/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-[#1a7a45]/20'
            >
              Hoy
            </Link>
          )}
          <Link
            href={`/dashboard/agenda?mes=${mesPrevStr}`}
            aria-label='Mes anterior'
            className='flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <polyline points='15 18 9 12 15 6' />
            </svg>
            <span className='hidden sm:inline'>Anterior</span>
          </Link>
          <Link
            href={`/dashboard/agenda?mes=${mesSigStr}`}
            aria-label='Mes siguiente'
            className='flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
          >
            <span className='hidden sm:inline'>Siguiente</span>
            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <polyline points='9 18 15 12 9 6' />
            </svg>
          </Link>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Lista de citas del mes */}
        <div className='flex flex-col gap-4 lg:col-span-2'>
          {diasConCitas.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 py-16 text-center'>
              <div className='flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='text-zinc-600'
                  aria-hidden='true'
                >
                  <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
                  <line x1='16' y1='2' x2='16' y2='6' />
                  <line x1='8' y1='2' x2='8' y2='6' />
                  <line x1='3' y1='10' x2='21' y2='10' />
                </svg>
              </div>
              <div>
                <p className='font-medium text-zinc-400'>Sin citas en {mesLabel}</p>
                <p className='mt-0.5 text-sm text-zinc-600'>
                  Añade una nueva cita con el formulario.
                </p>
              </div>
            </div>
          ) : (
            diasConCitas.map(([fecha, citasDelDia]) => (
              <GrupoDia key={fecha} fecha={fecha} citas={citasDelDia} />
            ))
          )}
        </div>

        {/* Formulario nueva cita */}
        <div className='flex flex-col gap-4'>
          <div className='rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 p-5'>
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

