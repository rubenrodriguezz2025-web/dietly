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

export type PlanDay = {
  day_number: number;
  day_name: string;
  total_calories: number;
  total_macros: { protein_g: number; carbs_g: number; fat_g: number };
  meals: Meal[];
};

export type ShoppingList = {
  produce: string[];
  protein: string[];
  dairy: string[];
  grains: string[];
  pantry: string[];
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
  date_of_birth: string | null;
  sex: 'male' | 'female' | 'other' | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  goal: PatientGoal | null;
  dietary_restrictions: string | null;
  allergies: string | null;
  intolerances: string | null;
  preferences: string | null;
  medical_notes: string | null;
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

export const SEX_LABELS = {
  male: 'Hombre',
  female: 'Mujer',
  other: 'Otro',
} as const;
