'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import type { Meal } from '@/types/dietly';

// ── Constantes ──────────────────────────────────────────────────────────────

const NOMBRE_DIA: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

const NOMBRE_TIPO: Record<string, string> = {
  desayuno: 'Desayuno', media_manana: 'Media mañana',
  almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena',
};

type FilterTab = 'pending' | 'approved' | 'rejected';

type SwapRow = {
  id: string;
  plan_id: string;
  day_number: number;
  meal_index: number;
  original_meal: Meal;
  selected_meal: Meal;
  status: 'pending' | 'approved' | 'rejected';
  initiated_by: 'patient' | 'nutritionist';
  reason: string | null;
  created_at: string;
  patient_name: string;
  is_stale: boolean;
};

type Props = {
  swaps: SwapRow[];
};

function sign(n: number): string {
  return (n > 0 ? '+' : '') + n;
}

export function IntercambiosList({ swaps: initialSwaps }: Props) {
  const [swaps, setSwaps] = useState(initialSwaps);
  const [tab, setTab] = useState<FilterTab>('pending');
  const router = useRouter();

  const counts = {
    pending: swaps.filter((s) => s.status === 'pending').length,
    approved: swaps.filter((s) => s.status === 'approved').length,
    rejected: swaps.filter((s) => s.status === 'rejected').length,
  };

  const filtered = swaps.filter((s) => s.status === tab);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobados' },
    { key: 'rejected', label: 'Rechazados' },
  ];

  return (
    <div>
      {/* Filtros */}
      <div className='mb-4 flex gap-1.5'>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-[#1a7a45]/20 text-emerald-400'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
                key === 'pending' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-16'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/50'>
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#71717a' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
              <polyline points='17 1 21 5 17 9' />
              <path d='M3 11V9a4 4 0 014-4h14' />
              <polyline points='7 23 3 19 7 15' />
              <path d='M21 13v2a4 4 0 01-4 4H3' />
            </svg>
          </div>
          <p className='text-sm text-zinc-500'>
            {tab === 'pending' ? 'No hay intercambios pendientes.' :
             tab === 'approved' ? 'No hay intercambios aprobados.' :
             'No hay intercambios rechazados.'}
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {filtered.map((swap) => (
            <SwapCard
              key={swap.id}
              swap={swap}
              onActionComplete={(id, newStatus) => {
                setSwaps((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
                );
                router.refresh();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SwapCard ─────────────────────────────────────────────────────────────────

function SwapCard({
  swap,
  onActionComplete,
}: {
  swap: SwapRow;
  onActionComplete: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const original = swap.original_meal;
  const selected = swap.selected_meal;

  const diffKcal = selected.calories - original.calories;
  const diffP = selected.macros.protein_g - original.macros.protein_g;
  const diffC = selected.macros.carbs_g - original.macros.carbs_g;
  const diffG = selected.macros.fat_g - original.macros.fat_g;

  function handleAction(action: 'approve' | 'reject') {
    setActionError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/plans/swap-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swap_id: swap.id, action }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Error al procesar');
        }

        onActionComplete(swap.id, action === 'approve' ? 'approved' : 'rejected');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Error inesperado');
      }
    });
  }

  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-900/50 p-4'>
      {/* Header */}
      <div className='mb-3 flex items-start justify-between'>
        <div className='flex flex-col gap-0.5'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-zinc-200'>
              {swap.patient_name}
            </span>
            <span className='text-zinc-700'>·</span>
            <span className='text-xs font-medium text-zinc-500'>
              {NOMBRE_DIA[swap.day_number] ?? `Día ${swap.day_number}`}
            </span>
            <span className='text-zinc-700'>·</span>
            <span className='text-xs font-medium text-zinc-500'>
              {NOMBRE_TIPO[original.meal_type] ?? original.meal_type}
            </span>
          </div>
          <time className='text-[11px] text-zinc-600'>
            {new Date(swap.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
        <div className='flex items-center gap-1.5'>
          {swap.status === 'pending' && swap.is_stale && (
            <span className='rounded-full bg-red-950/40 px-2 py-0.5 text-[10px] font-medium text-red-400'>
              Pendiente +48h
            </span>
          )}
          {swap.initiated_by === 'nutritionist' && (
            <span className='rounded-full bg-blue-950/40 px-2 py-0.5 text-[10px] font-medium text-blue-400'>
              Por ti
            </span>
          )}
        </div>
      </div>

      {/* Original → Sugerido */}
      <div className='flex items-center gap-3'>
        <div className='flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5'>
          <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600'>
            Original
          </p>
          <p className='text-sm font-medium text-zinc-300'>
            {original.meal_name}
          </p>
          <p className='mt-1 text-xs tabular-nums text-zinc-500'>
            {original.calories} kcal · P{original.macros.protein_g} C{original.macros.carbs_g} G{original.macros.fat_g}
          </p>
        </div>

        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#3f3f46' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='flex-shrink-0'>
          <path d='M5 12h14M12 5l7 7-7 7' />
        </svg>

        <div className='flex-1 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2.5'>
          <p className='mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700'>
            Sugerido
          </p>
          <p className='text-sm font-medium text-zinc-200'>
            {selected.meal_name}
          </p>
          <p className='mt-1 text-xs tabular-nums text-zinc-500'>
            {selected.calories} kcal · P{selected.macros.protein_g} C{selected.macros.carbs_g} G{selected.macros.fat_g}
          </p>
        </div>
      </div>

      {/* Diferencia de macros */}
      <p className='mt-2 text-[11px] tabular-nums text-zinc-600'>
        {sign(diffKcal)} kcal · {sign(diffP)}g P · {sign(diffC)}g C · {sign(diffG)}g G
      </p>

      {/* Motivo del paciente */}
      {swap.reason && (
        <p className='mt-2 text-xs italic text-zinc-500'>
          &ldquo;{swap.reason}&rdquo;
        </p>
      )}

      {/* Error */}
      {actionError && (
        <p className='mt-2 text-xs text-red-400'>{actionError}</p>
      )}

      {/* Botones aprobar/rechazar (solo pendientes) */}
      {swap.status === 'pending' && (
        <div className='mt-3 flex items-center gap-2'>
          <button
            type='button'
            onClick={() => handleAction('approve')}
            disabled={isPending}
            className='flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50'
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <polyline points='20 6 9 17 4 12' />
            </svg>
            Aprobar
          </button>
          <button
            type='button'
            onClick={() => handleAction('reject')}
            disabled={isPending}
            className='flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3.5 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50'
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M18 6L6 18M6 6l12 12' />
            </svg>
            Rechazar
          </button>
          {isPending && (
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300' />
          )}
        </div>
      )}

      {/* Estado final */}
      {swap.status === 'approved' && (
        <div className='mt-3 flex items-center gap-1.5 text-xs text-emerald-400'>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='20 6 9 17 4 12' />
          </svg>
          Aprobado — el plan del paciente ha sido actualizado
        </div>
      )}
      {swap.status === 'rejected' && (
        <div className='mt-3 flex items-center gap-1.5 text-xs text-red-400'>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M18 6L6 18M6 6l12 12' />
          </svg>
          Rechazado — el plato original se mantiene
        </div>
      )}
    </div>
  );
}
