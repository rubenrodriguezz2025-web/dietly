export interface BetaUserMetric {
  email: string;
  name: string | null;
  addedAt: string | null;
  registered: boolean;
  registeredAt: string | null;
  lastSignIn: string | null;
  patientCount: number;
  planCount: number;
  approvedCount: number;
  sentCount: number;
  tokensTotal: number;
  costEur: number;
  status: 'active' | 'inactive' | 'no_activity' | 'not_registered';
}

export interface MetricsSummary {
  totalUsers: number;
  registeredUsers: number;
  totalCostEur: number;
  avgPlansPerUser: number;
  topUser: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)}sem`;
  return fmtDate(iso);
}

const STATUS = {
  active: { label: 'Activo', dot: '🟢', cls: 'bg-green-900/30 text-green-400' },
  inactive: { label: 'Inactivo', dot: '🟡', cls: 'bg-yellow-900/30 text-yellow-400' },
  no_activity: { label: 'Sin actividad', dot: '🔴', cls: 'bg-red-900/30 text-red-400' },
  not_registered: { label: 'No registrado', dot: '⚪', cls: 'bg-zinc-800 text-zinc-500' },
} as const;

const TABLE_HEADERS = [
  'Usuario',
  'Registro',
  'Último acceso',
  'Pacientes',
  'Planes',
  'Aprobados',
  'Enviados',
  'Tokens',
  'Coste €',
  'Estado',
];

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4'>
      <p className='mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500'>
        {label}
      </p>
      <p className='truncate text-2xl font-bold tabular-nums text-zinc-100'>{value}</p>
      <p className='mt-0.5 truncate text-[11px] text-zinc-600' title={sub}>
        {sub}
      </p>
    </div>
  );
}

export function BetaMetricsPanel({
  metrics,
  summary,
}: {
  metrics: BetaUserMetric[];
  summary: MetricsSummary;
}) {
  const topName = summary.topUser ? (summary.topUser.split('@')[0] ?? summary.topUser) : '—';

  return (
    <div className='flex flex-col gap-5'>
      {/* Resumen */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatCard
          label='Beta users'
          value={String(summary.totalUsers)}
          sub={`${summary.registeredUsers} registrados`}
        />
        <StatCard
          label='Coste total'
          value={`€${summary.totalCostEur.toFixed(3)}`}
          sub='estimado IA'
        />
        <StatCard
          label='Media planes'
          value={summary.avgPlansPerUser.toFixed(1)}
          sub='por usuario registrado'
        />
        <StatCard
          label='Más activo'
          value={topName}
          sub={summary.topUser ?? 'ninguno aún'}
        />
      </div>

      {/* Tabla */}
      {metrics.length === 0 ? (
        <p className='py-6 text-center text-sm text-zinc-600'>Sin datos todavía.</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-zinc-800'>
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h}
                    className='whitespace-nowrap pb-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800/60'>
              {metrics.map((m) => {
                const s = STATUS[m.status];
                return (
                  <tr key={m.email}>
                    <td className='py-3 pr-4'>
                      <div className='font-mono text-xs text-zinc-300'>{m.email}</div>
                      {m.name && <div className='text-[11px] text-zinc-500'>{m.name}</div>}
                    </td>
                    <td className='whitespace-nowrap py-3 pr-4 text-xs tabular-nums text-zinc-400'>
                      {fmtDate(m.registeredAt)}
                    </td>
                    <td className='whitespace-nowrap py-3 pr-4 text-xs tabular-nums text-zinc-400'>
                      {fmtRelative(m.lastSignIn)}
                    </td>
                    <td className='py-3 pr-4 text-center tabular-nums text-zinc-300'>
                      {m.patientCount}
                    </td>
                    <td className='py-3 pr-4 text-center tabular-nums text-zinc-300'>
                      {m.planCount}
                    </td>
                    <td className='py-3 pr-4 text-center tabular-nums text-zinc-400'>
                      {m.approvedCount}
                    </td>
                    <td className='py-3 pr-4 text-center tabular-nums text-zinc-400'>
                      {m.sentCount}
                    </td>
                    <td className='whitespace-nowrap py-3 pr-4 text-right text-xs tabular-nums text-zinc-500'>
                      {m.tokensTotal > 0 ? m.tokensTotal.toLocaleString('es-ES') : '—'}
                    </td>
                    <td className='whitespace-nowrap py-3 pr-4 text-right text-xs tabular-nums text-zinc-400'>
                      {m.costEur > 0 ? `€${m.costEur.toFixed(4)}` : '—'}
                    </td>
                    <td className='py-3'>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}
                      >
                        {s.dot} {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
