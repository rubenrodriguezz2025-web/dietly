'use client';

import { useState, useTransition } from 'react';

import type { Ingredient, Meal } from '@/types/dietly';

import { recalculateMealMacros } from './actions';
import {
  AddIngredientForm,
  BookmarkIcon,
  EditableArea,
  EditableField,
  EditableNumber,
  IngredientRow,
  MEAL_TYPE_LABELS,
  PlusIcon,
  RefreshIcon,
  SaveAsRecipeModal,
} from './day-editor-shared';

export type MealCardProps = {
  meal: Meal;
  isInvalid: boolean;
  isDraft: boolean;
  planId: string;
  onChange: (updated: Meal) => void;
};

export function MealCard({ meal, isInvalid, isDraft, planId, onChange }: MealCardProps) {
  const [isRecalculating, startRecalc] = useTransition();
  const [recalcError, setRecalcError] = useState<string | null>(null);
  const [macrosDirty, setMacrosDirty] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  function handleIngredientChange(i: number, updated: Ingredient) {
    onChange({
      ...meal,
      ingredients: meal.ingredients.map((x, j) => (j === i ? updated : x)),
    });
  }

  function handleDeleteIngredient(i: number) {
    onChange({ ...meal, ingredients: meal.ingredients.filter((_, j) => j !== i) });
    setMacrosDirty(true);
  }

  function handleAddIngredient(ing: Ingredient) {
    onChange({ ...meal, ingredients: [...meal.ingredients, ing] });
    setAddingIngredient(false);
    setMacrosDirty(true);
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
      {/* Header: tipo + nombre + macros */}
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          {/* Tipo y hora */}
          <div className='flex items-center gap-2'>
            {isInvalid && (
              <span className='rounded bg-red-900/60 px-1.5 py-0.5 text-xs font-medium text-red-300'>
                Error
              </span>
            )}
            <span className='text-[11px] font-semibold uppercase tracking-widest text-zinc-600'>
              {MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type}
            </span>
            {meal.time_suggestion && (
              <span className='text-xs text-zinc-700'>{meal.time_suggestion}</span>
            )}
          </div>

          {/* Nombre del plato — editable prominente */}
          <h4 className='mt-0.5'>
            <EditableField
              value={meal.meal_name}
              onChange={(meal_name) => onChange({ ...meal, meal_name })}
              className='text-base font-semibold text-zinc-100'
              placeholder='Nombre del plato…'
            />
          </h4>
        </div>

        {/* Macros block */}
        <div className='flex flex-col items-end gap-1.5'>
          <div className='flex flex-shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs'>
            <EditableNumber
              value={meal.calories}
              unit='kcal'
              bold
              onChange={(calories) => onChange({ ...meal, calories })}
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={meal.macros.protein_g}
              unit='P'
              size='sm'
              onChange={(protein_g) =>
                onChange({ ...meal, macros: { ...meal.macros, protein_g } })
              }
            />
            <EditableNumber
              value={meal.macros.carbs_g}
              unit='C'
              size='sm'
              onChange={(carbs_g) =>
                onChange({ ...meal, macros: { ...meal.macros, carbs_g } })
              }
            />
            <EditableNumber
              value={meal.macros.fat_g}
              unit='G'
              size='sm'
              onChange={(fat_g) =>
                onChange({ ...meal, macros: { ...meal.macros, fat_g } })
              }
            />
          </div>

          {/* Badge macros pendientes de recálculo */}
          {isDraft && macrosDirty && (
            <button
              type='button'
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className='flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-950/50 px-2.5 py-1 text-[11px] font-medium text-amber-400 transition-all duration-150 hover:border-amber-600/70 hover:bg-amber-950/70 disabled:opacity-60'
            >
              {isRecalculating ? (
                <span className='h-2.5 w-2.5 animate-spin rounded-full border border-amber-500/40 border-t-amber-400' />
              ) : (
                <RefreshIcon />
              )}
              ⚠️ Macros pendientes · Recalcular con IA
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
                <RefreshIcon />
              )}
              Recalcular macros
            </button>
          )}

          {recalcError && <p className='text-[10px] text-red-400'>{recalcError}</p>}

          {/* Badge transparencia IA */}
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[10px] italic text-zinc-700'>~ Estimación IA</span>
            {isDraft && (
              <button
                type='button'
                onClick={() => setShowSaveModal(true)}
                title='Guardar como receta personal'
                className='flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-600 transition-all duration-150 hover:border-zinc-600 hover:text-emerald-500'
              >
                <BookmarkIcon size={10} />
                Guardar receta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal guardar como receta */}
      {showSaveModal && (
        <SaveAsRecipeModal meal={meal} onClose={() => setShowSaveModal(false)} />
      )}

      {/* Ingredientes */}
      <ul className='mt-3 flex flex-wrap gap-1.5'>
        {meal.ingredients.map((ing, i) => (
          <IngredientRow
            key={i}
            ingredient={ing}
            isDraft={isDraft}
            onQuantityChanged={() => setMacrosDirty(true)}
            onChange={(updated) => handleIngredientChange(i, updated)}
            onDelete={isDraft ? () => handleDeleteIngredient(i) : undefined}
          />
        ))}

        {/* Añadir ingrediente */}
        {isDraft &&
          (addingIngredient ? (
            <AddIngredientForm
              onAdd={handleAddIngredient}
              onCancel={() => setAddingIngredient(false)}
            />
          ) : (
            <li>
              <button
                type='button'
                onClick={() => setAddingIngredient(true)}
                className='flex items-center gap-1 rounded-full border border-dashed border-zinc-700/70 px-2.5 py-1 text-[11px] text-zinc-600 transition-all duration-150 hover:border-[#1a7a45]/60 hover:text-emerald-500'
                title='Añadir ingrediente'
              >
                <PlusIcon size={9} />
                Añadir
              </button>
            </li>
          ))}
      </ul>

      {/* Preparación */}
      <div className='mt-3'>
        <p className='mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-700'>
          Preparación
        </p>
        <EditableArea
          value={meal.preparation ?? ''}
          placeholder='Instrucciones de preparación…'
          onChange={(preparation) => onChange({ ...meal, preparation })}
          textClassName='text-sm text-zinc-500'
        />
      </div>

      {/* Notas */}
      {meal.notes !== undefined && (
        <div className='mt-1'>
          <p className='mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-700'>
            Notas / sustituciones
          </p>
          <EditableArea
            value={meal.notes ?? ''}
            placeholder='Notas o sustituciones…'
            onChange={(notes) => onChange({ ...meal, notes })}
            textClassName='text-xs italic text-zinc-600'
          />
        </div>
      )}
    </div>
  );
}
