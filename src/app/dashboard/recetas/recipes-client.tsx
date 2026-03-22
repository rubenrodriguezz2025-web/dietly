'use client';

import { useState, useTransition } from 'react';

import { useToast } from '@/components/ui/use-toast';
import type { Recipe, RecipeCategory } from '@/types/dietly';
import { RECIPE_CATEGORY_LABELS } from '@/types/dietly';

import { deleteRecipe } from './actions';
import { RecipeForm } from './recipe-form';

// ── Icons ─────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='12' y1='5' x2='12' y2='19' /><line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' /><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
      <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
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

function XIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  );
}

// ── Recipe card ───────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleting, startDelete] = useTransition();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    startDelete(async () => {
      const result = await deleteRecipe(recipe.id);
      if (result.error) toast({ description: result.error, variant: 'destructive' });
      else {
        toast({ description: 'Receta eliminada.' });
        onDelete();
      }
    });
  }

  const hasNutritionalInfo = recipe.calories_per_serving !== null;

  return (
    <div className='group relative rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all duration-200 hover:border-zinc-700 hover:shadow-md hover:shadow-black/20'>
      {/* Header */}
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            {recipe.category && (
              <span className='rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500'>
                {RECIPE_CATEGORY_LABELS[recipe.category as RecipeCategory] ?? recipe.category}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              recipe.values_source === 'nutritionist_verified'
                ? 'border border-emerald-800/50 bg-emerald-950/30 text-emerald-400'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-600'
            }`}>
              {recipe.values_source === 'nutritionist_verified' ? '✓ Verificado' : '~ Estimación IA'}
            </span>
          </div>
          <h3 className='mt-1.5 font-semibold text-zinc-100 leading-tight'>{recipe.name}</h3>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
          <button
            type='button'
            onClick={onEdit}
            title='Editar receta'
            className='flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-300'
          >
            <EditIcon />
          </button>
          <button
            type='button'
            onClick={handleDelete}
            disabled={deleting}
            title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar receta'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              confirmDelete
                ? 'border-red-700 bg-red-950/40 text-red-400'
                : 'border-zinc-800 text-zinc-600 hover:border-red-800/70 hover:bg-red-950/20 hover:text-red-400'
            }`}
          >
            {deleting ? (
              <span className='h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent' />
            ) : (
              <TrashIcon />
            )}
          </button>
        </div>
      </div>

      {/* Macros */}
      {hasNutritionalInfo ? (
        <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-xs'>
          <span className='font-semibold text-zinc-200'>{recipe.calories_per_serving} kcal</span>
          <span className='text-zinc-700'>·</span>
          <span className='text-zinc-400'>{recipe.protein_g_per_serving}g P</span>
          <span className='text-zinc-700'>·</span>
          <span className='text-zinc-400'>{recipe.carbs_g_per_serving}g C</span>
          <span className='text-zinc-700'>·</span>
          <span className='text-zinc-400'>{recipe.fat_g_per_serving}g G</span>
          <span className='ml-1 text-zinc-700'>· por ración</span>
          {recipe.servings > 1 && (
            <span className='rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500'>
              {recipe.servings} raciones
            </span>
          )}
        </div>
      ) : (
        <p className='mt-3 text-xs italic text-zinc-700'>Sin valores nutricionales registrados</p>
      )}

      {/* Ingredients preview */}
      {recipe.ingredients && (recipe.ingredients as { name: string }[]).length > 0 && (
        <p className='mt-2 text-xs text-zinc-600 leading-relaxed line-clamp-2'>
          {(recipe.ingredients as { name: string }[]).map((i) => i.name).join(', ')}
        </p>
      )}

      {/* Creation date */}
      <p className='mt-3 text-[10px] text-zinc-700'>
        {new Date(recipe.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16'>
      <div
        className='fixed inset-0 bg-black/70 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />
      <div className='relative z-10 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50'>
        <div className='flex items-center justify-between border-b border-zinc-800 px-6 py-4'>
          <h2 className='font-semibold text-zinc-100'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1 text-zinc-600 transition-colors hover:text-zinc-300'
          >
            <XIcon />
          </button>
        </div>
        <div className='max-h-[75vh] overflow-y-auto px-6 py-5'>{children}</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ALL_CATEGORIES: (RecipeCategory | 'all')[] = ['all', 'desayuno', 'almuerzo', 'merienda', 'cena', 'snack'];
const CATEGORY_FILTER_LABELS: Record<RecipeCategory | 'all', string> = {
  all: 'Todos',
  ...RECIPE_CATEGORY_LABELS,
};

export function RecipesClient({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RecipeCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleNewSuccess(recipe: Recipe) {
    setRecipes((prev) => [recipe, ...prev]);
    setShowForm(false);
  }

  function handleEditSuccess(updated: Recipe) {
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecipe(null);
  }

  function handleDelete(id: string) {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-zinc-100'>Mis recetas</h1>
          <p className='mt-0.5 text-sm text-zinc-500'>
            {recipes.length === 0
              ? 'Tu recetario personal'
              : `${recipes.length} receta${recipes.length !== 1 ? 's' : ''} guardada${recipes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowForm(true)}
          className='flex items-center gap-2 rounded-xl bg-[#1a7a45] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#1a7a45]/90 active:scale-[0.98]'
        >
          <PlusIcon /> Nueva receta
        </button>
      </div>

      {/* Filtros */}
      {recipes.length > 0 && (
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          {/* Search */}
          <div className='relative flex-1'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600'>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Buscar receta…'
              className='w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#1a7a45]/50 focus:outline-none focus:ring-1 focus:ring-[#1a7a45]/20'
            />
          </div>
          {/* Category filter */}
          <div className='flex flex-wrap items-center gap-1.5'>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type='button'
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  categoryFilter === cat
                    ? 'bg-[#1a7a45]/20 text-emerald-400'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                }`}
              >
                {CATEGORY_FILTER_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recipes.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-20 text-center'>
          <div className='mb-4 text-zinc-700'>
            <BookIcon />
          </div>
          <h2 className='mb-1 text-base font-semibold text-zinc-300'>Tu recetario está vacío</h2>
          <p className='mb-6 max-w-sm text-sm text-zinc-600'>
            Añade tus recetas habituales para que la IA las use al generar planes personalizados para tus pacientes
          </p>
          <button
            type='button'
            onClick={() => setShowForm(true)}
            className='flex items-center gap-2 rounded-xl bg-[#1a7a45] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1a7a45]/90'
          >
            <PlusIcon /> Añadir mi primera receta
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className='rounded-xl border border-zinc-800 py-12 text-center text-zinc-600'>
          <p>No se encontraron recetas con ese filtro.</p>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => setEditingRecipe(recipe)}
              onDelete={() => handleDelete(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Modal nueva receta */}
      {showForm && (
        <Modal title='Nueva receta' onClose={() => setShowForm(false)}>
          <RecipeForm
            onSuccess={handleNewSuccess}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {/* Modal editar receta */}
      {editingRecipe && (
        <Modal title='Editar receta' onClose={() => setEditingRecipe(null)}>
          <RecipeForm
            recipe={editingRecipe}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingRecipe(null)}
          />
        </Modal>
      )}
    </div>
  );
}
