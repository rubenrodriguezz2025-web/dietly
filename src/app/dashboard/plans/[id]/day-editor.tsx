'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { useToast } from '@/components/ui/use-toast';
import type { Ingredient, Meal, PlanDay, RecipeIngredient } from '@/types/dietly';

import { createRecipe } from '../../recetas/actions';

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
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
      <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
    </svg>
  );
}

function CheckIcon({ size = 10 }: { size?: number }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <polyline points='20 6 9 17 4 12' />
    </svg>
  );
}

function XIcon({ size = 10 }: { size?: number }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  );
}

function PlusIcon({ size = 10 }: { size?: number }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='12' y1='5' x2='12' y2='19' />
      <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  );
}

function RefreshIcon({ size = 10 }: { size?: number }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2' />
    </svg>
  );
}

function BookmarkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' />
    </svg>
  );
}

function XModalIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  );
}

// ── Save-as-recipe modal ───────────────────────────────────────────────────────

type RecipeCategory = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'snack';

function SaveAsRecipeModal({
  meal,
  onClose,
}: {
  meal: Meal;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isSaving, startSave] = useTransition();
  const [name, setName] = useState(meal.meal_name);
  const [category, setCategory] = useState<RecipeCategory | ''>(() => {
    const map: Record<string, RecipeCategory> = {
      desayuno: 'desayuno', media_manana: 'snack', almuerzo: 'almuerzo',
      merienda: 'merienda', cena: 'cena',
    };
    return map[meal.meal_type] ?? '';
  });

  function handleSave() {
    if (!name.trim()) return;
    startSave(async () => {
      const result = await createRecipe({
        name: name.trim(),
        category: (category as RecipeCategory) || null,
        servings: 1,
        ingredients: meal.ingredients as RecipeIngredient[],
        instructions: meal.preparation ?? '',
        notes: meal.notes ?? '',
        calories_per_serving: meal.calories,
        protein_g_per_serving: meal.macros.protein_g,
        carbs_g_per_serving: meal.macros.carbs_g,
        fat_g_per_serving: meal.macros.fat_g,
        values_source: 'ai_estimated',
      });
      if (result.error) {
        toast({ description: result.error, variant: 'destructive' });
      } else {
        toast({ description: 'Receta guardada en tu recetario.' });
        onClose();
      }
    });
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='fixed inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} aria-hidden='true' />
      <div className='relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50'>
        <div className='flex items-center justify-between border-b border-zinc-800 px-5 py-4'>
          <h3 className='font-semibold text-zinc-100'>Guardar como receta</h3>
          <button type='button' onClick={onClose} className='rounded-lg p-1 text-zinc-600 transition-colors hover:text-zinc-300'>
            <XModalIcon />
          </button>
        </div>
        <div className='px-5 py-5 flex flex-col gap-4'>
          <div>
            <label className='mb-1.5 block text-sm font-medium text-zinc-300'>Nombre de la receta</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-sm font-medium text-zinc-300'>Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RecipeCategory | '')}
              className='w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-[#1a7a45]/60 focus:outline-none'
            >
              <option value=''>Sin categoría</option>
              <option value='desayuno'>Desayuno</option>
              <option value='almuerzo'>Almuerzo</option>
              <option value='merienda'>Merienda</option>
              <option value='cena'>Cena</option>
              <option value='snack'>Snack</option>
            </select>
          </div>
          <div className='rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-xs text-zinc-500'>
            Se guardarán los ingredientes, macros e instrucciones de esta comida.
          </div>
        </div>
        <div className='flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4'>
          <button type='button' onClick={onClose} disabled={isSaving} className='rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'>
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className='flex items-center gap-2 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1a7a45]/90 disabled:opacity-50'
          >
            {isSaving ? (
              <span className='h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white' />
            ) : (
              <BookmarkIcon size={13} />
            )}
            Guardar en recetario
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Editable primitives ───────────────────────────────────────────────────────

/**
 * Single-line editable text.
 *
 * Always shows a faint dotted underline + pencil icon at ~35% opacity so
 * the field is visibly interactive even before hover.
 * On hover: border + background appear; icon reaches full opacity.
 * On click: green-ring input + confirm ✓ / cancel ✗.
 */
function EditableField({
  value,
  onChange,
  className = '',
  placeholder = '—',
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
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
      <span className='inline-flex items-center gap-1.5'>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); confirm(); }
            if (e.key === 'Escape') cancel();
          }}
          className={`min-w-[100px] rounded-md border border-[#1a7a45]/50 bg-zinc-900 px-2 py-1 text-sm ring-1 ring-[#1a7a45]/30 focus:border-[#1a7a45]/70 focus:outline-none focus:ring-[#1a7a45]/50 ${className}`}
        />
        <button
          type='button'
          onClick={confirm}
          title='Confirmar (Enter)'
          className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#1a7a45]/20 text-emerald-400 transition-colors hover:bg-[#1a7a45]/35'
        >
          <CheckIcon />
        </button>
        <button
          type='button'
          onClick={cancel}
          title='Cancelar (Esc)'
          className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300'
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
      title='Haz clic para editar'
      className={`group/ef inline-flex cursor-text items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-left transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900 ${className}`}
    >
      <span className='border-b border-dashed border-zinc-700/60'>
        {value || <span className='italic text-zinc-600'>{placeholder}</span>}
      </span>
      <span className='flex-shrink-0 text-zinc-600 opacity-35 transition-opacity duration-150 group-hover/ef:opacity-100'>
        <PencilIcon size={10} />
      </span>
    </button>
  );
}

/**
 * Numeric editable field.
 */
function EditableNumber({
  value,
  onChange,
  unit,
  bold,
  size = 'default',
  onQuantityChanged,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  bold?: boolean;
  size?: 'default' | 'sm';
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
          className={`rounded-md border border-[#1a7a45]/50 bg-zinc-900 px-1.5 py-0.5 text-zinc-100 ring-1 ring-[#1a7a45]/30 focus:outline-none focus:ring-[#1a7a45]/50 ${size === 'sm' ? 'w-12 text-xs' : 'w-16 text-sm'}`}
        />
        <button type='button' onClick={confirm} className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#1a7a45]/20 text-emerald-400 transition-colors hover:bg-[#1a7a45]/35'>
          <CheckIcon size={9} />
        </button>
        <button type='button' onClick={cancel} className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-zinc-800 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300'>
          <XIcon size={9} />
        </button>
      </span>
    );
  }

  return (
    <button
      type='button'
      onClick={startEdit}
      title='Haz clic para editar'
      className={`group/en inline-flex cursor-text items-center gap-0.5 rounded border border-transparent px-0.5 py-0.5 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900 ${bold ? 'font-semibold text-zinc-100' : size === 'sm' ? 'text-zinc-400' : 'text-zinc-300'}`}
    >
      <span className='border-b border-dashed border-zinc-700/60 tabular-nums'>{value}</span>
      {unit && <span className='ml-0.5 text-zinc-600'>{unit}</span>}
      <span className='ml-0.5 text-zinc-600 opacity-0 transition-opacity duration-150 group-hover/en:opacity-100'>
        <PencilIcon size={8} />
      </span>
    </button>
  );
}

/**
 * Multi-line editable textarea.
 */
function EditableArea({
  value,
  onChange,
  placeholder = '—',
  textClassName = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textClassName?: string;
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
      <div className='rounded-lg border border-[#1a7a45]/40 bg-zinc-900 ring-1 ring-[#1a7a45]/20'>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && cancel()}
          rows={4}
          placeholder={placeholder}
          className='w-full resize-none rounded-t-lg bg-transparent px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none'
        />
        <div className='flex items-center justify-end gap-1.5 border-t border-zinc-800/80 px-3 py-2'>
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
            className='rounded-md bg-[#1a7a45]/20 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-[#1a7a45]/30'
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
      title='Haz clic para editar'
      className='group/ea relative w-full cursor-text rounded-lg border border-transparent px-3 py-2 text-left transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900/60'
    >
      <span className={`block leading-relaxed ${textClassName}`}>
        {value || <span className='italic text-zinc-700'>{placeholder}</span>}
      </span>
      <span className='absolute right-2.5 top-2.5 text-zinc-600 opacity-30 transition-opacity duration-150 group-hover/ea:opacity-100'>
        <PencilIcon size={11} />
      </span>
    </button>
  );
}

// ── Ingredient row ────────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  onChange,
  onQuantityChanged,
  onDelete,
  isDraft,
}: {
  ingredient: Ingredient;
  onChange: (updated: Ingredient) => void;
  onQuantityChanged?: () => void;
  onDelete?: () => void;
  isDraft?: boolean;
}) {
  return (
    <li className='group/ing flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs transition-colors duration-150 hover:border-zinc-700'>
      <EditableField
        value={ingredient.name}
        onChange={(name) => onChange({ ...ingredient, name })}
        className='text-zinc-400'
      />
      <EditableNumber
        value={ingredient.quantity}
        onQuantityChanged={onQuantityChanged}
        onChange={(quantity) => onChange({ ...ingredient, quantity })}
        size='sm'
      />
      <EditableField
        value={ingredient.unit}
        onChange={(unit) => onChange({ ...ingredient, unit })}
        className='text-zinc-600'
      />
      {isDraft && onDelete && (
        <button
          type='button'
          onClick={onDelete}
          title='Eliminar ingrediente'
          className='ml-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-zinc-700 opacity-0 transition-all duration-150 group-hover/ing:opacity-100 hover:bg-red-950/60 hover:text-red-400'
        >
          <XIcon size={8} />
        </button>
      )}
    </li>
  );
}

// ── Add-ingredient inline form ────────────────────────────────────────────────

function AddIngredientForm({
  onAdd,
  onCancel,
}: {
  onAdd: (ing: Ingredient) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('100');
  const [unit, setUnit] = useState('g');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function confirm() {
    const quantity = Number(qty);
    if (!name.trim() || isNaN(quantity) || quantity < 0) return;
    onAdd({ name: name.trim(), quantity, unit: unit.trim() || 'g' });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') onCancel();
  }

  return (
    <li className='flex items-center gap-1.5 rounded-full border border-[#1a7a45]/50 bg-zinc-900/80 px-3 py-1.5 text-xs ring-1 ring-[#1a7a45]/15'>
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKey}
        placeholder='Ingrediente'
        className='w-24 bg-transparent text-zinc-300 outline-none placeholder:text-zinc-600'
      />
      <span className='select-none text-zinc-700'>·</span>
      <input
        type='number'
        min={0}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onKeyDown={handleKey}
        placeholder='100'
        className='w-10 bg-transparent text-right text-zinc-300 outline-none'
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        onKeyDown={handleKey}
        placeholder='g'
        className='w-8 bg-transparent text-zinc-500 outline-none'
      />
      <button
        type='button'
        onClick={confirm}
        className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#1a7a45]/25 text-emerald-400 transition-colors hover:bg-[#1a7a45]/40'
      >
        <CheckIcon size={9} />
      </button>
      <button
        type='button'
        onClick={onCancel}
        className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300'
      >
        <XIcon size={9} />
      </button>
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

          {/* Badge transparencia IA — solo dashboard nutricionista */}
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[10px] text-zinc-700 italic'>~ Estimación IA</span>
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
        {isDraft && (
          addingIngredient ? (
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
          )
        )}
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
  const [hintDismissed, setHintDismissed] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const onSavedRef = useRef(onSaved);
  useEffect(() => { onSavedRef.current = onSaved; });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Autoguardado con debounce de 1000 ms
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
        setTimeout(async () => {
          const retry = await updateDay(planId, day.day_number, day);
          if (!retry.error) markSaved();
          else setSaveStatus('idle');
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
      setHintDismissed(true);
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

  function updateDayTotals(
    patch: Partial<Pick<PlanDay, 'total_calories' | 'total_macros'>>
  ) {
    setDay((prev) => ({ ...prev, ...patch }));
    markDirty();
  }

  return (
    <div
      className={`rounded-xl border bg-zinc-950 transition-[border-color,box-shadow] duration-300 ${
        dirty
          ? 'border-[#1a7a45]/40 shadow-[0_0_0_1px_rgba(26,122,69,0.08)]'
          : invalidMealIndexes.length > 0
            ? 'border-red-800/70'
            : 'border-zinc-800'
      }`}
    >
      {/* Cabecera del día */}
      <div className='flex items-center justify-between border-b border-zinc-800 px-5 py-4'>
        <div>
          <h3 className='font-semibold text-zinc-100'>{day.day_name}</h3>
          <div className='mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-600'>
            <EditableNumber
              value={day.total_calories}
              unit='kcal'
              onChange={(total_calories) => updateDayTotals({ total_calories })}
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.protein_g}
              unit='g P'
              size='sm'
              onChange={(protein_g) =>
                updateDayTotals({ total_macros: { ...day.total_macros, protein_g } })
              }
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.carbs_g}
              unit='g C'
              size='sm'
              onChange={(carbs_g) =>
                updateDayTotals({ total_macros: { ...day.total_macros, carbs_g } })
              }
            />
            <span className='select-none text-zinc-800'>·</span>
            <EditableNumber
              value={day.total_macros.fat_g}
              unit='g G'
              size='sm'
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
                {invalidMealIndexes.length} comida
                {invalidMealIndexes.length > 1 ? 's' : ''} con error
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

      {/* Hint de edición — visible hasta primera edición */}
      {isDraft && !hintDismissed && (
        <div className='flex items-center justify-between border-b border-zinc-800/50 bg-[#1a7a45]/5 px-5 py-2'>
          <div className='flex items-center gap-2 text-zinc-500'>
            <PencilIcon size={11} />
            <p className='text-xs'>
              Haz clic en cualquier texto subrayado para editarlo
            </p>
          </div>
          <button
            type='button'
            onClick={() => setHintDismissed(true)}
            className='text-zinc-700 transition-colors hover:text-zinc-500'
            aria-label='Cerrar ayuda'
          >
            <XIcon size={9} />
          </button>
        </div>
      )}

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
            <span className='flex items-center gap-1.5 text-xs text-zinc-600'>
              <span className='inline-block h-2.5 w-2.5 animate-spin rounded-full border border-zinc-600 border-t-transparent' />
              Guardando…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className='flex items-center gap-1.5 text-xs text-emerald-600'>
              <CheckIcon size={10} />
              Guardado
            </span>
          )}
          {saveStatus === 'error' && (
            <span className='text-xs text-amber-500'>
              Error al guardar — reintentando…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
