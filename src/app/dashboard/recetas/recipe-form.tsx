'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { useToast } from '@/components/ui/use-toast';
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeValuesSource } from '@/types/dietly';
import { RECIPE_CATEGORY_LABELS } from '@/types/dietly';

import { calculateRecipeMacros, createRecipe, deleteRecipeImage, type RecipeWithImage, updateRecipe, uploadRecipeImage } from './actions';

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='12' y1='5' x2='12' y2='19' /><line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <polyline points='3 6 5 6 21 6' /><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M12 3l1.88 5.73L19.5 10l-5.62 1.27L12 17l-1.88-5.73L4.5 10l5.62-1.27L12 3z' />
      <path d='M5 3l.97 2.97L9 7l-3.03.97L5 11l-.97-2.97L1 7l3.03-.97L5 3z' />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MacroValues = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: RecipeValuesSource;
};

type Props = {
  recipe?: RecipeWithImage;
  onSuccess: (recipe: RecipeWithImage) => void;
  onCancel: () => void;
};

const UNITS = ['g', 'ml', 'unidades', 'cucharadas', 'tazas', 'rebanadas'];
const CATEGORIES = Object.entries(RECIPE_CATEGORY_LABELS) as [RecipeCategory, string][];

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_RESIZE_THRESHOLD = 2 * 1024 * 1024;
const IMAGE_MAX_WIDTH = 1200;
const IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function resizeImageIfNeeded(file: File): Promise<File> {
  if (file.size <= IMAGE_RESIZE_THRESHOLD) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width <= IMAGE_MAX_WIDTH) {
        resolve(file);
        return;
      }
      const scale = IMAGE_MAX_WIDTH / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = IMAGE_MAX_WIDTH;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const ext = outType === 'image/png' ? 'png' : 'jpg';
          const name = file.name.replace(/\.[^.]+$/, '') + `.${ext}`;
          resolve(new File([blob], name, { type: outType }));
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = objectUrl;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecipeForm({ recipe, onSuccess, onCancel }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isCalculating, startCalc] = useTransition();

  const [name, setName] = useState(recipe?.name ?? '');
  const [category, setCategory] = useState<RecipeCategory | ''>(recipe?.category ?? '');
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    (recipe?.ingredients as RecipeIngredient[]) ?? [{ name: '', quantity: 100, unit: 'g' }]
  );
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [macros, setMacros] = useState<MacroValues>({
    calories: recipe?.calories_per_serving ?? null,
    protein_g: recipe?.protein_g_per_serving ?? null,
    carbs_g: recipe?.carbs_g_per_serving ?? null,
    fat_g: recipe?.fat_g_per_serving ?? null,
    source: recipe?.values_source ?? 'ai_estimated',
  });
  const [calcError, setCalcError] = useState<string | null>(null);
  const [macrosDirty, setMacrosDirty] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(recipe?.image_signed_url ?? null);
  const [imagePath, setImagePath] = useState<string | null>(recipe?.image_url ?? null);
  const [imageSignedUrl, setImageSignedUrl] = useState<string | null>(recipe?.image_signed_url ?? null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
      setImageError('Formato no permitido. Usa JPG, PNG o WebP.');
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    if (file.size > IMAGE_MAX_SIZE) {
      setImageError('La imagen supera los 5 MB.');
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    try {
      const processed = await resizeImageIfNeeded(file);
      const previewUrl = URL.createObjectURL(processed);
      setImageFile(processed);
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImagePreview(previewUrl);
    } catch {
      setImageError('No se pudo procesar la imagen.');
    }
  }

  function handleRemoveSelection() {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(imageSignedUrl);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function handleDeleteExistingImage() {
    if (!recipe) return;
    startTransition(async () => {
      const result = await deleteRecipeImage(recipe.id);
      if (result.error) {
        toast({ description: result.error, variant: 'destructive' });
        return;
      }
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePath(null);
      setImageSignedUrl(null);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      toast({ description: 'Foto eliminada.' });
    });
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: 100, unit: 'g' }]);
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, j) => j !== i));
  }

  function updateIngredient(i: number, patch: Partial<RecipeIngredient>) {
    setIngredients((prev) => prev.map((ing, j) => (j === i ? { ...ing, ...patch } : ing)));
    setMacrosDirty(true);
  }

  function handleManualMacroChange(field: keyof Omit<MacroValues, 'source'>, value: string) {
    const n = value === '' ? null : Number(value);
    setMacros((prev) => ({ ...prev, [field]: n, source: 'nutritionist_verified' }));
    setMacrosDirty(false);
  }

  function handleCalculate() {
    setCalcError(null);
    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) {
      setCalcError('Añade al menos un ingrediente con nombre.');
      return;
    }
    startCalc(async () => {
      const result = await calculateRecipeMacros(name || 'Receta', validIngredients, servings);
      if (result.error) {
        setCalcError(result.error);
      } else {
        setMacros({
          calories: result.calories ?? null,
          protein_g: result.protein_g ?? null,
          carbs_g: result.carbs_g ?? null,
          fat_g: result.fat_g ?? null,
          source: 'ai_estimated',
        });
        setMacrosDirty(false);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const validIngredients = ingredients.filter((ing) => ing.name.trim());

    startTransition(async () => {
      const input = {
        name: name.trim(),
        category: (category as RecipeCategory) || null,
        servings,
        ingredients: validIngredients,
        instructions: instructions.trim(),
        notes: notes.trim(),
        calories_per_serving: macros.calories,
        protein_g_per_serving: macros.protein_g,
        carbs_g_per_serving: macros.carbs_g,
        fat_g_per_serving: macros.fat_g,
        values_source: macros.source,
      };

      let saved: Recipe | undefined;
      let error: string | undefined;
      if (recipe) {
        const r = await updateRecipe(recipe.id, input);
        if (r.error) error = r.error;
        else saved = { ...recipe, ...input } as Recipe;
      } else {
        const r = await createRecipe(input);
        error = r.error;
        saved = r.recipe;
      }

      if (error || !saved) {
        toast({ description: error ?? 'Error al guardar la receta.', variant: 'destructive' });
        return;
      }

      let finalSignedUrl = imageSignedUrl;
      if (imageFile) {
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploaded = await uploadRecipeImage(saved.id, fd);
        setUploadingImage(false);
        if (uploaded.error) {
          toast({ description: `Receta guardada, pero fallo al subir imagen: ${uploaded.error}`, variant: 'destructive' });
        } else {
          finalSignedUrl = uploaded.image_signed_url ?? null;
          if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        }
      }

      toast({ description: recipe ? 'Receta actualizada.' : 'Receta guardada en tu recetario.' });
      onSuccess({ ...saved, image_signed_url: finalSignedUrl } as RecipeWithImage);
    });
  }

  const hasMacros = macros.calories !== null;

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      {/* Nombre */}
      <div>
        <label className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
          Nombre de la receta <span className='text-red-600 dark:text-red-400'>*</span>
        </label>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Ej: Ensalada de quinoa con pollo'
          required
          className='w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600'
        />
      </div>

      {/* Categoría + Raciones */}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RecipeCategory | '')}
            className='w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
          >
            <option value=''>Sin categoría</option>
            {CATEGORIES.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>Número de raciones</label>
          <input
            type='number'
            min={1}
            value={servings}
            onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
            className='w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
          />
        </div>
      </div>

      {/* Foto del plato */}
      <div>
        <label className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
          Foto del plato <span className='font-normal text-zinc-500 dark:text-zinc-600'>(opcional)</span>
        </label>
        <p className='mb-2 text-xs text-zinc-500 dark:text-zinc-600'>
          Una foto ayuda al paciente a visualizar el plato y mejora la adherencia.
        </p>
        <div className='flex items-start gap-4'>
          {imagePreview ? (
            <div className='relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt='Vista previa'
                className='h-full w-full object-cover'
              />
            </div>
          ) : (
            <div className='flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600'>
              <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                <circle cx='8.5' cy='8.5' r='1.5' />
                <polyline points='21 15 16 10 5 21' />
              </svg>
            </div>
          )}
          <div className='flex flex-1 flex-col gap-2'>
            <input
              ref={imageInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              onChange={handleImageChange}
              disabled={uploadingImage}
              className='block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50 dark:text-zinc-400 dark:file:bg-[#1a7a45]/20 dark:file:text-emerald-400'
            />
            <p className='text-[11px] text-zinc-500 dark:text-zinc-700'>
              JPG, PNG o WebP · máx. 5 MB · se optimiza automáticamente
            </p>
            {imageError && <p className='text-xs text-red-600 dark:text-red-400'>{imageError}</p>}
            {uploadingImage && (
              <p className='text-xs text-emerald-700 dark:text-emerald-400'>Subiendo imagen...</p>
            )}
            <div className='flex flex-wrap gap-2'>
              {imageFile && (
                <button
                  type='button'
                  onClick={handleRemoveSelection}
                  className='rounded-lg border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200'
                >
                  Descartar selección
                </button>
              )}
              {recipe && imagePath && !imageFile && (
                <button
                  type='button'
                  onClick={handleDeleteExistingImage}
                  disabled={isPending}
                  className='rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 hover:border-red-300 hover:bg-red-100 disabled:opacity-60 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-700/70'
                >
                  Eliminar foto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>Ingredientes</label>
        <div className='flex flex-col gap-2'>
          {ingredients.map((ing, i) => (
            <div key={i} className='flex items-center gap-2'>
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                placeholder='Ingrediente'
                className='min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600'
              />
              <input
                type='number'
                min={0}
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, { quantity: Number(e.target.value) })}
                className='w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
              />
              <select
                value={ing.unit}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                className='w-28 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {ingredients.length > 1 && (
                <button
                  type='button'
                  onClick={() => removeIngredient(i)}
                  className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-600 dark:hover:border-red-800/70 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                  title='Eliminar ingrediente'
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type='button'
          onClick={addIngredient}
          className='mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:border-[#1a7a45]/50 hover:text-emerald-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:text-emerald-500'
        >
          <PlusIcon /> Añadir ingrediente
        </button>
      </div>

      {/* Sección de macros */}
      <div className='rounded-xl border border-zinc-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50'>
        <div className='mb-3 flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-zinc-800 dark:text-zinc-300'>Valores nutricionales por ración</p>
            {hasMacros && (
              <p className='mt-0.5 text-xs'>
                {macros.source === 'ai_estimated' ? (
                  <span className='text-zinc-600 dark:text-zinc-500'>~ Estimación IA · Puedes editarlos manualmente</span>
                ) : (
                  <span className='text-emerald-700 dark:text-emerald-500'>✓ Verificado por nutricionista</span>
                )}
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={handleCalculate}
            disabled={isCalculating}
            className='flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-all duration-150 hover:border-violet-300 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:border-violet-700/70 dark:hover:bg-violet-950/60'
          >
            {isCalculating ? (
              <span className='h-3 w-3 animate-spin rounded-full border border-violet-500/40 border-t-violet-600 dark:border-violet-400/40 dark:border-t-violet-300' />
            ) : (
              <SparklesIcon />
            )}
            {hasMacros ? 'Recalcular con IA' : 'Calcular macros con IA'}
          </button>
        </div>

        {calcError && (
          <p className='mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400'>
            {calcError}
          </p>
        )}

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {([
            { field: 'calories', label: 'Calorías', unit: 'kcal' },
            { field: 'protein_g', label: 'Proteína', unit: 'g' },
            { field: 'carbs_g', label: 'Carbohidratos', unit: 'g' },
            { field: 'fat_g', label: 'Grasa', unit: 'g' },
          ] as const).map(({ field, label, unit }) => (
            <div key={field}>
              <label className='mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-600'>
                {label} <span className='normal-case font-normal text-zinc-500 dark:text-zinc-700'>({unit})</span>
              </label>
              <input
                type='number'
                min={0}
                value={macros[field] ?? ''}
                onChange={(e) => handleManualMacroChange(field, e.target.value)}
                placeholder='—'
                className='w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-700'
              />
            </div>
          ))}
        </div>
      </div>

      {/* Instrucciones */}
      <div>
        <label className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>Instrucciones de preparación</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder='Describe los pasos de preparación…'
          rows={4}
          className='w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600'
        />
      </div>

      {/* Notas */}
      <div>
        <label className='mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-400'>
          Notas / sugerencias <span className='font-normal text-zinc-500 dark:text-zinc-600'>(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Variantes, consejos, momentos de consumo…'
          rows={2}
          className='w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-[#1a7a45]/60 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600'
        />
      </div>

      {/* Acciones */}
      <div className='flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
        <button
          type='button'
          onClick={onCancel}
          disabled={isPending}
          className='rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200'
        >
          Cancelar
        </button>
        <button
          type='submit'
          disabled={isPending || !name.trim()}
          className='rounded-lg bg-[#1a7a45] px-5 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#1a7a45]/90 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isPending ? (
            <span className='flex items-center gap-2'>
              <span className='inline-block h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white' />
              Guardando…
            </span>
          ) : recipe ? 'Actualizar receta' : 'Guardar receta'}
        </button>
      </div>
    </form>
  );
}
