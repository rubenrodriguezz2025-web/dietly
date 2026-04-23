'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { logAIRequest } from '@/libs/ai/logger';
import { SYSTEM_PROMPT_DIETISTA } from '@/libs/ai/plan-prompts';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeValuesSource } from '@/types/dietly';
import { getEnvVar } from '@/utils/get-env-var';
import Anthropic from '@anthropic-ai/sdk';

// ── Imagen de receta: constantes ──────────────────────────────────────────────

const RECIPE_IMAGE_BUCKET = 'recipe-images';
const MAX_RECIPE_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_RECIPE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RECIPE_IMAGE_URL_TTL = 60 * 60; // 1 hora

export type RecipeWithImage = Recipe & { image_signed_url: string | null };

async function enrichWithSignedUrls(recipes: Recipe[]): Promise<RecipeWithImage[]> {
  const withImage = recipes.filter((r) => r.image_url);
  if (withImage.length === 0) {
    return recipes.map((r) => ({ ...r, image_signed_url: null }));
  }

  const { data: signed } = await supabaseAdminClient.storage
    .from(RECIPE_IMAGE_BUCKET)
    .createSignedUrls(withImage.map((r) => r.image_url!), RECIPE_IMAGE_URL_TTL);

  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  return recipes.map((r) => ({
    ...r,
    image_signed_url: r.image_url ? urlByPath.get(r.image_url) ?? null : null,
  }));
}

// ── Obtener recetas del nutricionista ─────────────────────────────────────────

export async function getRecipes(): Promise<{ recipes?: RecipeWithImage[]; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('nutritionist_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Error cargando las recetas.' };

  const enriched = await enrichWithSignedUrls((data as Recipe[]) ?? []);
  return { recipes: enriched };
}

// ── Subir imagen de receta ────────────────────────────────────────────────────

export async function uploadRecipeImage(
  recipeId: string,
  formData: FormData,
): Promise<{ image_signed_url?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona una imagen.' };
  }
  if (!ALLOWED_RECIPE_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Formato no permitido. Usa JPG, PNG o WebP.' };
  }
  if (file.size > MAX_RECIPE_IMAGE_SIZE) {
    return { error: 'La imagen supera el límite de 5 MB.' };
  }

  // Verificar que la receta pertenece al nutricionista
  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, image_url')
    .eq('id', recipeId)
    .eq('nutritionist_id', user.id)
    .maybeSingle();

  if (!recipe) return { error: 'Receta no encontrada.' };

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${user.id}/${recipeId}.${ext}`;

  // Si existía una imagen previa con distinta extensión, la borramos
  const prevPath = (recipe as { image_url: string | null }).image_url;
  if (prevPath && prevPath !== path) {
    await supabaseAdminClient.storage.from(RECIPE_IMAGE_BUCKET).remove([prevPath]);
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await supabaseAdminClient.storage
    .from(RECIPE_IMAGE_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadErr) return { error: 'Error al subir la imagen.' };

  const { error: dbErr } = await supabase
    .from('recipes')
    .update({ image_url: path, updated_at: new Date().toISOString() })
    .eq('id', recipeId)
    .eq('nutritionist_id', user.id);

  if (dbErr) return { error: 'Error al guardar la imagen en la receta.' };

  const { data: signed } = await supabaseAdminClient.storage
    .from(RECIPE_IMAGE_BUCKET)
    .createSignedUrl(path, RECIPE_IMAGE_URL_TTL);

  revalidatePath('/dashboard/recetas');
  return { image_signed_url: signed?.signedUrl ?? '' };
}

// ── Eliminar imagen de receta ─────────────────────────────────────────────────

export async function deleteRecipeImage(recipeId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, image_url')
    .eq('id', recipeId)
    .eq('nutritionist_id', user.id)
    .maybeSingle() as { data: { id: string; image_url: string | null } | null };

  if (!recipe) return { error: 'Receta no encontrada.' };
  if (!recipe.image_url) return {};

  await supabaseAdminClient.storage.from(RECIPE_IMAGE_BUCKET).remove([recipe.image_url]);

  const { error } = await supabase
    .from('recipes')
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq('id', recipeId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error al eliminar la imagen.' };

  revalidatePath('/dashboard/recetas');
  return {};
}

// ── Crear receta ──────────────────────────────────────────────────────────────

export type CreateRecipeInput = {
  name: string;
  category: RecipeCategory | null;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string;
  notes: string;
  calories_per_serving: number | null;
  protein_g_per_serving: number | null;
  carbs_g_per_serving: number | null;
  fat_g_per_serving: number | null;
  values_source: RecipeValuesSource;
};

export async function createRecipe(
  input: CreateRecipeInput
): Promise<{ recipe?: Recipe; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...input, nutritionist_id: user.id })
    .select('*')
    .single();

  if (error) return { error: 'Error guardando la receta.' };

  revalidatePath('/dashboard/recetas');
  return { recipe: data as Recipe };
}

// ── Actualizar receta ─────────────────────────────────────────────────────────

export async function updateRecipe(
  id: string,
  input: Partial<CreateRecipeInput>
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('recipes')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error actualizando la receta.' };

  revalidatePath('/dashboard/recetas');
  return {};
}

// ── Eliminar receta ───────────────────────────────────────────────────────────

export async function deleteRecipe(id: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error eliminando la receta.' };

  revalidatePath('/dashboard/recetas');
  return {};
}

// ── Calcular macros con IA ────────────────────────────────────────────────────

export async function calculateRecipeMacros(
  name: string,
  ingredients: RecipeIngredient[],
  servings: number
): Promise<{
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const ingredientsList = ingredients
    .map((ing) => `- ${ing.name}: ${ing.quantity} ${ing.unit}`)
    .join('\n');

  const calcTool: Anthropic.Tool = {
    name: 'calculate_recipe_macros',
    description: 'Calcula los macronutrientes y calorías por ración de una receta',
    input_schema: {
      type: 'object',
      properties: {
        total_calories: { type: 'number', description: 'Calorías totales de la receta completa' },
        total_protein_g: { type: 'number' },
        total_carbs_g: { type: 'number' },
        total_fat_g: { type: 'number' },
        calories_per_serving: { type: 'number', description: 'Calorías por ración' },
        protein_g_per_serving: { type: 'number' },
        carbs_g_per_serving: { type: 'number' },
        fat_g_per_serving: { type: 'number' },
      },
      required: [
        'total_calories', 'total_protein_g', 'total_carbs_g', 'total_fat_g',
        'calories_per_serving', 'protein_g_per_serving', 'carbs_g_per_serving', 'fat_g_per_serving',
      ],
    },
  };

  const prompt = `Calcula los macronutrientes y calorías de esta receta basándote en sus ingredientes.

Receta: ${name}
Número de raciones: ${servings}
Ingredientes:
${ingredientsList}

Usa la herramienta calculate_recipe_macros para devolver el resultado por ración y total.`;

  try {
    const anthropic = new Anthropic({
      apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT_DIETISTA,
      tools: [calcTool],
      tool_choice: { type: 'tool', name: 'calculate_recipe_macros' },
      messages: [{ role: 'user', content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { error: 'No se pudo calcular. Inténtalo de nuevo.' };
    }

    void logAIRequest({
      nutritionistId: user.id,
      sessionPatientId: crypto.randomUUID(),
      planId: 'recipe_calc',
      modelVersion: 'claude-sonnet-4-6',
      requestType: 'calculate_recipe_macros',
      prompt,
      responseSummary: JSON.stringify(toolUse.input),
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      costUsd: Math.round(
        (response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015) * 1_000_000
      ) / 1_000_000,
    });

    const result = toolUse.input as {
      calories_per_serving: number;
      protein_g_per_serving: number;
      carbs_g_per_serving: number;
      fat_g_per_serving: number;
    };

    return {
      calories: Math.round(result.calories_per_serving),
      protein_g: Math.round(result.protein_g_per_serving),
      carbs_g: Math.round(result.carbs_g_per_serving),
      fat_g: Math.round(result.fat_g_per_serving),
    };
  } catch {
    return { error: 'Error llamando a la IA. Inténtalo de nuevo.' };
  }
}
