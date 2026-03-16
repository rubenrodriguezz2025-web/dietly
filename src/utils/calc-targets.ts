import type { Patient, PatientGoal } from '@/types/dietly';

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const GOAL_CALORIE_ADJ: Record<PatientGoal, number> = {
  weight_loss: -400,
  weight_gain: 300,
  maintenance: 0,
  muscle_gain: 300,
  health: 0,
};

// g/kg de peso corporal — punto medio del rango clínico por objetivo
const PROTEIN_PER_KG: Record<PatientGoal, number> = {
  weight_loss: 1.8,  // rango 1.6–2.0 g/kg
  weight_gain: 2.0,  // rango 1.8–2.2 g/kg
  maintenance: 1.6,  // rango 1.4–1.8 g/kg
  muscle_gain: 2.0,  // rango 1.8–2.2 g/kg
  health: 1.5,       // rango 1.4–1.6 g/kg
};

// Fracción de calorías restantes (tras proteína) asignadas a carbohidratos
const CARBS_RATIO: Record<PatientGoal, number> = {
  weight_loss: 0.50,
  weight_gain: 0.60,
  maintenance: 0.55,
  muscle_gain: 0.60,
  health: 0.55,
};

export type CalcTargets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_per_kg: number;
  carbs_pct: number;
  fat_pct: number;
};

export type MacroOverrides = Partial<{
  calories: number;
  protein_per_kg: number;
  carbs_pct: number;
}>;

export function calcTargets(patient: Patient, overrides?: MacroOverrides): CalcTargets {
  let tdee = patient.tdee;
  if (
    !tdee &&
    patient.weight_kg &&
    patient.height_cm &&
    patient.date_of_birth &&
    patient.sex &&
    patient.sex !== 'other'
  ) {
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    const base = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * age;
    const tmb = patient.sex === 'male' ? base + 5 : base - 161;
    const factor = patient.activity_level ? (ACTIVITY_FACTORS[patient.activity_level] ?? 1.375) : 1.375;
    tdee = Math.round(tmb * factor);
  }

  const baseTdee = tdee ?? 2000;
  const goal = patient.goal ?? 'health';
  const adj = GOAL_CALORIE_ADJ[goal];
  const calories = overrides?.calories ?? baseTdee + adj;

  const weight = patient.weight_kg ?? 70;
  const protein_per_kg = overrides?.protein_per_kg ?? PROTEIN_PER_KG[goal];
  const protein_g = Math.round(weight * protein_per_kg);
  const protein_kcal = protein_g * 4;
  const remaining_kcal = Math.max(calories - protein_kcal, 0);

  const carbs_pct = overrides?.carbs_pct ?? CARBS_RATIO[goal];
  const fat_pct = 1 - carbs_pct;
  const carbs_g = Math.round((remaining_kcal * carbs_pct) / 4);
  const fat_g = Math.round((remaining_kcal * fat_pct) / 9);

  return { calories, protein_g, carbs_g, fat_g, protein_per_kg, carbs_pct, fat_pct };
}
