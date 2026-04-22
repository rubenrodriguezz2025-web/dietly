'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { GOAL_LABELS } from '@/types/dietly';

// ── Avatar color — determinista por nombre del paciente ───────────────────────

// 8 tonos pastel claros (color-100 / color-800) para avatares ligeros
const AVATAR_PALETTE = [
  { bg: '#d1fae5', color: '#065f46' },  // emerald (marca)
  { bg: '#dbeafe', color: '#1e40af' },  // blue
  { bg: '#ede9fe', color: '#5b21b6' },  // violet
  { bg: '#ffedd5', color: '#9a3412' },  // orange
  { bg: '#ffe4e6', color: '#9f1239' },  // rose
  { bg: '#e0f2fe', color: '#075985' },  // sky
  { bg: '#ecfccb', color: '#3f6212' },  // lime
  { bg: '#fae8ff', color: '#86198f' },  // fuchsia
] as const;

function getAvatarStyle(name: string): { bg: string; color: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ── Types ──────────────────────────────────────────────────────────────────────

type PlanMeta = { id: string; status: string; created_at: string };

export type PatientWithMeta = {
  id: string;
  name: string;
  email: string | null;
  goal: string | null;
  created_at: string;
  nutrition_plans: PlanMeta[];
  has_pending_reminder: boolean;
};

type FilterId = 'all' | 'active' | 'no_plan' | 'pending_followup';
type SortId = 'recent' | 'name' | 'last_plan';

const ACTIVE_STATUSES = new Set(['draft', 'approved', 'sent']);

function hasActivePlan(p: PatientWithMeta) {
  return p.nutrition_plans.some((pl) => ACTIVE_STATUSES.has(pl.status));
}

// ── PatientsSection ────────────────────────────────────────────────────────────

export function PatientsSection({ patients }: { patients: PatientWithMeta[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [filter, setFilter] = useState<FilterId>((searchParams.get('filter') as FilterId) ?? 'all');
  const [sort, setSort] = useState<SortId>((searchParams.get('sort') as SortId) ?? 'recent');

  function syncURL(q: string, f: FilterId, s: SortId) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (f !== 'all') params.set('filter', f);
    if (s !== 'recent') params.set('sort', s);
    const qs = params.toString();
    router.replace(`/dashboard${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  function handleSearch(q: string) {
    setSearch(q);
    syncURL(q, filter, sort);
  }

  function handleFilter(f: FilterId) {
    setFilter(f);
    syncURL(search, f, sort);
  }

  function handleSort(s: SortId) {
    setSort(s);
    syncURL(search, filter, s);
  }

  // ── Counts for filter chips ───────────────────────────────────────────────

  const counts = useMemo(
    () => ({
      all: patients.length,
      active: patients.filter(hasActivePlan).length,
      no_plan: patients.filter((p) => p.nutrition_plans.length === 0).length,
      pending_followup: patients.filter((p) => p.has_pending_reminder).length,
    }),
    [patients]
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = [...patients];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
      );
    }

    // Filter chip
    if (filter === 'active') result = result.filter(hasActivePlan);
    else if (filter === 'no_plan') result = result.filter((p) => p.nutrition_plans.length === 0);
    else if (filter === 'pending_followup') result = result.filter((p) => p.has_pending_reminder);

    // Sort
    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    } else if (sort === 'last_plan') {
      result.sort((a, b) => {
        const aDate = a.nutrition_plans[0]?.created_at ?? '';
        const bDate = b.nutrition_plans[0]?.created_at ?? '';
        return bDate.localeCompare(aDate);
      });
    }
    // 'recent' = default server order (created_at desc) — no re-sort needed

    return result;
  }, [patients, search, filter, sort]);

  if (patients.length === 0) return <EmptyPatients />;

  return (
    <div className='flex flex-col gap-4'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>Pacientes</h2>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value as SortId)}
          className='rounded-lg border border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-400 focus:border-zinc-600 focus:outline-none'
        >
          <option value='recent'>Más recientes</option>
          <option value='name'>Nombre A-Z</option>
          <option value='last_plan'>Último plan</option>
        </select>
      </div>

      {/* Search bar */}
      <div className='relative'>
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
          className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600'
          aria-hidden='true'
        >
          <circle cx='11' cy='11' r='8' />
          <line x1='21' y1='21' x2='16.65' y2='16.65' />
        </svg>
        <input
          type='search'
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder='Buscar por nombre o email…'
          className='w-full rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-9 pr-9 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 [&::-webkit-search-cancel-button]:hidden'
        />
        {search && (
          <button
            type='button'
            onClick={() => handleSearch('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300'
            aria-label='Limpiar búsqueda'
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className='flex flex-wrap gap-2' role='group' aria-label='Filtros'>
        {(
          [
            { id: 'all', label: 'Todos', count: counts.all },
            { id: 'active', label: 'Con plan activo', count: counts.active },
            { id: 'no_plan', label: 'Sin plan', count: counts.no_plan },
            { id: 'pending_followup', label: 'Con seguimiento pendiente', count: counts.pending_followup },
          ] satisfies { id: FilterId; label: string; count: number }[]
        ).map((chip) => (
          <button
            key={chip.id}
            type='button'
            onClick={() => handleFilter(chip.id)}
            aria-pressed={filter === chip.id}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === chip.id
                ? 'border border-[#1a7a45]/40 bg-[#1a7a45]/15 text-emerald-400'
                : 'border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300',
            ].join(' ')}
          >
            {chip.label}
            <span
              className={[
                'rounded-full px-1.5 py-px text-[10px] tabular-nums',
                filter === chip.id ? 'bg-[#1a7a45]/20 text-emerald-500' : 'bg-gray-100 dark:bg-zinc-900 text-zinc-600',
              ].join(' ')}
            >
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <EmptySearchResult onClear={() => { handleSearch(''); handleFilter('all'); }} />
      ) : (
        <div className='flex flex-col gap-2'>
          {filtered.map((patient) => (
            <PatientRow key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Patient row ────────────────────────────────────────────────────────────────

function tiempoRelativo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`;
  return `hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? 'es' : ''}`;
}

function PatientRow({ patient }: { patient: PatientWithMeta }) {
  const initials = patient.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const avatarStyle = getAvatarStyle(patient.name);

  const latestPlan = patient.nutrition_plans[0];
  const planLabel = latestPlan
    ? latestPlan.status === 'draft'
      ? 'Borrador pendiente'
      : latestPlan.status === 'approved'
        ? 'Aprobado'
        : latestPlan.status === 'sent'
          ? 'Enviado'
          : null
    : null;

  const planLabelColor =
    latestPlan?.status === 'draft'
      ? 'text-amber-400 bg-amber-950/50'
      : latestPlan?.status === 'approved'
        ? 'text-emerald-400 bg-emerald-950/50'
        : latestPlan?.status === 'sent'
          ? 'text-blue-400 bg-blue-950/50'
          : '';

  return (
    <Link
      href={`/dashboard/patients/${patient.id}`}
      className='flex items-center gap-4 rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm dark:shadow-none p-4 transition-all duration-200 hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20'
    >
      <div
        className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold'
        style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}
      >
        {initials}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium text-zinc-100'>{patient.name}</span>
          {patient.has_pending_reminder && (
            <span className='rounded-full bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400'>
              Seguimiento
            </span>
          )}
        </div>
        <div className='flex items-center gap-2 text-sm text-zinc-500'>
          {patient.email && (
            <span className='truncate'>{patient.email}</span>
          )}
          {latestPlan && (
            <>
              {patient.email && <span className='text-zinc-700'>·</span>}
              <span className='flex-shrink-0 text-xs text-zinc-600'>
                {tiempoRelativo(latestPlan.created_at)}
              </span>
            </>
          )}
        </div>
      </div>
      <div className='hidden items-center gap-2 sm:flex'>
        {patient.goal && (
          <span className='rounded-full bg-gray-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-400'>
            {GOAL_LABELS[patient.goal as keyof typeof GOAL_LABELS] ?? patient.goal}
          </span>
        )}
        {planLabel && (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${planLabelColor}`}>
            {planLabel}
          </span>
        )}
      </div>
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

// ── Empty states ───────────────────────────────────────────────────────────────

function EmptySearchResult({ onClear }: { onClear: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-12 text-center'>
      <p className='font-medium text-zinc-400'>Sin resultados</p>
      <p className='mt-1 text-sm text-zinc-600'>Prueba con otro término o elimina los filtros.</p>
      <button
        type='button'
        onClick={onClear}
        className='mt-4 rounded-lg border border-zinc-700 bg-gray-100 dark:bg-zinc-900 px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-gray-200 dark:hover:bg-zinc-800'
      >
        Limpiar filtros
      </button>
    </div>
  );
}

function EmptyPatients() {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center'>
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900'>
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
