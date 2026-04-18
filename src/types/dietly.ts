// Tipos para las tablas propias de Dietly
// Actualizar cuando se regenere types.ts desde Supabase

export type Specialty = 'weight_loss' | 'sports' | 'clinical' | 'general';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';
export type PatientGoal =
  | 'weight_loss'
  | 'weight_gain'
  | 'maintenance'
  | 'muscle_gain'
  | 'health';
export type PlanStatus = 'generating' | 'draft' | 'approved' | 'sent' | 'error';

// ── Plan content types ────────────────────────────────────────────────────────

export type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type Meal = {
  meal_type: string;
  meal_name: string;
  time_suggestion: string;
  calories: number;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
  ingredients: Ingredient[];
  preparation: string;
  notes: string;
};

export type DayStatus = 'pending' | 'approved' | 'regenerating';

export type PlanDay = {
  day_number: number;
  day_name: string;
  day_theme?: string;
  total_calories: number;
  total_macros: { protein_g: number; carbs_g: number; fat_g: number };
  meals: Meal[];
  day_status?: DayStatus;
  approved_at?: string | null;
};

export type ShoppingList = {
  produce: string[];
  protein: string[];
  dairy: string[];
  grains: string[];
  pantry: string[];
};

/**
 * Snapshot de la marca/toggles del nutricionista capturado en el momento de
 * aprobar el plan. Evita que cambios posteriores en el perfil modifiquen
 * retroactivamente planes ya aprobados/enviados.
 */
export type BrandingSnapshot = {
  show_macros: boolean | null;
  show_shopping_list: boolean | null;
  primary_color: string | null;
  font_preference: string | null;
  logo_url: string | null;
  clinic_name: string | null;
  college_number: string | null;
  welcome_message: string | null;
};

export type PlanContent = {
  week_summary: {
    target_daily_calories: number;
    target_macros: { protein_g: number; carbs_g: number; fat_g: number };
    weekly_averages: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    // Criterios usados para validación por el nutricionista
    protein_per_kg?: number;
    carbs_pct?: number;
    fat_pct?: number;
    goal?: string;
  };
  days: PlanDay[];
  shopping_list: ShoppingList;
  branding_snapshot?: BrandingSnapshot;
};

export type Profile = {
  id: string;
  full_name: string;
  clinic_name: string | null;
  logo_url: string | null;
  signature_url: string | null;
  college_number: string | null;
  specialty: Specialty;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  nutritionist_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  sex: 'male' | 'female' | 'other' | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  goal: PatientGoal | null;
  dietary_restrictions: string[] | null;
  allergies: string | null;
  intolerances: string | null;
  preferences: string | null;
  medical_notes: string | null;
  allow_meal_swaps: boolean;
  tmb: number | null;
  tdee: number | null;
  created_at: string;
  updated_at: string;
};

export type PatientProgress = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  /** Formato 'YYYY-MM-DD' */
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  /** Adherencia al plan: 1=muy baja, 2=baja, 3=regular, 4=buena, 5=excelente */
  adherence_score: number | null;
  /** Se generó un nuevo plan en esta revisión */
  new_plan_generated: boolean;
  notes: string | null;
  created_at: string;
};

export type NutritionPlan = {
  id: string;
  nutritionist_id: string;
  patient_id: string;
  status: PlanStatus;
  week_start_date: string;
  content: unknown;
  patient_token: string;
  sent_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  generated_at: string | null;
  /** Modelo de IA usado para generar el plan (p.ej. "claude-sonnet-4-6") */
  ai_model: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeCategory = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'snack';
export type RecipeValuesSource = 'ai_estimated' | 'nutritionist_verified';

export type RecipeIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: string;
  nutritionist_id: string;
  name: string;
  category: RecipeCategory | null;
  servings: number;
  ingredients: RecipeIngredient[] | null;
  instructions: string | null;
  notes: string | null;
  calories_per_serving: number | null;
  protein_g_per_serving: number | null;
  carbs_g_per_serving: number | null;
  fat_g_per_serving: number | null;
  values_source: RecipeValuesSource;
  created_at: string;
  updated_at: string;
};

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  snack: 'Snack',
};

// Labels legibles para mostrar en UI
export const SPECIALTY_LABELS: Record<Specialty, string> = {
  weight_loss: 'Pérdida de peso',
  sports: 'Deportiva',
  clinical: 'Clínica',
  general: 'General',
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario (sin ejercicio)',
  lightly_active: 'Ligero (1-3 días/semana)',
  moderately_active: 'Moderado (3-5 días/semana)',
  very_active: 'Activo (6-7 días/semana)',
  extra_active: 'Muy activo (2x/día o trabajo físico)',
};

export const GOAL_LABELS: Record<PatientGoal, string> = {
  weight_loss: 'Pérdida de peso',
  weight_gain: 'Ganancia de peso',
  maintenance: 'Mantenimiento',
  muscle_gain: 'Ganancia muscular',
  health: 'Mejorar salud general',
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  generating: 'Generando...',
  draft: 'Borrador',
  approved: 'Aprobado',
  sent: 'Enviado',
  error: 'Error',
};

export type MealSwapStatus = 'pending' | 'approved' | 'rejected';
export type MealSwapInitiator = 'patient' | 'nutritionist';

export type MealSwap = {
  id: string;
  plan_id: string;
  patient_id: string;
  nutritionist_id: string;
  day_number: number;
  meal_index: number;
  original_meal: Meal;
  selected_meal: Meal;
  alternatives: Meal[];
  reason: string | null;
  status: MealSwapStatus;
  initiated_by: MealSwapInitiator;
  reverted_at: string | null;
  notification_sent_at: string | null;
  created_at: string;
};

export const SEX_LABELS = {
  male: 'Hombre',
  female: 'Mujer',
  other: 'Otro',
} as const;
