import type { Patient, PatientGoal } from '@/types/dietly';

// ── Actividad física ──────────────────────────────────────────────────────────
// Factores de Mifflin-St Jeor estándar validados en población adulta (SENC 2022)
const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  extra_active:      1.9,
};

// ── Proteína por kg de peso ───────────────────────────────────────────────────
// Valores centrales de los rangos publicados en ISSN 2017, ESPEN 2019, SENC 2022.
// Se aplica sobre PESO AJUSTADO en obesidad (ver calcProteinWeight) para evitar
// sobreprescripción en pacientes con alto porcentaje graso.
const PROTEIN_PER_KG: Record<PatientGoal, number> = {
  weight_loss: 2.0,  // déficit: alta proteína preserva masa muscular (ESPEN 2019: 1.8–2.2 g/kg)
  weight_gain: 1.8,  // superávit calórico: menor ratio relativo necesario (ISSN: 1.6–2.0 g/kg)
  maintenance: 1.6,  // mantenimiento: rango medio SENC 2022 (1.4–1.8 g/kg)
  muscle_gain: 2.2,  // hipertrofia: punto alto del rango ISSN 2017 (1.8–2.2 g/kg)
  health:      1.4,  // salud general: OMS ≥ 0.83 g/kg; SENC recomienda 1.2–1.6 g/kg
};

// Caps y floors absolutos de proteína (independientes del peso corporal)
// Cap: el ISSN no evidencia beneficio adicional por encima de ~2.2 g/kg de peso ideal
const PROTEIN_MAX_G = 240;
// Floor: necesidad mínima para evitar catabolismo nitrogenado severo (OMS 0.83 g/kg × 60 kg)
const PROTEIN_MIN_G = 50;
// Cap adicional: proteína nunca debe superar el 40% del total calórico
// (distribución clínicamente inviable y arriesgada renalmente en planes largos)
const PROTEIN_MAX_PCT_OF_CALORIES = 0.40;

// ── Distribución carbs/grasa ──────────────────────────────────────────────────
// Fracción de kcal RESTANTES (tras proteína) asignadas a carbohidratos.
// Grasa = 1 - carbs_pct de esas kcal restantes.
// Basado en patrón mediterráneo español (SENC 2022) por objetivo clínico.
const CARBS_RATIO: Record<PatientGoal, number> = {
  weight_loss: 0.45, // mayor fracción grasa → saciedad y perfil lipídico en déficit (SENC)
  weight_gain: 0.65, // prioridad de CHO para cubrir superávit energético (ISSN)
  maintenance: 0.55, // equilibrio mediterráneo estándar
  muscle_gain: 0.65, // CHO prioritarios para glucógeno y síntesis proteica (ISSN 2017)
  health:      0.60, // patrón mediterráneo español: ~55–65% CHO del total calórico (SENC)
};

// ── Floor calórico mínimo ─────────────────────────────────────────────────────
// Límites mínimos para planes ambulatorios seguros según sexo (SENC 2022).
// Por debajo de estos valores el riesgo de déficit de micronutrientes es inaceptable.
const MIN_CALORIES: Record<'male' | 'female' | 'other', number> = {
  male:   1400,
  female: 1200,
  other:  1200, // conservador ante incertidumbre de composición corporal
};

// ── Tipos exportados ──────────────────────────────────────────────────────────

export type CalcTargets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_per_kg: number; // ratio efectivo = protein_g / peso_real_kg (para mostrar en UI)
  carbs_pct: number;
  fat_pct: number;
};

export type MacroOverrides = Partial<{
  calories: number;
  protein_per_kg: number;
  carbs_pct: number;
}>;

// ── Funciones auxiliares ──────────────────────────────────────────────────────

// Peso ideal (IBW) — fórmula Robinson adaptada a centímetros (referencia ASPEN 2016).
// Clínicamente equivalente a Devine para talla media española (165–175 cm).
function calcIBW(height_cm: number, sex: 'male' | 'female'): number {
  // Hombre: ~52 kg a 152 cm + 1.9 kg/cm → simplificado: altura_cm - 100
  // Mujer:  ~49 kg a 152 cm + 1.7 kg/cm → simplificado: altura_cm - 105
  return Math.max(sex === 'male' ? height_cm - 100 : height_cm - 105, 40);
}

// Peso ajustado para cálculo de proteína en pacientes con obesidad (IMC > 30).
// Solo ajustar cuando el peso real supera el 120% del IBW (zona de obesidad real).
// Fórmula: AdjBW = IBW + 0.25 × (pesoReal − IBW) — consenso ASPEN/ESPEN.
function calcProteinWeight(
  weight_kg: number,
  height_cm: number | null,
  sex: 'male' | 'female' | 'other' | null
): number {
  if (!height_cm || !sex || sex === 'other') return weight_kg;
  const ibw = calcIBW(height_cm, sex);
  if (weight_kg <= ibw * 1.2) return weight_kg; // normopeso / sobrepeso leve: peso real
  return Math.round(ibw + 0.25 * (weight_kg - ibw));
}

// Ajuste calórico escalonado según IMC para weight_loss.
// El resto de objetivos usan un ajuste fijo justificado clínicamente.
// Referencia: SENC 2022, SEEN (guía de obesidad 2023).
function calcCalorieAdj(goal: PatientGoal, bmi: number | null): number {
  if (goal !== 'weight_loss') {
    const ADJ: Record<PatientGoal, number> = {
      weight_loss: -500, // fallback — no se alcanza esta rama
      weight_gain: 300,  // superávit moderado para evitar ganancia grasa excesiva
      maintenance: 0,
      muscle_gain: 250,  // superávit limpio: menor que en weight_gain para minimizar grasa
      health: 0,
    };
    return ADJ[goal];
  }

  // weight_loss: déficit escalonado para evitar yatrogenia en pacientes con bajo peso
  if (bmi === null) return -400;      // sin datos → conservador
  if (bmi < 18.5)   return 0;         // bajo peso: plan normocalórico, NO aplicar déficit
  if (bmi < 22)     return -200;      // normopeso bajo: margen reducido, déficit mínimo
  if (bmi < 25)     return -350;      // normopeso: déficit moderado clínicamente seguro
  if (bmi < 30)     return -500;      // sobrepeso: déficit estándar SENC (−500 kcal/d)
  return -600;                         // obesidad: déficit mayor, limitado por floor calórico
}

// ── Función principal ─────────────────────────────────────────────────────────

export function calcTargets(patient: Patient, overrides?: MacroOverrides): CalcTargets {
  // ── TDEE ───────────────────────────────────────────────────────────────────
  // Usar TDEE precalculado de la DB si existe; si no, calcular con Mifflin-St Jeor.
  let tdee = patient.tdee;

  if (!tdee && patient.weight_kg && patient.height_cm && patient.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    const base = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * age;

    let tmb: number;
    if (patient.sex === 'male') {
      tmb = base + 5;
    } else if (patient.sex === 'female') {
      tmb = base - 161;
    } else {
      // Sexo 'other' o null: promedio de las dos ecuaciones (conservador y no binario).
      // (base + 5 + base − 161) / 2 = base − 78
      tmb = base - 78;
    }

    const actFactor = ACTIVITY_FACTORS[patient.activity_level ?? ''] ?? 1.375;
    tdee = Math.round(tmb * actFactor);
  }

  const baseTdee = tdee ?? 2000; // fallback cuando no hay datos suficientes

  // ── IMC ────────────────────────────────────────────────────────────────────
  const bmi =
    patient.weight_kg && patient.height_cm
      ? patient.weight_kg / (patient.height_cm / 100) ** 2
      : null;

  // ── Calorías ───────────────────────────────────────────────────────────────
  const goal = patient.goal ?? 'health';
  const adj = calcCalorieAdj(goal, bmi);
  let calories = overrides?.calories ?? baseTdee + adj;

  // Aplicar floor calórico mínimo fisiológico según sexo (SENC)
  const sex = patient.sex ?? 'other';
  calories = Math.max(calories, MIN_CALORIES[sex]);

  // ── Proteína ───────────────────────────────────────────────────────────────
  const weight = patient.weight_kg ?? 70;

  // En obesidad (IMC > 30), el exceso de masa grasa no requiere proteína estructural.
  // Usar peso ajustado evita sobreprescripción proteica (ASPEN/ESPEN).
  const proteinWeight = calcProteinWeight(weight, patient.height_cm ?? null, patient.sex ?? null);
  const protein_per_kg_target = overrides?.protein_per_kg ?? PROTEIN_PER_KG[goal];
  let protein_g = Math.round(proteinWeight * protein_per_kg_target);

  // Cap: proteína nunca > 40% de las kcal totales (umbral de desequilibrio clínico)
  const protein_g_pct_cap = Math.floor((calories * PROTEIN_MAX_PCT_OF_CALORIES) / 4);
  // Aplicar todos los límites: cap absoluto, cap porcentual, floor absoluto
  protein_g = Math.min(protein_g, PROTEIN_MAX_G, protein_g_pct_cap);
  protein_g = Math.max(protein_g, PROTEIN_MIN_G);

  // ── Carbs y grasa ──────────────────────────────────────────────────────────
  const protein_kcal = protein_g * 4;
  // Math.max garantiza que remaining_kcal nunca sea negativo (distribución siempre válida)
  const remaining_kcal = Math.max(calories - protein_kcal, 0);

  const carbs_pct = overrides?.carbs_pct ?? CARBS_RATIO[goal];
  const fat_pct = 1 - carbs_pct;
  const carbs_g = Math.round((remaining_kcal * carbs_pct) / 4);
  const fat_g = Math.round((remaining_kcal * fat_pct) / 9);

  // protein_per_kg devuelto: ratio efectivo sobre peso real del paciente,
  // para coherencia en la UI (el nutricionista puede verificar protein_g / weight_kg).
  const protein_per_kg = Math.round((protein_g / weight) * 100) / 100;

  return { calories, protein_g, carbs_g, fat_g, protein_per_kg, carbs_pct, fat_pct };
}
