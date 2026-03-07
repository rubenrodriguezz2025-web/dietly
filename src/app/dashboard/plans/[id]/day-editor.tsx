'use client';

import { useState, useTransition } from 'react';

import type { Ingredient, Meal, PlanDay } from '@/types/dietly';

import { updateDay } from './actions';
import { RegenerateDayButton } from './regenerate-day-button';

const MEAL_TYPE_LABELS: Record<string, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

// ── Editable primitives ───────────────────────────────────────────────────────

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

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        className={`w-full rounded border border-[#1a7a45]/60 bg-zinc-900 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a7a45] ${className}`}
      />
    );
  }

  return (
    <span
      role='button'
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
      title='Clic para editar'
      className={`cursor-text rounded px-1 hover:bg-zinc-800 ${className}`}
    >
      {value || <span className='italic text-zinc-600'>—</span>}
    </span>
  );
}

function EditableNumber({
  value,
  onChange,
  unit,
  bold,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  bold?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        autoFocus
        type='number'
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={() => setEditing(false)}
        className='w-14 rounded border border-[#1a7a45]/60 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-100 focus:outline-none'
      />
    );
  }

  return (
    <span
      role='button'
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
      title='Clic para editar'
      className={`cursor-text rounded px-0.5 hover:bg-zinc-800 ${bold ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}
    >
      {value}
      {unit && <span className='ml-0.5 text-zinc-600'>{unit}</span>}
    </span>
  );
}

function EditableArea({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        rows={3}
        className={`w-full resize-none rounded border border-[#1a7a45]/60 bg-zinc-900 px-2 py-1 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#1a7a45] ${className}`}
      />
    );
  }

  return (
    <p
      role='button'
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
      title='Clic para editar'
      className={`cursor-text rounded px-1 leading-relaxed hover:bg-zinc-800 ${className}`}
    >
      {value || <span className='italic text-zinc-600'>—</span>}
    </p>
  );
}

// ── Ingredient row ────────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  onChange,
}: {
  ingredient: Ingredient;
  onChange: (updated: Ingredient) => void;
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
  onChange,
}: {
  meal: Meal;
  isInvalid: boolean;
  onChange: (updated: Meal) => void;
}) {
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
          {/* Nombre — editable */}
          <h4 className='mt-1 font-medium'>
            <EditableField
              value={meal.meal_name}
              onChange={(meal_name) => onChange({ ...meal, meal_name })}
              className='text-zinc-100'
            />
          </h4>
        </div>

        {/* Macros — editables */}
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
      </div>

      {/* Ingredientes — editables */}
      {meal.ingredients.length > 0 && (
        <ul className='mt-3 flex flex-wrap gap-2'>
          {meal.ingredients.map((ing, i) => (
            <IngredientRow
              key={i}
              ingredient={ing}
              onChange={(updated) =>
                onChange({
                  ...meal,
                  ingredients: meal.ingredients.map((x, j) => (j === i ? updated : x)),
                })
              }
            />
          ))}
        </ul>
      )}

      {/* Preparación — editable */}
      <div className='mt-3 text-sm text-zinc-500'>
        <EditableArea
          value={meal.preparation ?? ''}
          onChange={(preparation) => onChange({ ...meal, preparation })}
        />
      </div>

      {/* Notas / sustituciones — editables */}
      {(meal.notes !== undefined) && (
        <div className='mt-1 text-xs italic text-zinc-600'>
          <EditableArea
            value={meal.notes ?? ''}
            onChange={(notes) => onChange({ ...meal, notes })}
          />
        </div>
      )}
    </div>
  );
}

// ── Day editor ────────────────────────────────────────────────────────────────

export function DayEditor({
  day: initialDay,
  planId,
  onDirty,
  onSaved,
}: {
  day: PlanDay;
  planId: string;
  onDirty: () => void;
  onSaved: () => void;
}) {
  const [day, setDay] = useState(initialDay);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invalidMealIndexes = day.meals
    .map((m, i) => (m.calories <= 0 || m.ingredients.length < 2 ? i : -1))
    .filter((i) => i >= 0);

  function markDirty() {
    if (!dirty) {
      setDirty(true);
      setSaveOk(false);
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

  function handleSave() {
    startTransition(async () => {
      const result = await updateDay(planId, day.day_number, day);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveError(null);
        setSaveOk(true);
        setDirty(false);
        onSaved();
      }
    });
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
            onChange={(updated) => updateMeal(i, updated)}
          />
        ))}
      </div>

      {/* Barra de guardado — solo visible cuando hay cambios */}
      {dirty && (
        <div className='flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-5 py-3'>
          <p className='text-xs text-zinc-500'>Cambios sin guardar en este día</p>
          <div className='flex items-center gap-3'>
            {saveError && <p className='text-xs text-red-400'>{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={isPending}
              className='rounded-lg bg-[#1a7a45] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:opacity-50'
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmación de guardado */}
      {saveOk && !dirty && (
        <div className='border-t border-zinc-800 px-5 py-2 text-xs text-emerald-500'>
          ✓ Cambios guardados correctamente
        </div>
      )}
    </div>
  );
}
