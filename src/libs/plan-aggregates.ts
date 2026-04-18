/**
 * Recalcula de forma determinística los agregados de un plan semanal tras una
 * edición local (editar un día o aceptar un intercambio de plato), sin tener
 * que invocar a la IA. Devuelve promedios semanales y lista de la compra.
 *
 * Las reglas de categorización replican SHOPPING_LIST_TOOL en plan-prompts.ts
 * con un clasificador por palabras clave. Default: produce.
 */

import type { PlanDay, ShoppingList } from '@/types/dietly';

import { aggregateShoppingList } from './shopping-list';

type Category = 'produce' | 'protein' | 'dairy' | 'grains' | 'pantry';

// Keywords en minúsculas y sin tildes (el texto se normaliza antes de comparar)
const PROTEIN_WORDS = [
  // Aves y carnes
  'pollo', 'pavo', 'pato',
  'ternera', 'buey', 'vaca', 'cerdo', 'cordero', 'conejo', 'cabrito', 'carne picada',
  'pechuga', 'muslo', 'contramuslo', 'solomillo', 'lomo', 'filete', 'entrecot', 'chuleton', 'chuleta',
  'carne',
  // Pescados y mariscos
  'pescado', 'atun', 'salmon', 'merluza', 'bacalao', 'dorada', 'lubina', 'sardina', 'sardinas',
  'trucha', 'caballa', 'rape', 'lenguado', 'rodaballo', 'boqueron', 'boquerones', 'anchoa', 'anchoas',
  'gamba', 'gambas', 'langostino', 'langostinos', 'mejillon', 'mejillones', 'calamar', 'calamares',
  'pulpo', 'sepia', 'chipiron', 'marisco', 'vieira', 'almeja', 'almejas', 'navaja', 'navajas',
  // Huevos
  'huevo', 'huevos', 'clara', 'claras',
  // Embutidos y fiambres
  'jamon', 'chorizo', 'salchichon', 'salami', 'mortadela', 'bacon', 'lacon', 'embutido',
  'fiambre', 'fuet', 'sobrasada', 'panceta', 'butifarra', 'cecina', 'pavo cocido',
  // Legumbres y proteína vegetal
  'lenteja', 'lentejas', 'garbanzo', 'garbanzos', 'alubia', 'alubias', 'judia blanca', 'judias blancas',
  'frijol', 'frijoles', 'haba', 'habas', 'soja', 'tofu', 'tempeh', 'seitan', 'edamame',
  'hummus',
  'proteina en polvo', 'protein',
];

const DAIRY_WORDS = [
  'leche', 'yogur', 'yogurt',
  'queso', 'mozzarella', 'parmesano', 'feta', 'cheddar', 'manchego', 'burgos', 'ricotta', 'mascarpone',
  'cuajada', 'kefir', 'nata', 'mantequilla', 'crema de leche', 'skyr',
  'bebida vegetal', 'bebida de almendra', 'bebida de almendras', 'bebida de soja',
  'bebida de avena', 'bebida de arroz', 'bebida de coco',
];

const GRAINS_WORDS = [
  'pan', 'baguette', 'pita', 'tortilla de trigo', 'tortilla de maiz', 'wrap',
  'arroz', 'pasta', 'fideo', 'fideos', 'espagueti', 'espaguetis', 'macarron', 'macarrones',
  'tallarin', 'tallarines', 'penne', 'fusilli', 'lasana', 'lasagna', 'raviolis',
  'cereal', 'cereales', 'muesli', 'avena', 'copos de avena', 'granola',
  'harina', 'semola', 'polenta',
  'quinoa', 'couscous', 'cuscus', 'bulgur', 'mijo', 'trigo sarraceno', 'cebada', 'centeno', 'espelta',
  'galleta', 'galletas', 'tosta', 'tostada',
];

const PANTRY_WORDS = [
  // Aceites y vinagres
  'aceite', 'vinagre',
  // Sal y especias
  'sal', 'pimienta', 'especia', 'especias',
  'oregano', 'comino', 'pimenton', 'azafran', 'curry', 'tomillo', 'romero', 'laurel',
  'canela', 'nuez moscada', 'clavo', 'anis', 'cardamomo',
  'ajo en polvo', 'cebolla en polvo', 'hierbas provenzales',
  // Salsas y condimentos
  'salsa', 'mostaza', 'ketchup', 'mayonesa', 'tabasco', 'soja', 'tamari', 'sriracha',
  'miso', 'tahini', 'pesto',
  // Frutos secos y semillas
  'fruto seco', 'frutos secos', 'nuez', 'nueces', 'almendra', 'almendras',
  'avellana', 'avellanas', 'pistacho', 'pistachos', 'anacardo', 'anacardos',
  'cacahuete', 'cacahuetes', 'mani', 'pipa', 'pipas',
  'semilla', 'semillas', 'chia', 'lino', 'sesamo',
  // Dulces y bebidas de despensa
  'chocolate', 'cacao', 'miel', 'azucar', 'edulcorante', 'stevia', 'sirope',
  'cafe', 'te', 'infusion', 'infusiones',
  // Conservas y legumbres secas no identificadas antes
  'conserva', 'conservas', 'lata', 'bote',
  'caldo', 'caldos',
  // Harinas alternativas que son más pantry que grain
  'levadura', 'levadura quimica',
];

const NORMALIZE_REGEX = /[\u0300-\u036f]/g;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(NORMALIZE_REGEX, '').trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(text: string, keyword: string): boolean {
  const re = new RegExp(`\\b${escapeRegex(keyword)}\\b`);
  return re.test(text);
}

function categorize(name: string): Category {
  const n = normalize(name);
  if (PROTEIN_WORDS.some((kw) => hasWord(n, kw))) return 'protein';
  if (DAIRY_WORDS.some((kw) => hasWord(n, kw))) return 'dairy';
  if (GRAINS_WORDS.some((kw) => hasWord(n, kw))) return 'grains';
  if (PANTRY_WORDS.some((kw) => hasWord(n, kw))) return 'pantry';
  return 'produce';
}

function formatIngredient(i: { name: string; quantity: number; unit: string }): string {
  const qty = i.quantity;
  const unit = (i.unit || '').toLowerCase().trim();
  if (!qty || qty <= 0 || !unit) return i.name.trim();

  if (unit === 'g' || unit === 'gr' || unit === 'gramo' || unit === 'gramos') {
    return `${i.name.trim()} ${Math.round(qty)}g`;
  }
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilos' || unit === 'kilogramo' || unit === 'kilogramos') {
    return `${i.name.trim()} ${qty}kg`;
  }
  if (unit === 'ml' || unit === 'mililitro' || unit === 'mililitros') {
    return `${i.name.trim()} ${Math.round(qty)}ml`;
  }
  if (unit === 'l' || unit === 'litro' || unit === 'litros') {
    return `${i.name.trim()} ${qty}l`;
  }
  if (['ud', 'uds', 'u', 'unidad', 'unidades'].includes(unit)) {
    return `${i.name.trim()} x${Math.round(qty)}`;
  }
  return `${i.name.trim()} ${qty} ${unit}`;
}

/**
 * Recalcula los agregados del plan (promedios semanales + lista de la compra)
 * a partir del array de días. No hace llamadas a la IA.
 */
export function recalcPlanAggregates(days: PlanDay[]): {
  weekly_averages: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  shopping_list: ShoppingList;
} {
  const count = Math.max(days.length, 1);
  const totals = days.reduce(
    (acc, d) => {
      acc.calories += d.total_calories || 0;
      acc.protein_g += d.total_macros?.protein_g || 0;
      acc.carbs_g += d.total_macros?.carbs_g || 0;
      acc.fat_g += d.total_macros?.fat_g || 0;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const weekly_averages = {
    calories: Math.round(totals.calories / count),
    protein_g: Math.round(totals.protein_g / count),
    carbs_g: Math.round(totals.carbs_g / count),
    fat_g: Math.round(totals.fat_g / count),
  };

  const buckets: Record<Category, string[]> = {
    produce: [],
    protein: [],
    dairy: [],
    grains: [],
    pantry: [],
  };

  for (const day of days) {
    for (const meal of day.meals ?? []) {
      for (const ing of meal.ingredients ?? []) {
        if (!ing.name?.trim()) continue;
        const cat = categorize(ing.name);
        buckets[cat].push(formatIngredient(ing));
      }
    }
  }

  const shopping_list: ShoppingList = {
    produce: aggregateShoppingList(buckets.produce),
    protein: aggregateShoppingList(buckets.protein),
    dairy: aggregateShoppingList(buckets.dairy),
    grains: aggregateShoppingList(buckets.grains),
    pantry: aggregateShoppingList(buckets.pantry),
  };

  return { weekly_averages, shopping_list };
}
