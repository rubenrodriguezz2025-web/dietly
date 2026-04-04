'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Meal, PlanDay } from '@/types/dietly';

import { IntercambioPlato } from './intercambio-plato';

// ── Constantes de estilos por tipo de comida ──────────────────────────────────

const ACENTO_TIPO: Record<string, { borde: string; etiqueta: string; emoji: string }> = {
  desayuno:     { borde: '#f59e0b', etiqueta: '#b45309', emoji: '☀️' },
  media_manana: { borde: '#f97316', etiqueta: '#c2410c', emoji: '🍎' },
  almuerzo:     { borde: '#10b981', etiqueta: '#047857', emoji: '🍽️' },
  merienda:     { borde: '#8b5cf6', etiqueta: '#6d28d9', emoji: '🫐' },
  cena:         { borde: '#3b82f6', etiqueta: '#1d4ed8', emoji: '🌙' },
};

const NOMBRE_TIPO: Record<string, string> = {
  desayuno:     'Desayuno',
  media_manana: 'Media mañana',
  almuerzo:     'Almuerzo',
  merienda:     'Merienda',
  cena:         'Cena',
};

// ── VisorDias ─────────────────────────────────────────────────────────────────

type Props = {
  days: PlanDay[];
  initialDay: number;
  showMacros: boolean;
  primaryColor: string;
  planId: string;
  patientToken: string;
  allowSwaps?: boolean;
};

export function VisorDias({ days: initialDays, initialDay, showMacros, primaryColor, planId, patientToken, allowSwaps = true }: Props) {
  // Estado local mutable de los días — se actualiza al confirmar un intercambio
  const [days, setDays] = useState(initialDays);
  const [currentDay, setCurrentDay] = useState(initialDay);
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right');
  const touchStartX = useRef<number | null>(null);
  const mealsContainerRef = useRef<HTMLDivElement>(null);

  // Tracking de comidas intercambiadas — key: "day-mealIndex"
  const [swappedMeals, setSwappedMeals] = useState<Set<string>>(new Set());

  const diaData = days.find((d) => d.day_number === currentDay) ?? days[0];

  // Callback cuando se confirma un intercambio
  const handleSwapComplete = useCallback(
    (dayNum: number, mealIdx: number, _newMeal: Meal, updatedDay: PlanDay) => {
      setDays((prev) =>
        prev.map((d) => (d.day_number === dayNum ? updatedDay : d)),
      );
      setSwappedMeals((prev) => new Set(prev).add(`${dayNum}-${mealIdx}`));
    },
    [],
  );

  // Actualizar hash de URL al cambiar de día (back button funciona)
  useEffect(() => {
    window.history.replaceState(null, '', `#dia-${currentDay}`);
  }, [currentDay]);


  const goToDay = useCallback(
    (newDay: number, dir: 'left' | 'right') => {
      if (newDay < 1 || newDay > days.length) return;
      setAnimDir(dir);
      setCurrentDay(newDay);
      setAnimKey((k) => k + 1);
    },
    [days.length]
  );

  // ── Touch events (swipe nativo) ────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) {
      goToDay(currentDay + 1, 'right'); // swipe izquierda → día siguiente
    } else {
      goToDay(currentDay - 1, 'left');  // swipe derecha → día anterior
    }
  };

  return (
    <>
      {/* ── Nav sticky de días ───────────────────────────────────────────── */}
      <div
        className='sticky top-0 z-10 -mx-4 px-4 pt-3 pb-1 backdrop-blur-md'
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--nav-bg)' }}
      >
        <nav className='-mx-1 overflow-x-auto px-1'>
          <div className='flex gap-1.5 pb-1' style={{ width: 'max-content' }}>
            {days.map((d) => {
              const activo = d.day_number === currentDay;
              return (
                <button
                  key={d.day_number}
                  onClick={() =>
                    goToDay(d.day_number, d.day_number > currentDay ? 'right' : 'left')
                  }
                  className='whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200'
                  style={
                    activo
                      ? { background: primaryColor, color: '#fff' }
                      : { background: 'var(--chip-off)', color: 'var(--text-muted)' }
                  }
                >
                  {d.day_name.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── Contenido del día con swipe ──────────────────────────────────── */}
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Cabecera del día */}
        <div className='mb-4 mt-5 flex items-center gap-2'>
          {/* Flecha anterior — solo tablet/desktop */}
          <button
            className='hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors sm:flex'
            style={{
              background: 'var(--card)',
              color: 'var(--text-muted)',
              opacity: currentDay <= 1 ? 0.3 : 1,
              border: '1px solid var(--border)',
            }}
            onClick={() => goToDay(currentDay - 1, 'left')}
            disabled={currentDay <= 1}
            aria-label='Día anterior'
          >
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polyline points='15 18 9 12 15 6' />
            </svg>
          </button>

          {/* Nombre + macros del día — animados en cada cambio */}
          <div
            key={animKey}
            className='flex flex-1 items-center justify-between'
            style={{ animation: `pwa-slide-${animDir} 0.28s ease both` }}
          >
            <div className='flex flex-col'>
              <h2 className='text-xl font-extrabold' style={{ color: 'var(--text)' }}>
                {diaData.day_name}
              </h2>
              {diaData.day_theme && (
                <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                  {diaData.day_theme}
                </span>
              )}
            </div>
            {showMacros && (
              <div
                className='flex items-center gap-1.5 rounded-full px-3 py-1.5'
                style={{
                  background: 'var(--kcal-bg)',
                  border: '1px solid var(--kcal-border)',
                }}
              >
                <span
                  className='text-sm font-bold tabular-nums'
                  style={{ color: 'var(--kcal-fg)' }}
                >
                  {diaData.total_calories}
                </span>
                <span
                  className='text-xs font-medium'
                  style={{ color: 'var(--kcal-fg)', opacity: 0.8 }}
                >
                  kcal
                </span>
                <span style={{ color: 'var(--border)' }} className='mx-0.5'>
                  ·
                </span>
                <span className='text-xs' style={{ color: 'var(--kcal-fg)', opacity: 0.8 }}>
                  {diaData.total_macros.protein_g}P {diaData.total_macros.carbs_g}C{' '}
                  {diaData.total_macros.fat_g}G
                </span>
              </div>
            )}
          </div>

          {/* Flecha siguiente — solo tablet/desktop */}
          <button
            className='hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors sm:flex'
            style={{
              background: 'var(--card)',
              color: 'var(--text-muted)',
              opacity: currentDay >= days.length ? 0.3 : 1,
              border: '1px solid var(--border)',
            }}
            onClick={() => goToDay(currentDay + 1, 'right')}
            disabled={currentDay >= days.length}
            aria-label='Día siguiente'
          >
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polyline points='9 18 15 12 9 6' />
            </svg>
          </button>
        </div>

        {/* Tarjetas de comida — animadas */}
        <div
          ref={mealsContainerRef}
          key={`meals-${animKey}`}
          className='flex flex-col gap-3'
          style={{ animation: `pwa-slide-${animDir} 0.28s ease both` }}
        >
          {diaData.meals.map((comida, i) => (
            <TarjetaComida
              key={`${currentDay}-${i}`}
              comida={comida}
              showMacros={showMacros}
              delay={i * 0.055}
              swapped={swappedMeals.has(`${currentDay}-${i}`)}
              swapButton={
                allowSwaps ? (
                  <IntercambioPlato
                    planId={planId}
                    patientToken={patientToken}
                    dayNumber={currentDay}
                    mealIndex={i}
                    meal={comida}
                    primaryColor={primaryColor}
                    onSwapComplete={handleSwapComplete}
                  />
                ) : null
              }
            />
          ))}
        </div>
      </div>

      {/* ── Dots indicadores + flechas en mobile ────────────────────────── */}
      <div className='mt-8 flex items-center justify-center gap-3'>
        {/* Flecha izquierda — solo mobile, siempre visible */}
        <button
          className='flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:hidden'
          style={{
            background: 'var(--card)',
            color: 'var(--text-muted)',
            opacity: currentDay <= 1 ? 0.3 : 1,
            border: '1px solid var(--border)',
          }}
          onClick={() => goToDay(currentDay - 1, 'left')}
          disabled={currentDay <= 1}
          aria-label='Día anterior'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='15 18 9 12 15 6' />
          </svg>
        </button>

        {/* Dots */}
        <div className='flex items-center gap-2'>
          {days.map((d) => {
            const activo = d.day_number === currentDay;
            return (
              <button
                key={d.day_number}
                onClick={() =>
                  goToDay(d.day_number, d.day_number > currentDay ? 'right' : 'left')
                }
                aria-label={d.day_name}
                className='rounded-full transition-all duration-300'
                style={{
                  width: activo ? '20px' : '8px',
                  height: '8px',
                  background: activo ? primaryColor : 'var(--dot-off)',
                }}
              />
            );
          })}
        </div>

        {/* Flecha derecha — solo mobile */}
        <button
          className='flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:hidden'
          style={{
            background: 'var(--card)',
            color: 'var(--text-muted)',
            opacity: currentDay >= days.length ? 0.3 : 1,
            border: '1px solid var(--border)',
          }}
          onClick={() => goToDay(currentDay + 1, 'right')}
          disabled={currentDay >= days.length}
          aria-label='Día siguiente'
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='9 18 15 12 9 6' />
          </svg>
        </button>
      </div>
    </>
  );
}

// ── TarjetaComida ─────────────────────────────────────────────────────────────

function TarjetaComida({
  comida,
  showMacros,
  delay,
  swapped,
  swapButton,
}: {
  comida: Meal;
  showMacros: boolean;
  delay: number;
  swapped: boolean;
  swapButton: React.ReactNode | null;
}) {
  const acento = ACENTO_TIPO[comida.meal_type] ?? { borde: '#16a34a', etiqueta: '#15803d', emoji: '🍴' };

  return (
    <article
      className='overflow-hidden rounded-2xl shadow-sm'
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        animationDelay: `${delay}s`,
      }}
    >
      {/* Banda de color por tipo */}
      <div className='h-[3px] w-full' style={{ background: acento.borde }} />

      {/* Cabecera de comida */}
      <div className='flex items-start justify-between gap-3 px-4 pb-2 pt-3.5'>
        <div className='min-w-0 flex-1'>
          <div className='mb-0.5 flex items-center gap-1.5'>
            <p
              className='text-[10px] font-bold uppercase tracking-widest'
              style={{ color: acento.etiqueta }}
            >
              <span className='mr-1 text-sm not-italic' aria-hidden='true'>{acento.emoji}</span>
              {NOMBRE_TIPO[comida.meal_type] ?? comida.meal_type}
              {comida.time_suggestion && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {' '}· {comida.time_suggestion}
                </span>
              )}
            </p>
            {swapped && (
              <span
                className='rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide'
                style={{ background: 'var(--kcal-bg)', color: 'var(--kcal-fg)' }}
              >
                Cambiado
              </span>
            )}
          </div>
          <h3
            className='text-[15px] font-bold leading-snug'
            style={{ color: 'var(--text)' }}
          >
            {comida.meal_name}
          </h3>
        </div>

        {showMacros && (
          <div
            className='flex-shrink-0 rounded-xl px-3 py-2 text-center'
            style={{ background: 'var(--kcal-bg)' }}
          >
            <p
              className='text-base font-extrabold leading-none tabular-nums'
              style={{ color: 'var(--kcal-fg)' }}
            >
              {comida.calories}
            </p>
            <p
              className='mt-0.5 text-[9px] font-bold uppercase tracking-wide'
              style={{ color: 'var(--kcal-fg)', opacity: 0.75 }}
            >
              kcal
            </p>
          </div>
        )}
      </div>

      {/* Macros en píldoras */}
      {showMacros && (
        <div className='flex gap-1.5 px-4 pb-3'>
          <MacroChip
            valor={comida.macros.protein_g}
            etiqueta='P'
            bgVar='--chip-protein-bg'
            colorVar='--chip-protein-fg'
          />
          <MacroChip
            valor={comida.macros.carbs_g}
            etiqueta='C'
            bgVar='--chip-carbs-bg'
            colorVar='--chip-carbs-fg'
          />
          <MacroChip
            valor={comida.macros.fat_g}
            etiqueta='G'
            bgVar='--chip-fat-bg'
            colorVar='--chip-fat-fg'
          />
        </div>
      )}

      {/* Ingredientes — visibles directamente sin clic */}
      {comida.ingredients.length > 0 && (
        <div className='px-4 py-3' style={{ borderTop: '1px solid var(--border)' }}>
          <p
            className='mb-2 text-[10px] font-bold uppercase tracking-widest'
            style={{ color: 'var(--text-muted)' }}
          >
            Ingredientes
          </p>
          <ul className='flex flex-wrap gap-1.5'>
            {comida.ingredients.map((ing, i) => (
              <li
                key={i}
                className='rounded-full px-2.5 py-1 text-[12px] font-medium'
                style={{
                  background: 'var(--chip-off)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {ing.name}{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preparación */}
      {comida.preparation && (
        <div
          className='px-4 py-3'
          style={{ borderTop: '1px solid var(--border)', background: 'var(--card2)' }}
        >
          <p
            className='mb-1.5 text-[10px] font-bold uppercase tracking-widest'
            style={{ color: 'var(--text-muted)' }}
          >
            Preparación
          </p>
          <p
            className='text-[13px] leading-relaxed'
            style={{ color: 'var(--text-muted)' }}
          >
            {comida.preparation}
          </p>
        </div>
      )}

      {/* Botón intercambio */}
      {swapButton && (
        <div className='px-4 py-3' style={{ borderTop: '1px solid var(--border)' }}>
          {swapButton}
        </div>
      )}
    </article>
  );
}

// ── MacroChip ─────────────────────────────────────────────────────────────────

function MacroChip({
  valor,
  etiqueta,
  bgVar,
  colorVar,
}: {
  valor: number;
  etiqueta: string;
  bgVar: string;
  colorVar: string;
}) {
  return (
    <span
      className='inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums'
      style={{ background: `var(${bgVar})`, color: `var(${colorVar})` }}
    >
      {valor}g<span className='text-[10px] font-semibold opacity-70'>{etiqueta}</span>
    </span>
  );
}
