import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { AddBetaForm } from './add-form';
import { BetaMetricsPanel, type BetaUserMetric, type MetricsSummary } from './beta-metrics';
import { BetaTable } from './beta-table';

const ADMIN_EMAIL = 'rubenrodriguezz2025@gmail.com';

interface BetaEntry {
  id: string;
  email: string;
  name: string | null;
  added_at: string;
  notes: string | null;
}

type AuthUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
};

type PatientRow = { nutritionist_id: string };
type PlanRow = { nutritionist_id: string; status: string; created_at: string };
type LogRow = { nutritionist_id: string; tokens_input: number; tokens_output: number };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export default async function AdminBetaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  // ── Whitelist ─────────────────────────────────────────────────────────────
  const adminDb = supabaseAdminClient as any; // cliente sin tipos de BD generados

  const { data: entries } = (await adminDb
    .from('beta_whitelist')
    .select('id, email, name, added_at, notes')
    .order('added_at', { ascending: false })) as { data: BetaEntry[] | null };

  const list = entries ?? [];

  // ── Auth users para cruzar con whitelist ──────────────────────────────────
  const authListResult = await supabaseAdminClient.auth.admin.listUsers({ perPage: 1000 });
  const allAuthUsers = (authListResult.data?.users ?? []) as AuthUser[];
  const betaEmails = new Set(list.map((e) => e.email.toLowerCase()));
  const registeredUsers = allAuthUsers.filter(
    (u) => u.email && betaEmails.has(u.email.toLowerCase()),
  );
  const registeredIds = registeredUsers.map((u) => u.id);

  // ── Datos agregados (en paralelo) ─────────────────────────────────────────
  const [patientsResult, plansResult, logsResult] =
    registeredIds.length > 0
      ? await Promise.all([
          adminDb.from('patients').select('nutritionist_id').in('nutritionist_id', registeredIds),
          adminDb
            .from('nutrition_plans')
            .select('nutritionist_id, status, created_at')
            .in('nutritionist_id', registeredIds),
          adminDb
            .from('ai_request_logs')
            .select('nutritionist_id, tokens_input, tokens_output')
            .in('nutritionist_id', registeredIds),
        ])
      : [{ data: null }, { data: null }, { data: null }];

  const patients: PatientRow[] = patientsResult.data ?? [];
  const plans: PlanRow[] = plansResult.data ?? [];
  const logs: LogRow[] = logsResult.data ?? [];

  // ── Construir métricas por usuario ────────────────────────────────────────
  const now = Date.now();

  const metrics: BetaUserMetric[] = list.map((entry) => {
    const authUser = registeredUsers.find(
      (u) => u.email?.toLowerCase() === entry.email.toLowerCase(),
    );

    if (!authUser) {
      return {
        email: entry.email,
        name: entry.name,
        addedAt: entry.added_at,
        registered: false,
        registeredAt: null,
        lastSignIn: null,
        patientCount: 0,
        planCount: 0,
        approvedCount: 0,
        sentCount: 0,
        tokensTotal: 0,
        costEur: 0,
        status: 'not_registered' as const,
      };
    }

    const id = authUser.id;
    const userPlans = plans.filter((p) => p.nutritionist_id === id);
    const patientCount = patients.filter((p) => p.nutritionist_id === id).length;
    const planCount = userPlans.length;
    const approvedCount = userPlans.filter((p) => p.status === 'approved').length;
    const sentCount = userPlans.filter((p) => p.status === 'sent').length;
    const userLogs = logs.filter((l) => l.nutritionist_id === id);
    const tokensTotal = userLogs.reduce(
      (s, l) => s + (l.tokens_input ?? 0) + (l.tokens_output ?? 0),
      0,
    );
    const costEur = tokensTotal * 0.000009;

    const hasRecentPlan = userPlans.some(
      (p) => now - new Date(p.created_at).getTime() < SEVEN_DAYS_MS,
    );
    const registeredAgo = now - new Date(authUser.created_at).getTime();

    let status: BetaUserMetric['status'];
    if (hasRecentPlan) {
      status = 'active';
    } else if (patientCount === 0 && registeredAgo > THREE_DAYS_MS) {
      status = 'no_activity';
    } else {
      status = 'inactive';
    }

    return {
      email: entry.email,
      name: entry.name,
      addedAt: entry.added_at,
      registered: true,
      registeredAt: authUser.created_at,
      lastSignIn: authUser.last_sign_in_at ?? null,
      patientCount,
      planCount,
      approvedCount,
      sentCount,
      tokensTotal,
      costEur,
      status,
    };
  });

  // ── Resumen ───────────────────────────────────────────────────────────────
  const registeredMetrics = metrics.filter((m) => m.registered);
  const totalCostEur = metrics.reduce((s, m) => s + m.costEur, 0);
  const avgPlansPerUser =
    registeredMetrics.length > 0
      ? registeredMetrics.reduce((s, m) => s + m.planCount, 0) / registeredMetrics.length
      : 0;
  const topUser = metrics.reduce<BetaUserMetric | null>(
    (top, m) => (!top || m.planCount > top.planCount ? m : top),
    null,
  );

  const summary: MetricsSummary = {
    totalUsers: list.length,
    registeredUsers: registeredMetrics.length,
    totalCostEur,
    avgPlansPerUser,
    topUser: topUser?.planCount ? topUser.email : null,
  };

  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div>
        <p className='mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600'>
          Admin
        </p>
        <h1 className='text-2xl font-bold text-zinc-100'>Acceso beta</h1>
        <p className='mt-1 text-sm text-zinc-500'>
          Gestiona quién puede registrarse en Dietly durante la fase de acceso anticipado.
        </p>
      </div>

      {/* Counter */}
      <div className='flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4'>
        <span className='text-3xl font-bold tabular-nums text-zinc-100'>{list.length}</span>
        <span className='text-sm text-zinc-500'>
          {list.length === 1 ? 'nutricionista en beta' : 'nutricionistas en beta'}
        </span>
      </div>

      {/* Añadir */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-5'>
        <h2 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Añadir nutricionista
        </h2>
        <AddBetaForm />
      </div>

      {/* Lista blanca */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-5'>
        <h2 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Lista blanca
        </h2>
        <BetaTable entries={list} />
      </div>

      {/* Métricas */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-5'>
        <h2 className='mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Métricas de beta users
        </h2>
        <BetaMetricsPanel metrics={metrics} summary={summary} />
      </div>
    </div>
  );
}
