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

  // ── Queries paralelas (todas dependen solo de user.id) ──────────────────
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const today = new Date().toISOString().split('T')[0];
  const normalizedEmail = (user.email ?? '').toLowerCase().trim();

  const [
    { data: patientsRaw },
    { data: allPendingReminders },
    { count: plansThisMonth },
    { count: plansLastMonth },
    { count: totalPlans },
    { data: dueReminders },
    { data: whitelistEntry },
    { data: allPlans },
  ] = await Promise.all([
    // Pacientes activos con estado de planes
    (supabase as any)
      .from('patients')
      .select('id, name, email, goal, created_at, nutrition_plans(id, status, created_at)')
      .eq('nutritionist_id', user.id)
      .order('created_at', { ascending: false }) as Promise<{
      data: (Patient & { nutrition_plans: { id: string; status: string; created_at: string }[] })[] | null;
    }>,
    // Recordatorios pendientes por paciente
    (supabase as any)
      .from('followup_reminders')
      .select('patient_id')
      .eq('nutritionist_id', user.id)
      .eq('status', 'pending') as Promise<{ data: { patient_id: string }[] | null }>,
    // Planes este mes
    (supabase as any)
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id)
      .gte('created_at', startOfMonth.toISOString()) as Promise<{ count: number | null }>,
    // Planes mes anterior
    (supabase as any)
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id)
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString()) as Promise<{ count: number | null }>,
    // Total planes (onboarding checklist)
    (supabase as any)
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id) as Promise<{ count: number | null }>,
    // Recordatorios vencidos
    (supabase as any)
      .from('followup_reminders')
      .select('id, remind_at, patients(id, name)')
      .eq('nutritionist_id', user.id)
      .eq('status', 'pending')
      .lte('remind_at', today)
      .order('remind_at', { ascending: true }),
    // Beta whitelist limit
    (supabaseAdminClient as any)
      .from('beta_whitelist')
      .select('plan_limit')
      .eq('email', normalizedEmail)
      .maybeSingle() as Promise<{ data: { plan_limit: number | null } | null }>,
    // Planes recientes (kanban)
    (supabase as any)
      .from('nutrition_plans')
      .select('id, status, week_start_date, created_at, patients(id, name)')
      .eq('nutritionist_id', user.id)
      .in('status', ['draft', 'approved', 'sent', 'generating'])
      .order('created_at', { ascending: false })
      .limit(30) as Promise<{
      data: (NutritionPlan & { patients: { id: string; name: string } | null })[] | null;
    }>,
  ]);

  const pendingReminderPatientIds = new Set((allPendingReminders ?? []).map((r) => r.patient_id));

  const patients = (patientsRaw ?? []).map((p) => ({
    ...p,
    nutrition_plans: [...(p.nutrition_plans ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    has_pending_reminder: pendingReminderPatientIds.has(p.id),
  }));

  // Marcar los recordatorios vencidos como 'sent' (se mostraron en el banner)
  if (dueReminders && dueReminders.length > 0) {
    await (supabase as any)
      .from('followup_reminders')
      .update({ status: 'sent' })
      .in('id', (dueReminders as Array<{ id: string }>).map((r) => r.id));
  }

  const betaPlanLimit: number | null = whitelistEntry?.plan_limit ?? null;

  const draftPlans = (allPlans ?? []).filter((p) => p.status === 'draft');
  const draftCount = draftPlans.length;

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

      {/* Kanban de planes */}
      {(allPlans?.length ?? 0) > 0 && (
        <div id='borradores'>
          <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500'>
            Estado de los planes
          </h2>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <KanbanColumn
              title='Borrador'
              color='amber'
              plans={(allPlans ?? []).filter((p) => p.status === 'draft' || p.status === 'generating')}
            />
            <KanbanColumn
              title='Aprobado'
              color='emerald'
              plans={(allPlans ?? []).filter((p) => p.status === 'approved')}
            />
            <KanbanColumn
              title='Enviado'
              color='blue'
              plans={(allPlans ?? []).filter((p) => p.status === 'sent')}
            />
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
    <div className={`rounded-xl border ${borderColor} bg-white dark:bg-zinc-950 px-5 py-4`}>
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
      <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800'>
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
        className={`group rounded-xl border ${s.border} bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none transition-colors duration-150 ${s.hoverBorder} hover:bg-gray-50 dark:hover:bg-zinc-900`}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className={`rounded-xl border ${s.border} bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none`}>
      {inner}
    </div>
  );
}

const KANBAN_COLORS = {
  amber: {
    border: 'border-amber-900/40',
    dot: 'bg-amber-400',
    title: 'text-amber-400',
    cardBorder: 'border-amber-900/30 hover:border-amber-700/50',
    empty: 'text-amber-900/60',
  },
  emerald: {
    border: 'border-emerald-900/40',
    dot: 'bg-emerald-400',
    title: 'text-emerald-400',
    cardBorder: 'border-emerald-900/30 hover:border-emerald-700/50',
    empty: 'text-emerald-900/60',
  },
  blue: {
    border: 'border-blue-900/40',
    dot: 'bg-blue-400',
    title: 'text-blue-400',
    cardBorder: 'border-blue-900/30 hover:border-blue-700/50',
    empty: 'text-blue-900/60',
  },
} as const;

function KanbanColumn({
  title,
  color,
  plans,
}: {
  title: string;
  color: keyof typeof KANBAN_COLORS;
  plans: (NutritionPlan & { patients: { id: string; name: string } | null })[];
}) {
  const s = KANBAN_COLORS[color];
  return (
    <div className={`rounded-xl border ${s.border} bg-gray-50 dark:bg-zinc-950 p-4`}>
      <div className='mb-3 flex items-center gap-2'>
        <div className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${s.title}`}>
          {title}
        </span>
        <span className='ml-auto text-xs tabular-nums text-zinc-600'>{plans.length}</span>
      </div>
      {plans.length === 0 ? (
        <p className={`py-4 text-center text-xs ${s.empty}`}>Sin planes</p>
      ) : (
        <div className='flex flex-col gap-2'>
          {plans.slice(0, 5).map((plan) => (
            <Link
              key={plan.id}
              href={`/dashboard/plans/${plan.id}`}
              className={`rounded-lg border ${s.cardBorder} bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none px-3 py-2.5 transition-colors`}
            >
              <span className='block text-sm font-medium text-zinc-200'>
                {plan.patients?.name ?? 'Paciente'}
              </span>
              <span className='text-xs text-zinc-600'>
                {new Date(plan.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </Link>
          ))}
          {plans.length > 5 && (
            <p className='pt-1 text-center text-xs text-zinc-600'>
              +{plans.length - 5} más
            </p>
          )}
        </div>
      )}
    </div>
  );
}

