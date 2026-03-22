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

