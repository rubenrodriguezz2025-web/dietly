/**
 * Prompts, herramientas y utilidades compartidas para la generación de planes
 * nutricionales con la API de Anthropic.
 *
 * Centraliza:
 *  - SYSTEM_PROMPT_DIETISTA: rol fijo que va en el campo `system` de cada llamada
 *  - SHOPPING_LIST_TOOL: definición de tool compartida entre route y actions
 *  - buildShoppingListPrompt: constructor del prompt de lista de la compra
 *  - filterRecipesForPatient: filtra recetas por relevancia para el paciente (Opt B)
 *  - computeIngredientsFingerprint: huella de ingredientes para cachear lista de la compra (Opt C)
 */

import type { PseudonymizedPatient } from '@/libs/ai/pseudonymize';
import type { PatientGoal, PlanDay, Recipe } from '@/types/dietly';
import type Anthropic from '@anthropic-ai/sdk';

// ── Sistema compartido ────────────────────────────────────────────────────────

/**
 * Prompt de sistema que define el rol del modelo en todas las llamadas de
 * generación de planes. Va en el campo `system` de `messages.create()`,
 * no en el mensaje de usuario, para evitar repetirlo en cada llamada.
 *
 * Ahorro estimado: ~40-60 tokens × número de llamadas por plan (≥ 8).
 */
export const SYSTEM_PROMPT_DIETISTA =
  'Eres un dietista-nutricionista experto especializado en nutrición mediterránea española. ' +
  'Cuando calculas macronutrientes, usas valores de referencia estándar (kcal/g). ' +
  'Cuando generas planes nutricionales, creas comidas prácticas con alimentos cotidianos ' +
  'españoles, respetando siempre las restricciones dietéticas, alergias e intolerancias ' +
  'del paciente. Tus respuestas son precisas y estructuradas según el schema solicitado.';

// ── Herramienta de lista de la compra ─────────────────────────────────────────

/**
 * Definición de tool compartida entre el route de generación y la acción de
 * regeneración de días, para evitar duplicar el schema JSON.
 */
export const SHOPPING_LIST_TOOL: Anthropic.Tool = {
  name: 'generate_shopping_list',
  description: 'Genera la lista de la compra consolidada y categorizada para el plan semanal completo',
  input_schema: {
    type: 'object',
    properties: {
      produce: {
        type: 'array',
        items: { type: 'string' },
        description: 'Frutas y verduras ÚNICAMENTE (no incluir carnes, embutidos ni lácteos)',
      },
      protein: {
        type: 'array',
        items: { type: 'string' },
        description: 'Carnes, pescados, huevos, legumbres, embutidos y derivados cárnicos',
      },
      dairy: {
        type: 'array',
        items: { type: 'string' },
        description: 'Leche, yogur, queso, bebidas vegetales',
      },
      grains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pan, arroz, pasta, cereales, avena, harinas',
      },
      pantry: {
        type: 'array',
        items: { type: 'string' },
        description: 'Aceites, condimentos, especias, conservas, frutos secos, salsas',
      },
    },
    required: ['produce', 'protein', 'dairy', 'grains', 'pantry'],
  },
};

// ── Prompt de lista de la compra ──────────────────────────────────────────────

/** Construye el mensaje de usuario para generar la lista de la compra. */
export function buildShoppingListPrompt(days: PlanDay[]): string {
  const allIngredients = days
    .flatMap((d) => d.meals)
    .flatMap((m) => m.ingredients)
    .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
    .join('\n');

  return `A partir de los ingredientes del plan semanal, genera una lista de la compra consolidada y categorizada.

INGREDIENTES DEL PLAN:
${allIngredients}

REGLAS DE CATEGORIZACIÓN ESTRICTAS:
- "produce": frutas y verduras ÚNICAMENTE (no incluir carnes, embutidos ni lácteos)
- "protein": carnes, pescados, huevos, legumbres, embutidos y derivados cárnicos
- "dairy": leche, yogur, queso, bebidas vegetales
- "grains": pan, arroz, pasta, cereales, avena, harinas
- "pantry": aceites, condimentos, especias, conservas, frutos secos, salsas

Si tienes dudas sobre un alimento, prioriza la categoría "protein" para cualquier alimento de origen animal.

Agrupa los ingredientes similares y suma cantidades cuando aparezcan varias veces (ej: "Pechuga de pollo 800g").
Usa la herramienta generate_shopping_list para devolver la lista estructurada.`;
}

// ── Filtrado de recetas (Optimización B) ──────────────────────────────────────

// Ingredientes de origen animal para el filtro vegano/vegetariano
const ANIMAL_PROTEINS = [
  'pollo', 'carne', 'ternera', 'cerdo', 'jamón', 'atún', 'salmón',
  'merluza', 'gambas', 'langostino', 'bacalao', 'sardina', 'caballa',
  'pavo', 'conejo', 'cordero', 'buey', 'lomo', 'chorizo', 'morcilla',
  'fuet', 'salchich', 'anchoa', 'boquerón',
];
const DAIRY_INGREDIENTS = ['leche', 'yogur', 'queso', 'mantequilla', 'nata', 'crema de leche'];

function scoreRecipeForGoal(recipe: Recipe, goal: PatientGoal | null): number {
  let score = 0;
  const protein = recipe.protein_g_per_serving ?? 0;
  const calories = recipe.calories_per_serving ?? 0;

  if (goal === 'muscle_gain' || goal === 'weight_gain') {
    if (protein >= 25) score += 3;
    else if (protein >= 15) score += 1;
  } else if (goal === 'weight_loss') {
    if (calories > 0 && calories <= 350) score += 3;
    else if (calories > 0 && calories <= 500) score += 1;
  } else {
    // maintenance, health: preferencia ligera por recetas equilibradas
    if (protein >= 15 && calories > 0 && calories <= 600) score += 1;
  }
  return score;
}

/**
 * Filtra y puntúa las recetas del nutricionista para seleccionar las más
 * relevantes para el paciente actual. Reduce el tamaño del prompt hasta un
 * 75% en la sección de recetas (de 20 recetas a ≤5).
 *
 * Criterios de exclusión:
 *  - Recetas con ingredientes que coincidan con alergias/intolerancias del paciente
 *  - Recetas incompatibles con restricciones veganas/vegetarianas
 *
 * Criterios de puntuación:
 *  - Alineación con el objetivo del paciente (proteína alta, calorías bajas, etc.)
 */
export function filterRecipesForPatient(
  recipes: Recipe[],
  patient: PseudonymizedPatient,
  maxRecipes = 5
): Recipe[] {
  if (recipes.length === 0) return [];

  const restrictions = patient.dietary_restrictions ?? [];
  const isVegan = restrictions.some((r) => r === 'vegan' || r === 'vegano');
  const isVegetarian = isVegan || restrictions.some((r) => r === 'vegetarian' || r === 'vegetariano');

  // Palabras clave de alergias/intolerancias (texto libre del paciente)
  const allergyKeywords = [patient.allergies ?? '', patient.intolerances ?? '']
    .join(' ')
    .toLowerCase()
    .split(/[\s,;/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 3);

  function hasAllergen(recipe: Recipe): boolean {
    if (allergyKeywords.length === 0) return false;
    const ingNames = (recipe.ingredients ?? []).map((i) => i.name.toLowerCase());
    return allergyKeywords.some((kw) => ingNames.some((ing) => ing.includes(kw)));
  }

  function isIncompatibleWithDiet(recipe: Recipe): boolean {
    if (!isVegan && !isVegetarian) return false;
    const ingNames = (recipe.ingredients ?? []).map((i) => i.name.toLowerCase());
    const hasAnimalProtein = ANIMAL_PROTEINS.some((ap) => ingNames.some((ing) => ing.includes(ap)));
    const hasDairy = DAIRY_INGREDIENTS.some((d) => ingNames.some((ing) => ing.includes(d)));
    if (isVegan && (hasAnimalProtein || hasDairy)) return true;
    if (isVegetarian && hasAnimalProtein) return true;
    return false;
  }

  return recipes
    .filter((r) => r.name && (r.ingredients ?? []).length > 0)
    .filter((r) => !hasAllergen(r))
    .filter((r) => !isIncompatibleWithDiet(r))
    .map((r) => ({ recipe: r, score: scoreRecipeForGoal(r, patient.goal) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecipes)
    .map(({ recipe }) => recipe);
}

// ── Huella de ingredientes (Optimización C) ───────────────────────────────────

/**
 * Genera una huella determinista de los ingredientes de todos los días del plan.
 * Permite detectar si el contenido cambió entre dos versiones del plan para
 * decidir si hay que regenerar la lista de la compra o reutilizar la existente.
 *
 * La huella es solo una cadena ordenada de nombres de ingredientes en minúsculas —
 * no un hash criptográfico — porque solo necesitamos igualdad, no seguridad.
 */
export function computeIngredientsFingerprint(days: PlanDay[]): string {
  return days
    .flatMap((d) => d.meals)
    .flatMap((m) => m.ingredients)
    .map((i) => i.name.toLowerCase().trim())
    .sort()
    .join('|');
}
