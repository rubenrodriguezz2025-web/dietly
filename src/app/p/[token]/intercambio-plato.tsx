'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Meal } from '@/types/dietly';

// ── Tipos ────────────────────────────────────────────────────────────────────

type SwapState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'choosing'; alternatives: Meal[]; originalMeal: Meal }
  | { phase: 'confirming'; selectedIndex: number; alternatives: Meal[]; originalMeal: Meal }
  | { phase: 'success'; selectedMeal: Meal }
  | { phase: 'error'; message: string };

type Props = {
  planId: string;
  patientToken: string;
  dayNumber: number;
  mealIndex: number;
  meal: Meal;
  primaryColor: string;
  onSwapComplete: (dayNumber: number, mealIndex: number) => void;
};

// ── Componente principal ─────────────────────────────────────────────────────

export function IntercambioPlato({
  planId,
  patientToken,
  dayNumber,
  mealIndex,
  meal,
  primaryColor,
  onSwapComplete,
}: Props) {
  const [state, setState] = useState<SwapState>({ phase: 'idle' });
  const [sheetVisible, setSheetVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const open = state.phase !== 'idle';

  // Animación de cierre
  const closeSheet = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setSheetVisible(false);
      setClosing(false);
      setState({ phase: 'idle' });
    }, 280);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    if (!sheetVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sheetVisible, closeSheet]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── Pedir alternativas ──────────────────────────────────────────────────────

  async function requestAlternatives() {
    setState({ phase: 'loading' });
    setSheetVisible(true);
    setClosing(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/plans/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          day_number: dayNumber,
          meal_index: mealIndex,
          patient_token: patientToken,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error al generar alternativas');
      }

      const data = await res.json();
      setState({
        phase: 'choosing',
        alternatives: data.alternatives,
        originalMeal: data.original_meal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Error inesperado',
      });
    }
  }

  // ── Confirmar selección ────────────────────────────────────────────────────

  async function confirmSwap(selectedIndex: number) {
    if (state.phase !== 'choosing') return;
    const { alternatives, originalMeal } = state;
    const selectedMeal = alternatives[selectedIndex];

    setState({ phase: 'confirming', selectedIndex, alternatives, originalMeal });

    try {
      const res = await fetch('/api/plans/confirm-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          patient_token: patientToken,
          day_number: dayNumber,
          meal_index: mealIndex,
          selected_meal: selectedMeal,
          original_meal: originalMeal,
          alternatives,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error al confirmar el cambio');
      }

      setState({ phase: 'success', selectedMeal });

      // Notificar al padre para actualizar UI (marca como pending)
      onSwapComplete(dayNumber, mealIndex);

      // Cerrar tras 1.5s de feedback visual
      setTimeout(closeSheet, 1500);
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Error al guardar',
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Botón "Cambiar este plato" */}
      <button
        type="button"
        onClick={requestAlternatives}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-200 active:scale-[0.98]"
        style={{
          background: 'var(--chip-off)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
        No me apetece este plato
      </button>
      <p className="mt-1.5 text-center text-[10px] leading-snug" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        Los cambios requieren aprobación de tu nutricionista. Las alternativas mantienen calorías y macros similares.
      </p>

      {/* Bottom Sheet Overlay */}
      {sheetVisible && (
        <div
          className={`fixed inset-0 z-50 ${closing ? 'pwa-swap-backdrop-out' : 'pwa-swap-backdrop-in'}`}
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={closeSheet}
        >
          <div
            className={`absolute bottom-0 left-0 right-0 mx-auto max-w-lg rounded-t-3xl ${closing ? 'pwa-swap-sheet-out' : 'pwa-swap-sheet-in'}`}
            style={{ background: 'var(--bg)', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            <div className="px-5 pb-8">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  {state.phase === 'loading'
                    ? 'Buscando alternativas...'
                    : state.phase === 'success'
                      ? 'Sugerencia enviada'
                      : state.phase === 'error'
                        ? 'Error'
                        : 'Elige una alternativa'}
                </h3>
                <button
                  onClick={closeSheet}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ background: 'var(--chip-off)', color: 'var(--text-muted)' }}
                  aria-label="Cerrar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Loading */}
              {state.phase === 'loading' && (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div
                    className="h-10 w-10 animate-spin rounded-full border-[3px] border-current border-t-transparent"
                    style={{ color: primaryColor }}
                  />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Buscando alternativas equivalentes...
                  </p>
                </div>
              )}

              {/* Alternativas */}
              {(state.phase === 'choosing' || state.phase === 'confirming') && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Alternativas para <span className="font-semibold" style={{ color: 'var(--text)' }}>{meal.meal_name}</span> ({meal.calories} kcal)
                  </p>
                  <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--chip-off)', border: '1px solid var(--border)' }}>
                    <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Estas alternativas tienen calorías y macros equivalentes. Tu nutricionista revisará el cambio antes de aplicarlo.
                    </p>
                  </div>

                  {state.alternatives.map((alt, i) => {
                    const isSelected = state.phase === 'confirming' && state.selectedIndex === i;
                    const isDisabled = state.phase === 'confirming' && state.selectedIndex !== i;

                    return (
                      <button
                        key={i}
                        onClick={() => state.phase === 'choosing' && confirmSwap(i)}
                        disabled={state.phase === 'confirming'}
                        className="rounded-2xl p-4 text-left transition-all duration-200"
                        style={{
                          background: isSelected ? `${primaryColor}18` : 'var(--card)',
                          border: `1.5px solid ${isSelected ? primaryColor : 'var(--border)'}`,
                          opacity: isDisabled ? 0.4 : 1,
                          transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        }}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h4 className="text-[14px] font-bold leading-snug" style={{ color: 'var(--text)' }}>
                            {alt.meal_name}
                          </h4>
                          <span
                            className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums"
                            style={{ background: 'var(--kcal-bg)', color: 'var(--kcal-fg)' }}
                          >
                            {alt.calories} kcal
                          </span>
                        </div>

                        {/* Macros */}
                        <div className="mb-2 flex gap-1.5">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--chip-protein-bg)', color: 'var(--chip-protein-fg)' }}>
                            {alt.macros.protein_g}g P
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--chip-carbs-bg)', color: 'var(--chip-carbs-fg)' }}>
                            {alt.macros.carbs_g}g C
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--chip-fat-bg)', color: 'var(--chip-fat-fg)' }}>
                            {alt.macros.fat_g}g G
                          </span>
                        </div>

                        {/* Ingredientes resumidos */}
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {alt.ingredients.map((ing) => ing.name).join(', ')}
                        </p>

                        {/* Indicador de selección */}
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-2">
                            <div
                              className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                              style={{ color: primaryColor }}
                            />
                            <span className="text-xs font-medium" style={{ color: primaryColor }}>
                              Enviando sugerencia...
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Success */}
              {state.phase === 'success' && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full pwa-swap-check-in"
                    style={{ background: '#fef3c722' }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-center text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {state.selectedMeal.meal_name}
                  </p>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Sugerencia enviada. Tu nutricionista la revisará y aprobará o rechazará.
                  </p>
                </div>
              )}

              {/* Error */}
              {state.phase === 'error' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                  <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {state.message}
                  </p>
                  <button
                    onClick={() => { closeSheet(); setTimeout(requestAlternatives, 350); }}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                    style={{ background: primaryColor }}
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
