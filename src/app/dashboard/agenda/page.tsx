import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

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

// ── Página ─────────────────────────────────────────────────────────────────────

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
    .select('*, patients(name, email)')
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

