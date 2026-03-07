import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { GOAL_LABELS,NutritionPlan, Patient } from '@/types/dietly';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verificar onboarding
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  // Pacientes activos
  const { data: patients } = (await (supabase as any)
    .from('patients')
    .select('id, name, email, goal, created_at')
    .order('created_at', { ascending: false })) as { data: Patient[] | null };

  // Planes este mes
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: plansThisMonth } = await (supabase as any)
    .from('nutrition_plans')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString()) as { count: number | null };

  // Planes pendientes de revisar
  const { count: draftPlans } = await (supabase as any)
    .from('nutrition_plans')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft') as { count: number | null };

  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-zinc-100'>
            Hola, {profile.full_name.split(' ')[0]}
          </h1>
          {profile.clinic_name && (
            <p className='mt-1 text-sm text-zinc-500'>{profile.clinic_name}</p>
          )}
        </div>
        <Button asChild>
          <Link href='/dashboard/patients/new'>+ Nuevo paciente</Link>
        </Button>
      </div>

      {/* Métricas */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <MetricCard
          label='Pacientes activos'
          value={patients?.length ?? 0}
        />
        <MetricCard
          label='Planes generados este mes'
          value={plansThisMonth ?? 0}
        />
        <MetricCard
          label='Borradores pendientes'
          value={draftPlans ?? 0}
          highlight={!!draftPlans && draftPlans > 0}
        />
      </div>

      {/* Lista de pacientes */}
      <div>
        <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500'>
          Pacientes
        </h2>
        {!patients || patients.length === 0 ? (
          <EmptyPatients />
        ) : (
          <div className='flex flex-col gap-2'>
            {patients.map((patient) => (
              <PatientRow key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
      <div className={`text-3xl font-bold ${highlight ? 'text-amber-400' : 'text-zinc-100'}`}>
        {value}
      </div>
      <div className='mt-1 text-sm text-zinc-500'>{label}</div>
    </div>
  );
}

function PatientRow({ patient }: { patient: Patient }) {
  const initials = patient.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/dashboard/patients/${patient.id}`}
      className='flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900'
    >
      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300'>
        {initials}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='font-medium text-zinc-100'>{patient.name}</div>
        {patient.email && (
          <div className='truncate text-sm text-zinc-500'>{patient.email}</div>
        )}
      </div>
      {patient.goal && (
        <div className='hidden rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 sm:block'>
          {GOAL_LABELS[patient.goal]}
        </div>
      )}
      <div className='text-xs text-zinc-600'>
        {new Date(patient.created_at).toLocaleDateString('es-ES')}
      </div>
    </Link>
  );
}

function EmptyPatients() {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center'>
      <p className='text-zinc-400'>Todavía no tienes pacientes.</p>
      <p className='mt-1 text-sm text-zinc-600'>
        Crea el primero pulsando &quot;Nuevo paciente&quot;.
      </p>
      <Button asChild className='mt-6'>
        <Link href='/dashboard/patients/new'>+ Nuevo paciente</Link>
      </Button>
    </div>
  );
}
