import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { GOAL_LABELS, NutritionPlan, Patient, PLAN_STATUS_LABELS } from '@/types/dietly';

import { OnboardingChecklist } from './onboarding-checklist';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verificar onboarding
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name, logo_url, onboarding_completed_at')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  // Pacientes activos del nutricionista autenticado
  const { data: patients } = (await (supabase as any)
    .from('patients')
    .select('id, name, email, goal, created_at')
    .eq('nutritionist_id', user.id)
    .order('created_at', { ascending: false })) as { data: Patient[] | null };

  // Planes generados este mes por el nutricionista autenticado
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: plansThisMonth } = await (supabase as any)
    .from('nutrition_plans')
    .select('id', { count: 'exact', head: true })
    .eq('nutritionist_id', user.id)
    .gte('created_at', startOfMonth.toISOString()) as { count: number | null };

  // Total de planes del nutricionista (para el checklist de onboarding)
  const { count: totalPlans } = await (supabase as any)
    .from('nutrition_plans')
    .select('id', { count: 'exact', head: true })
    .eq('nutritionist_id', user.id) as { count: number | null };

  // Borradores pendientes de aprobar del nutricionista autenticado
  const { data: draftPlans } = (await (supabase as any)
    .from('nutrition_plans')
    .select('id, week_start_date, created_at, patients(id, name)')
    .eq('nutritionist_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })) as {
    data: (NutritionPlan & { patients: { id: string; name: string } | null })[] | null;
  };

  const draftCount = draftPlans?.length ?? 0;

  return (
    <div className='flex flex-col gap-8'>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-zinc-100'>
            Hola, {profile.full_name.split(' ')[0]}
          </h1>
          {profile.clinic_name?.trim() ? (
            <p className='mt-1 text-sm text-zinc-500'>{profile.clinic_name}</p>
          ) : null}
        </div>
        <Button asChild>
          <Link href='/dashboard/patients/new'>+ Nuevo paciente</Link>
        </Button>
      </div>

      {/* Checklist de onboarding — desaparece cuando se completan los 4 pasos */}
      {!profile.onboarding_completed_at && (
        <OnboardingChecklist
          logoUploaded={!!profile.logo_url}
          hasPatient={(patients?.length ?? 0) > 0}
          hasPlan={(totalPlans ?? 0) > 0}
          firstPatientId={patients?.[0]?.id}
        />
      )}

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
          value={draftCount}
          highlight={draftCount > 0}
          href={draftCount > 0 ? '#borradores' : undefined}
        />
      </div>

      {/* Contador beta — límite de 10 planes */}
      <BetaMeter used={totalPlans ?? 0} />

      {/* Borradores pendientes de aprobar */}
      {draftCount > 0 && (
        <div id='borradores'>
          <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500'>
            Borradores pendientes de aprobar
          </h2>
          <div className='flex flex-col gap-2'>
            {draftPlans!.map((plan) => (
              <DraftPlanRow key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

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

// ── Componentes ────────────────────────────────────────────────────────────────

const BETA_LIMIT = 10;

function BetaMeter({ used }: { used: number }) {
  const pct = Math.min(100, (used / BETA_LIMIT) * 100);
  const isWarning = used >= 8 && used < BETA_LIMIT;
  const isFull = used >= BETA_LIMIT;

  const barColor = isFull ? '#dc2626' : isWarning ? '#d97706' : '#1a7a45';
  const borderColor = isFull
    ? 'border-red-900/50'
    : isWarning
      ? 'border-amber-900/50'
      : 'border-zinc-800';
  const labelColor = isFull ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-500';

  return (
    <div className={`rounded-xl border ${borderColor} bg-zinc-950 px-5 py-4`}>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Acceso beta
          </p>
          <p className='text-sm text-zinc-400'>
            <span className={`text-lg font-bold ${isFull ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-100'}`}>
              {used}
            </span>
            <span className='text-zinc-600'> / {BETA_LIMIT} planes utilizados</span>
          </p>
        </div>
        {isFull ? (
          <a
            href='mailto:hola@dietly.es'
            className='rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-700/60 hover:text-red-300'
          >
            Ampliar acceso →
          </a>
        ) : isWarning ? (
          <a
            href='mailto:hola@dietly.es'
            className='text-xs text-amber-600 transition-colors hover:text-amber-400'
          >
            Solicitar más planes →
          </a>
        ) : null}
      </div>

      {/* Barra de progreso */}
      <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800'>
        <div
          className='h-full rounded-full transition-all duration-500'
          style={{ width: `${pct}%`, backgroundColor: barColor }}
          role='progressbar'
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={BETA_LIMIT}
          aria-label={`${used} de ${BETA_LIMIT} planes beta utilizados`}
        />
      </div>

      {isFull && (
        <p className={`mt-2 text-xs ${labelColor}`}>
          Has alcanzado el límite de planes beta. Escríbenos para ampliar tu acceso.
        </p>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
  href,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className={`text-3xl font-bold ${highlight ? 'text-amber-400' : 'text-zinc-100'}`}>
        {value}
      </div>
      <div className='mt-1 text-sm text-zinc-500'>{label}</div>
      {href && (
        <div className='mt-2 text-xs text-amber-500/70'>Ver borradores →</div>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className='rounded-xl border border-amber-900/50 bg-zinc-950 p-5 transition-colors hover:border-amber-700/60 hover:bg-zinc-900'
      >
        {inner}
      </a>
    );
  }

  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
      {inner}
    </div>
  );
}

function DraftPlanRow({
  plan,
}: {
  plan: NutritionPlan & { patients: { id: string; name: string } | null };
}) {
  return (
    <Link
      href={`/dashboard/plans/${plan.id}`}
      className='flex items-center justify-between rounded-xl border border-amber-900/40 bg-zinc-950 p-4 transition-colors hover:border-amber-700/60 hover:bg-zinc-900'
    >
      <div className='flex flex-col gap-0.5'>
        <span className='font-medium text-zinc-100'>
          {plan.patients?.name ?? 'Paciente desconocido'}
        </span>
        <span className='text-xs text-zinc-500'>
          Semana del{' '}
          {new Date(plan.week_start_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
      <span className='rounded-full bg-amber-950 px-2.5 py-0.5 text-xs font-medium text-amber-400'>
        {PLAN_STATUS_LABELS.draft}
      </span>
    </Link>
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
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='flex-shrink-0 text-zinc-700'
        aria-hidden='true'
      >
        <polyline points='9 18 15 12 9 6' />
      </svg>
    </Link>
  );
}

function EmptyPatients() {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center'>
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='22'
          height='22'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='text-zinc-600'
          aria-hidden='true'
        >
          <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
          <circle cx='9' cy='7' r='4' />
          <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
          <path d='M16 3.13a4 4 0 0 1 0 7.75' />
        </svg>
      </div>
      <p className='font-medium text-zinc-300'>Añade tu primer paciente</p>
      <p className='mt-1 text-sm text-zinc-600'>
        Crea su ficha y genera un plan nutricional en 2 minutos.
      </p>
      <Button asChild className='mt-6'>
        <Link href='/dashboard/patients/new'>+ Nuevo paciente</Link>
      </Button>
    </div>
  );
}
