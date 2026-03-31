import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { NutritionPlan, Patient, PLAN_STATUS_LABELS } from '@/types/dietly';

import { DueRemindersBanner } from './due-reminders-banner';
import { OnboardingChecklist } from './onboarding-checklist';
import { PatientsSection } from './patients-section';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Verificar onboarding
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name, logo_url, onboarding_completed_at, brand_settings_visited_at')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  // Pacientes activos del nutricionista autenticado (con estado de planes)
  const { data: patientsRaw } = (await (supabase as any)
    .from('patients')
    .select('id, name, email, goal, created_at, nutrition_plans(id, status, created_at)')
    .eq('nutritionist_id', user.id)
    .order('created_at', { ascending: false })) as {
    data: (Patient & { nutrition_plans: { id: string; status: string; created_at: string }[] })[] | null;
  };

  // Recordatorios con seguimiento pendiente por paciente
  const { data: allPendingReminders } = await (supabase as any)
    .from('followup_reminders')
    .select('patient_id')
    .eq('nutritionist_id', user.id)
    .eq('status', 'pending') as { data: { patient_id: string }[] | null };

  const pendingReminderPatientIds = new Set((allPendingReminders ?? []).map((r) => r.patient_id));

  const patients = (patientsRaw ?? []).map((p) => ({
    ...p,
    nutrition_plans: [...(p.nutrition_plans ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    has_pending_reminder: pendingReminderPatientIds.has(p.id),
  }));

  // Planes generados este mes por el nutricionista autenticado
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const [{ count: plansThisMonth }, { count: plansLastMonth }] = await Promise.all([
    (supabase as any)
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id)
      .gte('created_at', startOfMonth.toISOString()) as Promise<{ count: number | null }>,
    (supabase as any)
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id)
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString()) as Promise<{ count: number | null }>,
  ]);

  // Total de planes del nutricionista (para el checklist de onboarding)
  const { count: totalPlans } = await (supabase as any)
    .from('nutrition_plans')
    .select('id', { count: 'exact', head: true })
    .eq('nutritionist_id', user.id) as { count: number | null };

  // Recordatorios pendientes (remind_at <= hoy, status = 'pending')
  const today = new Date().toISOString().split('T')[0];
  const { data: dueReminders } = await (supabase as any)
    .from('followup_reminders')
    .select('id, remind_at, patients(id, name)')
    .eq('nutritionist_id', user.id)
    .eq('status', 'pending')
    .lte('remind_at', today)
    .order('remind_at', { ascending: true });

  // Marcar los recordatorios vencidos como 'sent' (se mostraron en el banner)
  if (dueReminders && dueReminders.length > 0) {
    await (supabase as any)
      .from('followup_reminders')
      .update({ status: 'sent' })
      .in('id', (dueReminders as Array<{ id: string }>).map((r) => r.id));
  }

  // plan_limit del usuario en beta_whitelist (para mostrar u ocultar el medidor)
  const normalizedEmail = (user.email ?? '').toLowerCase().trim();
  const { data: whitelistEntry } = await (supabaseAdminClient as any)
    .from('beta_whitelist')
    .select('plan_limit')
    .eq('email', normalizedEmail)
    .maybeSingle() as { data: { plan_limit: number | null } | null };
  const betaPlanLimit: number | null = whitelistEntry?.plan_limit ?? null;

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
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-xs font-medium capitalize text-zinc-600'>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className='mt-0.5 text-2xl font-bold text-zinc-100'>
            Hola, {profile.full_name.split(' ')[0]}
          </h1>
          {profile.clinic_name?.trim() && profile.clinic_name.trim().length > 1 ? (
            <p className='mt-0.5 text-sm text-zinc-500'>{profile.clinic_name}</p>
          ) : null}
        </div>
        <Button asChild className='flex-shrink-0'>
          <Link href='/dashboard/patients/new'>+ Nuevo paciente</Link>
        </Button>
      </div>

      {/* Banner de recordatorios vencidos */}
      {dueReminders && dueReminders.length > 0 && (
        <DueRemindersBanner reminders={dueReminders as Array<{ id: string; remind_at: string; patients: { id: string; name: string } | null }>} />
      )}

      {/* Checklist de onboarding — desaparece cuando se completan los 4 pasos */}
      {!profile.onboarding_completed_at && (
        <OnboardingChecklist
          brandVisited={!!profile.brand_settings_visited_at}
          hasPatient={(patients?.length ?? 0) > 0}
          hasPlan={(totalPlans ?? 0) > 0}
          firstPatientId={patients?.[0]?.id}
        />
      )}

      {/* Métricas */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <MetricCard
          label='Pacientes activos'
          value={patients?.length ?? 0}
          accent='zinc'
          tooltip='Total de pacientes en tu base de datos'
          icon={
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
              <path d='M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
          }
        />
        <MetricCard
          label='Planes generados este mes'
          value={plansThisMonth ?? 0}
          accent='emerald'
          tooltip='Planes nutricionales generados desde el 1 de este mes'
          trend={(plansThisMonth ?? 0) - (plansLastMonth ?? 0)}
          trendLabel={plansLastMonth ? `vs ${plansLastMonth} el mes pasado` : undefined}
          icon={
            <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
              <path d='M13 2L4.09 12.96A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.96A1 1 0 0 0 19 9.5H13.5L13 2z' />
            </svg>
          }
        />
        <MetricCard
          label='Borradores pendientes'
          value={draftCount}
          accent={draftCount > 0 ? 'amber' : 'zinc'}
          tooltip='Planes generados por IA pendientes de revisión y aprobación'
          href={draftCount > 0 ? '#borradores' : undefined}
          cta={draftCount > 0 ? 'Revisar' : undefined}
          icon={
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
              <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
            </svg>
          }
        />
      </div>

      {/* Contador beta — oculto si el usuario tiene plan_limit=-1 */}
      {betaPlanLimit !== -1 && (
        <BetaMeter used={totalPlans ?? 0} limit={betaPlanLimit ?? 10} />
      )}

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
      <PatientsSection patients={patients} />
    </div>
  );
}

// ── Componentes ────────────────────────────────────────────────────────────────

function BetaMeter({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const isWarning = used >= limit - 2 && used < limit;
  const isFull = used >= limit;

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
            <span className='text-zinc-600'> / {limit} planes utilizados</span>
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
          aria-valuemax={limit}
          aria-label={`${used} de ${limit} planes beta utilizados`}
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

// Tooltip flotante accessible vía title nativo — sin librería extra
const METRIC_ACCENT = {
  zinc: {
    border: 'border-zinc-800',
    iconBg: 'bg-zinc-900',
    iconColor: 'text-zinc-500',
    valueColor: 'text-zinc-100',
    hoverBorder: '',
  },
  emerald: {
    border: 'border-zinc-800',
    iconBg: 'bg-[#1a7a45]/10',
    iconColor: 'text-emerald-500',
    valueColor: 'text-zinc-100',
    hoverBorder: '',
  },
  amber: {
    border: 'border-amber-900/50',
    iconBg: 'bg-amber-950/50',
    iconColor: 'text-amber-400',
    valueColor: 'text-amber-300',
    hoverBorder: 'hover:border-amber-700/60',
  },
} as const;

function MetricCard({
  label,
  value,
  accent = 'zinc',
  icon,
  tooltip,
  href,
  cta,
  trend,
  trendLabel,
}: {
  label: string;
  value: number;
  accent?: keyof typeof METRIC_ACCENT;
  icon: React.ReactNode;
  tooltip?: string;
  href?: string;
  cta?: string;
  trend?: number;
  trendLabel?: string;
}) {
  const s = METRIC_ACCENT[accent];

  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  const inner = (
    <div className='flex flex-col gap-3 p-5'>
      {/* Label row */}
      <div className='flex items-center gap-2'>
        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${s.iconBg} ${s.iconColor}`}>
          {icon}
        </div>
        <span className='text-xs font-medium text-zinc-500 leading-tight flex-1'>
          {label}
        </span>
        {tooltip && (
          <span
            title={tooltip}
            aria-label={tooltip}
            className='cursor-help text-zinc-700 transition-colors hover:text-zinc-500'
          >
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='16' x2='12' y2='12' />
              <line x1='12' y1='8' x2='12.01' y2='8' />
            </svg>
          </span>
        )}
      </div>
      {/* Value row */}
      <div className='flex items-end justify-between gap-2'>
        <span className={`text-2xl font-bold tabular-nums leading-none ${s.valueColor}`}>
          {value}
        </span>
        <div className='flex flex-col items-end gap-0.5'>
          {trend !== undefined && trend !== 0 && (
            <span className={`flex items-center gap-0.5 text-xs font-medium leading-none tabular-nums ${
              trendUp ? 'text-emerald-400' : trendDown ? 'text-red-400' : 'text-zinc-600'
            }`}>
              {trendUp ? (
                <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <polyline points='18 15 12 9 6 15' />
                </svg>
              ) : (
                <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <polyline points='6 9 12 15 18 9' />
                </svg>
              )}
              {trendUp ? '+' : ''}{trend}
            </span>
          )}
          {trendLabel && (
            <span className='text-[10px] text-zinc-700 leading-none'>{trendLabel}</span>
          )}
          {cta && href && (
            <span className='text-xs text-amber-500/70 leading-none'>
              {cta} →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`group rounded-xl border ${s.border} bg-zinc-950 transition-colors duration-150 ${s.hoverBorder} hover:bg-zinc-900`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={`rounded-xl border ${s.border} bg-zinc-950`}>
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

