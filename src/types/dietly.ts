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
export type PlanStatus = 'draft' | 'approved' | 'sent';

export type Profile = {
  id: string;
  full_name: string;
  clinic_name: string | null;
  specialty: Specialty;
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

export type NutritionPlan = {
  id: string;
  nutritionist_id: string;
  patient_id: string;
  status: PlanStatus;
  week_start_date: string;
  content: unknown;
  patient_token: string;
  sent_at: string | null;
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
  draft: 'Borrador',
  approved: 'Aprobado',
  sent: 'Enviado',
};

export const SEX_LABELS = {
  male: 'Hombre',
  female: 'Mujer',
  other: 'Otro',
} as const;
