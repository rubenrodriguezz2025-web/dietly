'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import type { Ingredient, Meal, PlanDay } from '@/types/dietly';

import { recalculateMealMacros, updateDay } from './actions';
import { RegenerateDayButton } from './regenerate-day-button';

const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
      <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
    </svg>
  );
}

function CheckIcon({ size = 10 }: { size?: number }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <polyline points='20 6 9 17 4 12' />
    </svg>
  );
}

function XIcon({ size = 10 }: { size?: number }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  );
}

// ── Editable primitives ───────────────────────────────────────────────────────

/** Single-line editable text. Confirm-only (parent state updates on confirm). */
function EditableField({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function confirm() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <span className='inline-flex items-center gap-1.5'>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              confirm();
            }
            if (e.key === 'Escape') cancel();
          }}
          className={`min-w-[80px] rounded border border-[#1a7a45]/60 bg-zinc-900 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a7a45] ${className}`}
        />
        <button
          type='button'
          onClick={confirm}
          title='Confirmar (Enter)'
          className='flex-shrink-0 rounded p-0.5 text-emerald-400 transition-colors hover:bg-emerald-500/10'
        >
          <CheckIcon />
        </button>
        <button
          type='button'
          onClick={cancel}
          title='Cancelar (Esc)'
          className='flex-shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300'
        >
          <XIcon />
        </button>
      </span>
    );
  }

  return (
    <button
      type='button'
      onClick={startEdit}
      className={`group/edit inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-zinc-800/80 ${className}`}
    >
      {value || <span className='italic text-zinc-600'>—</span>}
      <span className='flex-shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover/edit:opacity-100'>
        <PencilIcon size={10} />
      </span>
    </button>
  );
}

/** Numeric editable field. Calls `onQuantityChanged` (if provided) when confirmed with a different value. */
function EditableNumber({
  value,
  onChange,
  unit,
  bold,
  onQuantityChanged,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  bold?: boolean;
  onQuantityChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    setDraft(String(value));
    setEditing(true);
  }

  function confirm() {
    const n = Number(draft);
    if (!isNaN(n) && n >= 0) {
      if (onQuantityChanged && n !== value) onQuantityChanged();
      onChange(n);
    }
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <span className='inline-flex items-center gap-1'>
        <input
          autoFocus
          type='number'
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
          }}
          className='w-14 rounded border border-[#1a7a45]/60 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]'
        />
        <button
          type='button'
          onClick={confirm}
          title='Confirmar (Enter)'
          className='flex-shrink-0 rounded p-0.5 text-emerald-400 transition-colors hover:bg-emerald-500/10'
        >
          <CheckIcon />
        </button>
        <button
          type='button'
          onClick={cancel}
          title='Cancelar (Esc)'
          className='flex-shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300'
        >
          <XIcon />
        </button>
      </span>
    );
  }

  return (
    <button
      type='button'
      onClick={startEdit}
      className={`group/edit inline-flex cursor-pointer items-center gap-1 rounded px-0.5 py-0.5 transition-colors hover:bg-zinc-800/80 ${bold ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}
    >
      {value}
      {unit && <span className='ml-0.5 text-zinc-600'>{unit}</span>}
      <span className='flex-shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover/edit:opacity-100'>
        <PencilIcon size={9} />
      </span>
    </button>
  );
}

/** Multi-line editable area. Uses explicit Confirmar/Cancelar buttons (Enter adds newlines). */
function EditableArea({
  value,
  onChange,
  placeholder = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function confirm() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <div>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && cancel()}
          rows={4}
          placeholder={placeholder}
          className='w-full resize-none rounded-lg border border-[#1a7a45]/60 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]'
        />
        <div className='mt-1.5 flex justify-end gap-1.5'>
          <button
            type='button'
            onClick={cancel}
            className='rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={confirm}
            className='rounded-md border border-[#1a7a45]/40 bg-[#1a7a45]/20 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-[#1a7a45]/30'
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type='button'
      onClick={startEdit}
      className='group/edit relative w-full cursor-pointer rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-zinc-800 hover:bg-zinc-900/50'
    >
      <span className='block leading-relaxed'>
        {value || <span className='italic text-zinc-700'>{placeholder || '—'}</span>}
      </span>
      <span className='absolute right-2 top-2 text-zinc-600 opacity-0 transition-opacity group-hover/edit:opacity-100'>
        <PencilIcon size={10} />
      </span>
    </button>
  );
}

// ── Ingredient row ────────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  onChange,
  onQuantityChanged,
}: {
  ingredient: Ingredient;
  onChange: (updated: Ingredient) => void;
  onQuantityChanged?: () => void;
}) {
  return (
    <li className='flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs'>
      <EditableField
        value={ingredient.name}
        onChange={(name) => onChange({ ...ingredient, name })}
        className='text-zinc-400'
      />
      <EditableNumber
        value={ingredient.quantity}
        onQuantityChanged={onQuantityChanged}
        onChange={(quantity) => onChange({ ...ingredient, quantity })}
      />
      <EditableField
        value={ingredient.unit}
        onChange={(unit) => onChange({ ...ingredient, unit })}
        className='text-zinc-600'
      />
    </li>
  );
}

// ── Meal editor ───────────────────────────────────────────────────────────────

function MealEditor({
  meal,
  isInvalid,
  isDraft,
  planId,
  onChange,
}: {
  meal: Meal;
  isInvalid: boolean;
  isDraft: boolean;
  planId: string;
  onChange: (updated: Meal) => void;
}) {
  const [isRecalculating, startRecalc] = useTransition();
  const [recalcError, setRecalcError] = useState<string | null>(null);
  const [macrosDirty, setMacrosDirty] = useState(false);

  function handleIngredientChange(i: number, updated: Ingredient) {
    onChange({
      ...meal,
      ingredients: meal.ingredients.map((x, j) => (j === i ? updated : x)),
    });
  }

  function handleRecalculate() {
    setRecalcError(null);
    startRecalc(async () => {
      const result = await recalculateMealMacros(planId, meal);
      if (result.error) {
        setRecalcError(result.error);
      } else {
        setMacrosDirty(false);
        onChange({ ...meal, calories: result.calories!, macros: result.macros! });
      }
    });
  }

  return (
    <div className={`px-5 py-4 ${isInvalid ? 'bg-red-950/20' : ''}`}>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            {isInvalid && (
              <span className='rounded bg-red-900 px-1.5 py-0.5 text-xs font-medium text-red-300'>
                Error
              </span>
            )}
            <span className='text-xs font-medium uppercase tracking-wider text-zinc-600'>
              {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
            </span>
            {meal.time_suggestion && (
              <span className='text-xs text-zinc-700'>{meal.time_suggestion}</span>
            )}
          </div>
          {/* Nombre de la comida — editable */}
          <h4 className='mt-1 font-medium'>
            <EditableField
              value={meal.meal_name}
              onChange={(meal_name) => onChange({ ...meal, meal_name })}
              className='text-zinc-100'
            />
          </h4>
        </div>

        {/* Macros — editables */}
        <div className='flex flex-col items-end gap-1.5'>
          <div className='flex flex-shrink-0 gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs'>
            <EditableNumber
              value={meal.calories}
              unit='kcal'
              bold
              onChange={(calories) => onChange({ ...meal, calories })}
            />
            <span className='text-zinc-700'>|</span>
            <EditableNumber
              value={meal.macros.protein_g}
              unit='P'
              onChange={(protein_g) =>
                onChange({ ...meal, macros: { ...meal.macros, protein_g } })
              }
            />
            <EditableNumber
              value={meal.macros.carbs_g}
              unit='C'
              onChange={(carbs_g) =>
                onChange({ ...meal, macros: { ...meal.macros, carbs_g } })
              }
            />
            <EditableNumber
              value={meal.macros.fat_g}
              unit='G'
              onChange={(fat_g) =>
                onChange({ ...meal, macros: { ...meal.macros, fat_g } })
              }
            />
          </div>

          {/* Badge macros pendientes / botón recalcular */}
          {isDraft && macrosDirty && (
            <button
              type='button'
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className='flex items-center gap-1.5 rounded-full border border-amber-800/50 bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 transition-colors hover:border-amber-700/60 hover:bg-amber-950/60 disabled:opacity-60'
            >
              {isRecalculating ? (
                <span className='h-2.5 w-2.5 animate-spin rounded-full border border-amber-500/40 border-t-amber-400' />
              ) : (
                <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2' />
                </svg>
              )}
              Macros pendientes de recalcular
            </button>
          )}

          {isDraft && !macrosDirty && (
            <button
              type='button'
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className='flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-emerald-500 disabled:opacity-50'
            >
              {isRecalculating ? (
                <span className='inline-block h-2.5 w-2.5 animate-spin rounded-full border border-zinc-500 border-t-transparent' />
              ) : (
                <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2' />
                </svg>
              )}
              Recalcular macros
            </button>
          )}

          {recalcError && (
            <p className='text-[10px] text-red-400'>{recalcError}</p>
          )}
        </div>
      </div>

      {/* Ingredientes — editables */}
      {meal.ingredients.length > 0 && (
        <ul className='mt-3 flex flex-wrap gap-2'>
          {meal.ingredients.map((ing, i) => (
            <IngredientRow
              key={i}
              ingredient={ing}
              onQuantityChanged={() => setMacrosDirty(true)}
              onChange={(updated) => handleIngredientChange(i, updated)}
            />
          ))}
        </ul>
      )}

      {/* Preparación — editable */}
      <div className='mt-3 text-sm text-zinc-500'>
        <EditableArea
          value={meal.preparation ?? ''}
          placeholder='Instrucciones de preparación…'
          onChange={(preparation) => onChange({ ...meal, preparation })}
        />
      </div>

      {/* Notas / sustituciones — editables */}
      {meal.notes !== undefined && (
        <div className='mt-1 text-xs italic text-zinc-600'>
          <EditableArea
            value={meal.notes ?? ''}
            placeholder='Notas o sustituciones…'
            onChange={(notes) => onChange({ ...meal, notes })}
          />
        </div>
      )}
    </div>
  );
}

// ── Day editor ────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function DayEditor({
  day: initialDay,
  planId,
  isDraft,
  onDirty,
  onSaved,
}: {
  day: PlanDay;
  planId: string;
  isDraft: boolean;
  onDirty: () => void;
  onSaved: () => void;
}) {
  const [day, setDay] = useState(initialDay);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  // Keep stable refs to callbacks to avoid stale closures in async code
  const onSavedRef = useRef(onSaved);
  useEffect(() => { onSavedRef.current = onSaved; });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Autoguardado con debounce de 1000ms
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await updateDay(planId, day.day_number, day);
      if (result.error) {
        setSaveStatus('error');
        // Reintentar 1 vez tras 2s
        setTimeout(async () => {
          const retry = await updateDay(planId, day.day_number, day);
          if (!retry.error) {
            markSaved();
          } else {
            setSaveStatus('idle');
          }
        }, 2000);
      } else {
        markSaved();
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, planId]);

  function markSaved() {
    setSaveStatus('saved');
    setDirty(false);
    onSavedRef.current();
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }

  const invalidMealIndexes = day.meals
    .map((m, i) => (m.calories <= 0 || m.ingredients.length < 2 ? i : -1))
    .filter((i) => i >= 0);

  function markDirty() {
    if (!dirty) {
      setDirty(true);
      onDirty();
    }
  }

  function updateMeal(mealIdx: number, updatedMeal: Meal) {
    setDay((prev) => ({
      ...prev,
      meals: prev.meals.map((m, i) => (i === mealIdx ? updatedMeal : m)),
    }));
    markDirty();
  }

  function updateDayTotals(patch: Partial<Pick<PlanDay, 'total_calories' | 'total_macros'>>) {
    setDay((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  return (
    <div
      className={`rounded-xl border bg-zinc-950 ${
        dirty
          ? 'border-[#1a7a45]/50'
          : invalidMealIndexes.length > 0
            ? 'border-red-800'
            : 'border-zinc-800'
      }`}
    >
      {/* Cabecera del día */}
      <div className='flex items-center justify-between border-b border-zinc-800 px-5 py-4'>
        <div>
          <h3 className='font-semibold text-zinc-100'>{day.day_name}</h3>
          <div className='mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500'>
            <EditableNumber
              value={day.total_calories}
              unit='kcal'
              onChange={(total_calories) => updateDayTotals({ total_calories })}
            />
            <span>·</span>
            <EditableNumber
              value={day.total_macros.protein_g}
              unit='g P'
              onChange={(protein_g) =>
                updateDayTotals({ total_macros: { ...day.total_macros, protein_g } })
              }
            />
            <span>·</span>
            <EditableNumber
              value={day.total_macros.carbs_g}
              unit='g C'
              onChange={(carbs_g) =>
                updateDayTotals({ total_macros: { ...day.total_macros, carbs_g } })
              }
            />
            <span>·</span>
            <EditableNumber
              value={day.total_macros.fat_g}
              unit='g G'
              onChange={(fat_g) =>
                updateDayTotals({ total_macros: { ...day.total_macros, fat_g } })
              }
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {invalidMealIndexes.length > 0 && (
            <>
              <span className='text-xs text-red-400'>
                {invalidMealIndexes.length} comida{invalidMealIndexes.length > 1 ? 's' : ''} con error
              </span>
              <RegenerateDayButton
                planId={planId}
                dayNumber={day.day_number}
                dayName={day.day_name}
              />
            </>
          )}
        </div>
      </div>

      {/* Comidas */}
      <div className='divide-y divide-zinc-900'>
        {day.meals.map((meal, i) => (
          <MealEditor
            key={i}
            meal={meal}
            isInvalid={invalidMealIndexes.includes(i)}
            isDraft={isDraft}
            planId={planId}
            onChange={(updated) => updateMeal(i, updated)}
          />
        ))}
      </div>

      {/* Indicador de autoguardado */}
      {saveStatus !== 'idle' && (
        <div className='flex justify-end border-t border-zinc-800/60 px-5 py-2'>
          {saveStatus === 'saving' && (
            <span className='flex items-center gap-1.5 text-xs text-zinc-500'>
              <span className='inline-block h-2.5 w-2.5 animate-spin rounded-full border border-zinc-600 border-t-transparent' />
              Guardando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className='text-xs text-emerald-500'>✓ Guardado</span>
          )}
          {saveStatus === 'error' && (
            <span className='text-xs text-amber-500'>Error al guardar — reintentando...</span>
          )}
        </div>
      )}
    </div>
  );
}
