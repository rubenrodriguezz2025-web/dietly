'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { PatientProgress } from '@/types/dietly';
import { cn } from '@/utils/cn';

import { addProgressEntry, deleteProgressEntry } from './progress-actions';

// ── Metric config ─────────────────────────────────────────────────────────

type MetricKey = 'weight_kg' | 'body_fat_pct' | 'muscle_mass_kg' | 'waist_cm' | 'hip_cm';

const METRIC_CONFIG: Record<MetricKey, { label: string; unit: string; color: string; gradId: string }> = {
  weight_kg:      { label: 'Peso',     unit: 'kg', color: '#22c55e', gradId: 'g-weight'  },
  body_fat_pct:   { label: 'Grasa',    unit: '%',  color: '#f59e0b', gradId: 'g-fat'     },
  muscle_mass_kg: { label: 'Músculo',  unit: 'kg', color: '#60a5fa', gradId: 'g-muscle'  },
  waist_cm:       { label: 'Cintura',  unit: 'cm', color: '#a78bfa', gradId: 'g-waist'   },
  hip_cm:         { label: 'Cadera',   unit: 'cm', color: '#f472b6', gradId: 'g-hip'     },
};

const METRIC_KEYS = Object.keys(METRIC_CONFIG) as MetricKey[];

// ── Adherence config ─────────────────────────────────────────────────────

const ADHERENCE_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Muy baja', color: 'text-red-400',    bg: 'bg-red-950' },
  2: { label: 'Baja',     color: 'text-orange-400', bg: 'bg-orange-950' },
  3: { label: 'Regular',  color: 'text-amber-400',  bg: 'bg-amber-950' },
  4: { label: 'Buena',    color: 'text-emerald-400', bg: 'bg-emerald-950' },
  5: { label: 'Excelente', color: 'text-green-400', bg: 'bg-green-950' },
};

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

function fmtLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Calcula tendencia entre dos valores: ↑ ↓ → */
function getTrend(current: number | null, previous: number | null): 'up' | 'down' | 'same' | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return 'same';
  return diff > 0 ? 'up' : 'down';
}

function TrendIcon({ trend, inverse }: { trend: 'up' | 'down' | 'same' | null; inverse?: boolean }) {
  if (!trend || trend === 'same') return null;
  // inverse: para peso/grasa/cintura, bajar es positivo
  const isPositive = inverse ? trend === 'down' : trend === 'up';
  return (
    <svg
      width='10'
      height='10'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn('inline-block ml-0.5', isPositive ? 'text-emerald-400' : 'text-red-400')}
      aria-label={trend === 'up' ? 'Subida' : 'Bajada'}
    >
      {trend === 'up' ? (
        <polyline points='18 15 12 9 6 15' />
      ) : (
        <polyline points='6 9 12 15 18 9' />
      )}
    </svg>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: PatientProgress }>;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const entry = payload[0]?.payload;

  return (
    <div className='pointer-events-none rounded-lg border border-zinc-700/40 bg-white dark:bg-zinc-950 px-3 py-2.5 shadow-xl'>
      <p className='mb-1.5 text-[11px] text-zinc-600'>{fmtLong(entry.recorded_at)}</p>
      <p className='text-sm font-semibold text-zinc-100'>
        {value}
        <span className='ml-0.5 text-xs font-normal text-zinc-500'> {unit}</span>
      </p>
      {entry.adherence_score && (
        <p className='mt-1.5 text-[11px] text-zinc-500'>
          Adherencia: <span className={ADHERENCE_LABELS[entry.adherence_score]?.color}>{ADHERENCE_LABELS[entry.adherence_score]?.label}</span>
        </p>
      )}
      {entry.notes && (
        <p className='mt-2 max-w-[180px] border-t border-zinc-800 pt-2 text-[11px] leading-relaxed text-zinc-500'>
          {entry.notes}
        </p>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ firstName, onAdd }: { firstName: string; onAdd: () => void }) {
  return (
    <div className='flex flex-col gap-10 py-8 lg:flex-row lg:items-center'>
      <div className='flex flex-col gap-5 lg:max-w-sm'>
        <div>
          <h3 className='text-lg font-semibold leading-snug text-zinc-100'>
            Empieza a medir
            <br />
            el progreso de {firstName}
          </h3>
          <p className='mt-2 text-sm leading-relaxed text-zinc-500'>
            Registra peso, grasa corporal, masa muscular y cintura. La evolución
            aparecerá en una gráfica para identificar tendencias de un vistazo.
          </p>
        </div>
        <button
          onClick={onAdd}
          className='self-start rounded-lg bg-[#1a7a45] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
        >
          + Registrar primera medición
        </button>
      </div>

      {/* Abstract SVG — hinted trend line */}
      <div aria-hidden className='hidden flex-1 items-center justify-end lg:flex'>
        <svg
          viewBox='0 0 320 130'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='w-full max-w-xs opacity-[0.13]'
        >
          {[20, 55, 90].map((y) => (
            <line key={y} x1='0' y1={y} x2='320' y2={y} stroke='#22c55e' strokeWidth='0.6' />
          ))}
          <path
            d='M10,110 C40,100 60,88 95,72 S140,50 180,38 S240,22 310,10'
            stroke='#22c55e'
            strokeWidth='2.5'
            strokeLinecap='round'
          />
          {([
            [10, 110], [60, 90], [110, 70], [160, 50], [210, 35], [265, 20], [310, 10],
          ] as [number, number][]).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r='4' fill='#1a7a45' />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Input field helper ────────────────────────────────────────────────────

function Field({
  label,
  name,
  type = 'number',
  required,
  placeholder,
  min,
  max,
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={name} className='text-xs font-medium text-zinc-700 dark:text-zinc-400'>
        {label}
        {required && <span className='ml-1 text-zinc-600'>*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        className='rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-700'
      />
    </div>
  );
}

// ── Adherence selector ───────────────────────────────────────────────────

function AdherenceSelector({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-xs font-medium text-zinc-700 dark:text-zinc-400'>
        Adherencia al plan
      </label>
      <div className='flex gap-1.5'>
        {([1, 2, 3, 4, 5] as const).map((score) => {
          const cfg = ADHERENCE_LABELS[score];
          const isSelected = value === score;
          return (
            <button
              key={score}
              type='button'
              onClick={() => onChange(isSelected ? null : score)}
              className={cn(
                'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-150',
                isSelected
                  ? `${cfg.bg} ${cfg.color} border-current/20`
                  : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700',
              )}
            >
              {score}
            </button>
          );
        })}
      </div>
      <div className='flex justify-between text-[10px] text-zinc-700'>
        <span>Muy baja</span>
        <span>Excelente</span>
      </div>
    </div>
  );
}

// ── "Sin revisión en 30+ días" badge ─────────────────────────────────────

function StaleReviewBadge({ lastRecordedAt }: { lastRecordedAt: string | null }) {
  if (!lastRecordedAt) return null;
  const daysSince = Math.floor(
    (Date.now() - new Date(lastRecordedAt + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince < 30) return null;

  return (
    <span className='inline-flex items-center gap-1.5 rounded-full bg-red-950 px-2.5 py-0.5 text-xs font-medium text-red-400'>
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-3 w-3' aria-hidden>
        <circle cx='12' cy='12' r='10' />
        <polyline points='12 6 12 12 16 14' />
      </svg>
      Sin revisión en {daysSince} días
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function ProgressTab({
  progress,
  patientId,
  patientName,
}: {
  progress: PatientProgress[];
  patientId: string;
  patientName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weight_kg');
  const [adherenceValue, setAdherenceValue] = useState<number | null>(null);

  // Entries visible: server data minus optimistic deletes
  const entries = progress.filter((e) => !pendingDeletes.has(e.id));
  const firstName = patientName.split(' ')[0];

  // Metrics that have at least one registered value
  const availableMetrics = METRIC_KEYS.filter((m) =>
    entries.some((e) => e[m] !== null && e[m] !== undefined),
  );

  // Chart data: ascending by date (oldest → newest)
  const chartData = [...entries].sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at),
  );

  // Table data: descending (newest first)
  const tableData = [...entries].sort((a, b) =>
    b.recorded_at.localeCompare(a.recorded_at),
  );

  // Which columns have at least one non-null value
  const hasData = {
    weight_kg:      entries.some((e) => e.weight_kg !== null),
    body_fat_pct:   entries.some((e) => e.body_fat_pct !== null),
    muscle_mass_kg: entries.some((e) => e.muscle_mass_kg !== null),
    waist_cm:       entries.some((e) => e.waist_cm !== null),
    hip_cm:         entries.some((e) => e.hip_cm !== null),
    adherence:      entries.some((e) => e.adherence_score !== null),
    notes:          entries.some((e) => e.notes),
  };

  const cfg = METRIC_CONFIG[activeMetric];

  // Last recorded date for stale badge
  const lastRecordedAt = tableData.length > 0 ? tableData[0].recorded_at : null;

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setFormError(null);

    const fd = new FormData(formRef.current);
    const data = {
      recorded_at:       fd.get('recorded_at') as string,
      weight_kg:         fd.get('weight_kg') ? Number(fd.get('weight_kg')) : null,
      body_fat_pct:      fd.get('body_fat_pct') ? Number(fd.get('body_fat_pct')) : null,
      muscle_mass_kg:    fd.get('muscle_mass_kg') ? Number(fd.get('muscle_mass_kg')) : null,
      waist_cm:          fd.get('waist_cm') ? Number(fd.get('waist_cm')) : null,
      hip_cm:            fd.get('hip_cm') ? Number(fd.get('hip_cm')) : null,
      adherence_score:   adherenceValue,
      new_plan_generated: fd.get('new_plan_generated') === 'on',
      notes:             (fd.get('notes') as string) || null,
    };

    startTransition(async () => {
      const result = await addProgressEntry(patientId, data);
      if (result.error) {
        setFormError(result.error);
      } else {
        formRef.current?.reset();
        setAdherenceValue(null);
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(entryId: string) {
    // Optimistic: hide the row immediately
    setPendingDeletes((prev) => new Set([...prev, entryId]));
    setConfirmingId(null);

    const result = await deleteProgressEntry(entryId, patientId);
    if (result.error) {
      // Rollback on error
      setPendingDeletes((prev) => {
        const s = new Set(prev);
        s.delete(entryId);
        return s;
      });
    } else {
      setPendingDeletes(new Set());
      router.refresh();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes _progIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prg-in {
          animation: _progIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .prg-in { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      <div className='prg-in flex flex-col gap-7'>
        {/* ── Header ── */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <p className='text-xs font-semibold uppercase tracking-wider text-zinc-600'>
              Historial de progreso
            </p>
            <StaleReviewBadge lastRecordedAt={lastRecordedAt} />
          </div>

          <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setAdherenceValue(null); }}>
            <SheetTrigger asChild>
              <button className='flex items-center gap-1.5 rounded-lg bg-[#1a7a45] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'>
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-3.5 w-3.5'
                  aria-hidden
                >
                  <path d='M12 4v16m8-8H4' />
                </svg>
                Nueva revisión
              </button>
            </SheetTrigger>

            {/* ── Add measurement sheet ── */}
            <SheetContent
              side='right'
              className='w-full overflow-y-auto border-zinc-800 bg-white dark:bg-zinc-950 sm:max-w-[420px]'
            >
              <SheetHeader className='mb-7'>
                <SheetTitle className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
                  Nueva revisión
                </SheetTitle>
                <p className='text-sm text-zinc-600 dark:text-zinc-500'>
                  Los campos de medición son opcionales — rellena los que tengas.
                </p>
              </SheetHeader>

              <form ref={formRef} onSubmit={handleSubmit} className='flex flex-col gap-5'>
                <Field
                  label='Fecha'
                  name='recorded_at'
                  type='date'
                  required
                  defaultValue={todayISO()}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <Field
                    label='Peso (kg)'
                    name='weight_kg'
                    placeholder='85.0'
                    min='0'
                    max='600'
                    step='0.1'
                  />
                  <Field
                    label='% Grasa corporal'
                    name='body_fat_pct'
                    placeholder='22.0'
                    min='0'
                    max='100'
                    step='0.1'
                  />
                  <Field
                    label='Masa muscular (kg)'
                    name='muscle_mass_kg'
                    placeholder='65.0'
                    min='0'
                    max='250'
                    step='0.1'
                  />
                  <Field
                    label='Cintura (cm)'
                    name='waist_cm'
                    placeholder='90.0'
                    min='0'
                    max='300'
                    step='0.1'
                  />
                  <Field
                    label='Cadera (cm)'
                    name='hip_cm'
                    placeholder='100.0'
                    min='0'
                    max='300'
                    step='0.1'
                  />
                </div>

                {/* Adherencia al plan */}
                <AdherenceSelector value={adherenceValue} onChange={setAdherenceValue} />

                {/* Nuevo plan generado */}
                <label className='flex items-center gap-2.5 cursor-pointer'>
                  <input
                    type='checkbox'
                    name='new_plan_generated'
                    className='h-4 w-4 rounded border-zinc-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-[#1a7a45] dark:focus:ring-[#1a7a45] dark:focus:ring-offset-zinc-950'
                  />
                  <span className='text-sm text-zinc-600 dark:text-zinc-400'>Se generó un nuevo plan en esta revisión</span>
                </label>

                <div className='flex flex-col gap-1.5'>
                  <label htmlFor='notes' className='text-xs font-medium text-zinc-700 dark:text-zinc-400'>
                    Notas
                  </label>
                  <textarea
                    id='notes'
                    name='notes'
                    rows={3}
                    placeholder='Observaciones de esta revisión...'
                    className='resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-700'
                  />
                </div>

                {formError && (
                  <p className='rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2.5 text-sm text-red-400'>
                    {formError}
                  </p>
                )}

                <div className='flex justify-end gap-3 border-t border-zinc-800 pt-4'>
                  <button
                    type='button'
                    onClick={() => setIsOpen(false)}
                    className='rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    disabled={isPending}
                    className='rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {isPending ? 'Guardando...' : 'Guardar revisión'}
                  </button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Empty state ── */}
        {entries.length === 0 && (
          <EmptyState firstName={firstName} onAdd={() => setIsOpen(true)} />
        )}

        {/* ── Chart ── */}
        {entries.length >= 1 && (
          <div className='rounded-xl border border-zinc-800/50 bg-gray-50 dark:bg-zinc-950/40 p-5'>
            {/* Metric selector — only when multiple metrics have data */}
            {availableMetrics.length > 1 && (
              <div className='mb-5 flex flex-wrap gap-1'>
                {availableMetrics.map((metric) => {
                  const m = METRIC_CONFIG[metric];
                  const isActive = activeMetric === metric;
                  return (
                    <button
                      key={metric}
                      onClick={() => setActiveMetric(metric)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                        isActive ? 'text-white' : 'text-zinc-600 hover:text-zinc-300',
                      )}
                      style={
                        isActive
                          ? { backgroundColor: m.color + '20', color: m.color }
                          : {}
                      }
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            <ResponsiveContainer width='100%' height={240}>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  {METRIC_KEYS.map((m) => {
                    const c = METRIC_CONFIG[m];
                    return (
                      <linearGradient key={m} id={c.gradId} x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%'  stopColor={c.color} stopOpacity={0.14} />
                        <stop offset='95%' stopColor={c.color} stopOpacity={0}    />
                      </linearGradient>
                    );
                  })}
                </defs>

                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='rgba(255,255,255,0.035)'
                  vertical={false}
                />

                <XAxis
                  dataKey='recorded_at'
                  tick={{ fontSize: 11, fill: '#52525b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtShort}
                  dy={6}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: '#52525b' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  width={44}
                />

                <Tooltip
                  content={<ChartTooltip unit={cfg.unit} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
                />

                <Area
                  type='monotone'
                  dataKey={activeMetric}
                  stroke={cfg.color}
                  strokeWidth={2}
                  fill={`url(#${cfg.gradId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: cfg.color,
                    stroke: '#09090b',
                    strokeWidth: 2,
                  }}
                  connectNulls={false}
                  isAnimationActive
                  animationDuration={750}
                  animationEasing='ease-out'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Table ── */}
        {entries.length > 0 && (
          <div>
            <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600'>
              Revisiones registradas
            </p>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-zinc-800/70'>
                    <th className='pb-2.5 pr-6 text-left text-xs font-medium text-zinc-600'>
                      Fecha
                    </th>
                    {hasData.weight_kg && (
                      <th className='pb-2.5 pr-6 text-right text-xs font-medium text-zinc-600'>
                        Peso
                      </th>
                    )}
                    {hasData.body_fat_pct && (
                      <th className='pb-2.5 pr-6 text-right text-xs font-medium text-zinc-600'>
                        Grasa
                      </th>
                    )}
                    {hasData.muscle_mass_kg && (
                      <th className='pb-2.5 pr-6 text-right text-xs font-medium text-zinc-600'>
                        Músculo
                      </th>
                    )}
                    {hasData.waist_cm && (
                      <th className='pb-2.5 pr-6 text-right text-xs font-medium text-zinc-600'>
                        Cintura
                      </th>
                    )}
                    {hasData.hip_cm && (
                      <th className='pb-2.5 pr-6 text-right text-xs font-medium text-zinc-600'>
                        Cadera
                      </th>
                    )}
                    {hasData.adherence && (
                      <th className='pb-2.5 pr-6 text-center text-xs font-medium text-zinc-600'>
                        Adherencia
                      </th>
                    )}
                    {hasData.notes && (
                      <th className='pb-2.5 pr-6 text-left text-xs font-medium text-zinc-600'>
                        Notas
                      </th>
                    )}
                    <th className='pb-2.5 w-8' />
                  </tr>
                </thead>

                <tbody className='divide-y divide-zinc-900'>
                  {tableData.map((entry, idx) => {
                    // Previous entry for trend comparison (next in array because sorted desc)
                    const prev = idx < tableData.length - 1 ? tableData[idx + 1] : null;

                    return (
                      <tr
                        key={entry.id}
                        className='group transition-colors hover:bg-zinc-900/40'
                      >
                        <td className='py-3 pr-6 text-zinc-300'>{fmtShort(entry.recorded_at)}</td>

                        {hasData.weight_kg && (
                          <td className='py-3 pr-6 text-right tabular-nums text-zinc-300'>
                            {entry.weight_kg !== null ? (
                              <>
                                {entry.weight_kg}
                                <span className='ml-0.5 text-[11px] text-zinc-600'>kg</span>
                                <TrendIcon trend={getTrend(entry.weight_kg, prev?.weight_kg ?? null)} inverse />
                              </>
                            ) : (
                              <span className='text-zinc-700'>—</span>
                            )}
                          </td>
                        )}

                        {hasData.body_fat_pct && (
                          <td className='py-3 pr-6 text-right tabular-nums text-zinc-300'>
                            {entry.body_fat_pct !== null ? (
                              <>
                                {entry.body_fat_pct}
                                <span className='ml-0.5 text-[11px] text-zinc-600'>%</span>
                                <TrendIcon trend={getTrend(entry.body_fat_pct, prev?.body_fat_pct ?? null)} inverse />
                              </>
                            ) : (
                              <span className='text-zinc-700'>—</span>
                            )}
                          </td>
                        )}

                        {hasData.muscle_mass_kg && (
                          <td className='py-3 pr-6 text-right tabular-nums text-zinc-300'>
                            {entry.muscle_mass_kg !== null ? (
                              <>
                                {entry.muscle_mass_kg}
                                <span className='ml-0.5 text-[11px] text-zinc-600'>kg</span>
                                <TrendIcon trend={getTrend(entry.muscle_mass_kg, prev?.muscle_mass_kg ?? null)} />
                              </>
                            ) : (
                              <span className='text-zinc-700'>—</span>
                            )}
                          </td>
                        )}

                        {hasData.waist_cm && (
                          <td className='py-3 pr-6 text-right tabular-nums text-zinc-300'>
                            {entry.waist_cm !== null ? (
                              <>
                                {entry.waist_cm}
                                <span className='ml-0.5 text-[11px] text-zinc-600'>cm</span>
                                <TrendIcon trend={getTrend(entry.waist_cm, prev?.waist_cm ?? null)} inverse />
                              </>
                            ) : (
                              <span className='text-zinc-700'>—</span>
                            )}
                          </td>
                        )}

                        {hasData.hip_cm && (
                          <td className='py-3 pr-6 text-right tabular-nums text-zinc-300'>
                            {entry.hip_cm !== null ? (
                              <>
                                {entry.hip_cm}
                                <span className='ml-0.5 text-[11px] text-zinc-600'>cm</span>
                                <TrendIcon trend={getTrend(entry.hip_cm, prev?.hip_cm ?? null)} inverse />
                              </>
                            ) : (
                              <span className='text-zinc-700'>—</span>
                            )}
                          </td>
                        )}

                        {hasData.adherence && (
                          <td className='py-3 pr-6 text-center'>
                            {entry.adherence_score !== null ? (
                              <span className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                ADHERENCE_LABELS[entry.adherence_score]?.bg,
                                ADHERENCE_LABELS[entry.adherence_score]?.color,
                              )}>
                                {entry.adherence_score}/5
                              </span>
                            ) : (
                              <span className='text-zinc-700'>—</span>
                            )}
                          </td>
                        )}

                        {hasData.notes && (
                          <td className='py-3 pr-6 text-zinc-500'>
                            {entry.notes ? (
                              <span className='line-clamp-1' title={entry.notes}>
                                {entry.notes}
                              </span>
                            ) : (
                              <span className='text-zinc-800'>—</span>
                            )}
                          </td>
                        )}

                        {/* Delete */}
                        <td className='py-3 text-right'>
                          {confirmingId === entry.id ? (
                            <div className='flex items-center justify-end gap-2'>
                              <span className='text-[11px] text-zinc-600'>¿Eliminar?</span>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className='text-xs font-medium text-red-400 transition-colors hover:text-red-300'
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className='text-xs text-zinc-600 transition-colors hover:text-zinc-400'
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingId(entry.id)}
                              aria-label='Eliminar medición'
                              className='opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
                            >
                              <svg
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='h-4 w-4 text-zinc-600 transition-colors hover:text-red-400'
                                aria-hidden
                              >
                                <path d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0' />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
