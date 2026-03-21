/**
 * nutrition-validator.ts
 *
 * Valida planes nutricionales generados por IA contra criterios clínicos
 * basados en guías SENC/SEEN/ISSN/DRI antes de mostrar el borrador al D-N.
 *
 * Severidades:
 *   block   → semáforo rojo. Impide aprobar el plan sin revisión explícita.
 *   warning → semáforo amarillo. D-N informado; puede aprobar sin acción.
 */

import type { PlanContent, PlanDay } from '@/types/dietly';

// ── Tipos exportados ─────────────────────────────────────────────────────────

export type ValidationSeverity = 'block' | 'warning';

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  title: string;
  detail: string;
  /** Días afectados o alimentos concretos, si aplica */
  affected?: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
  blocks: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    proteinPerKg: number | null;
    bmi: number | null;
    age: number | null;
    deficitPct: number | null;
    carbsPctVCT: number | null;
    fatPctVCT: number | null;
  };
};

export type ValidatorPatient = {
  sex: 'male' | 'female' | 'other' | null;
  weight_kg: number | null;
  height_cm: number | null;
  date_of_birth: string | null;
  allergies: string | null;
  intolerances: string | null;
  dietary_restrictions: string | null;
  medical_notes: string | null;
  tdee: number | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar tildes
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calcBMI(weight_kg: number | null, height_cm: number | null): number | null {
  if (!weight_kg || !height_cm || height_cm <= 0) return null;
  return Math.round((weight_kg / (height_cm / 100) ** 2) * 10) / 10;
}

function calcAge(date_of_birth: string | null): number | null {
  if (!date_of_birth) return null;
  return Math.floor(
    (Date.now() - new Date(date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
}

function avgMacro(days: PlanDay[], key: 'total_calories' | keyof PlanDay['total_macros']): number {
  if (!days.length) return 0;
  const sum = days.reduce((acc, d) => {
    const val = key === 'total_calories' ? d.total_calories : d.total_macros[key as keyof PlanDay['total_macros']];
    return acc + (val ?? 0);
  }, 0);
  return Math.round((sum / days.length) * 10) / 10;
}

// ── Alérgenos ────────────────────────────────────────────────────────────────

/**
 * Mapeo de restricciones etiquetadas (del selector de alta de paciente)
 * a palabras clave que buscar en los nombres de los ingredientes.
 */
const RESTRICTION_INGREDIENT_MAP: Record<string, string[]> = {
  'sin gluten':    ['trigo', 'centeno', 'cebada', 'avena', 'espelta', 'kamut', 'bulgur', 'couscous', 'semola', 'harina'],
  'celiaquia':     ['trigo', 'centeno', 'cebada', 'avena', 'espelta', 'kamut', 'bulgur', 'couscous', 'semola', 'harina'],
  'sin lactosa':   ['leche', 'queso', 'yogur', 'mantequilla', 'nata', 'kefir', 'crema de leche', 'requesón', 'ricotta'],
  'lactosa':       ['leche', 'queso', 'yogur', 'mantequilla', 'nata', 'kefir'],
  'sin frutos secos': ['nuez', 'almendra', 'avellana', 'cacahuete', 'pistacho', 'anacardo', 'piñon', 'peca', 'macadamia'],
  'frutos secos':  ['nuez', 'almendra', 'avellana', 'cacahuete', 'pistacho', 'anacardo', 'piñon'],
  'sin mariscos':  ['gamba', 'langostino', 'mejillon', 'almeja', 'calamar', 'pulpo', 'cangrejo', 'necora', 'bogavante', 'langosta'],
  'mariscos':      ['gamba', 'langostino', 'mejillon', 'almeja', 'calamar', 'pulpo', 'cangrejo'],
  'halal':         ['cerdo', 'jamon', 'bacon', 'chorizo', 'salchichon', 'lomo', 'panceta', 'tocino'],
  'kosher':        ['cerdo', 'jamon', 'bacon', 'chorizo', 'salchichon', 'crustaceo', 'marisco'],
  'vegano':        ['carne', 'pollo', 'pavo', 'ternera', 'cerdo', 'pescado', 'salmon', 'atun', 'bacalao', 'merluza', 'huevo', 'leche', 'queso', 'yogur', 'mantequilla', 'nata', 'miel'],
  'vegetariano':   ['carne', 'pollo', 'pavo', 'ternera', 'cerdo', 'pescado', 'salmon', 'atun', 'bacalao', 'merluza'],
};

/**
 * Extrae palabras de búsqueda desde el texto libre de alergias del paciente.
 * Devuelve tokens normalizados > 3 caracteres excluyendo stopwords.
 */
const STOPWORDS = new Set(['alergia', 'alergiaa', 'alergico', 'intolerancia', 'intolerante', 'sensible', 'sensibilidad', 'sin', 'con', 'los', 'las', 'una', 'uno', 'del', 'que', 'por', 'para']);

function extractAllergenTokens(text: string): string[] {
  return norm(text)
    .split(/[\s,;.\/\-y]+/)
    .filter((t) => t.length > 3 && !STOPWORDS.has(t));
}

type AllergenMatch = { allergen: string; ingredient: string; day: string; meal: string };

function findAllergenMatches(
  plan: PlanContent,
  patient: ValidatorPatient
): AllergenMatch[] {
  const matches: AllergenMatch[] = [];

  // Conjunto de palabras clave a buscar (de allergies + dietary_restrictions)
  const searchTokens = new Set<string>();

  // 1. Alergias de texto libre
  if (patient.allergies) {
    extractAllergenTokens(patient.allergies).forEach((t) => searchTokens.add(t));
  }
  if (patient.intolerances) {
    extractAllergenTokens(patient.intolerances).forEach((t) => searchTokens.add(t));
  }

  // 2. Restricciones etiquetadas (selector de alta)
  if (patient.dietary_restrictions) {
    const restrictNorm = norm(patient.dietary_restrictions);
    for (const [label, keywords] of Object.entries(RESTRICTION_INGREDIENT_MAP)) {
      if (restrictNorm.includes(label)) {
        keywords.forEach((k) => searchTokens.add(k));
      }
    }
  }

  if (searchTokens.size === 0) return matches;

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const ingNorm = norm(ingredient.name);
        for (const token of searchTokens) {
          if (ingNorm.includes(token)) {
            matches.push({
              allergen: token,
              ingredient: ingredient.name,
              day: day.day_name,
              meal: meal.meal_name,
            });
            break; // un match por ingrediente es suficiente
          }
        }
      }
    }
  }

  return matches;
}

// ── Condiciones clínicas en texto libre ──────────────────────────────────────

function detectCondition(notes: string, patterns: RegExp[]): boolean {
  const n = norm(notes);
  return patterns.some((p) => p.test(n));
}

const CONDITIONS = {
  tca: [/\b(tca|trastorno\s+alimentario|anorexia|bulimia|ortorexia|atrac[oó]n)\b/],
  erc35: [/\berc\s*(estadio)?\s*[3-5]\b/, /\b(diali?sis|hemodiali?sis)\b/, /\benfermedad\s+renal\s+cronica\s+estadio\s*[3-5]\b/],
  diabetes: [/\b(diabetes|diab[eé]tico|dm[12]|dm\s+tipo)\b/],
  pregnancy: [/\b(embarazo|embarazada|gestante|gestaci[oó]n)\b/],
  warfarin: [/\b(warfarina|acenocumarol|sintrom)\b/],
  metformin: [/\b(metformina|glucophage|fortamet)\b/],
  levothyroxine: [/\b(levotiroxina|eutirox|tirosint|tiroxina)\b/],
  acei: [/\b(enalapril|ramipril|lisinopril|captopril|perindopril|quinapril|fosinopril|ieca|inhibidor.*enzima.*conversora)\b/],
};

// ── Función principal ─────────────────────────────────────────────────────────

export function validateNutritionPlan(
  plan: PlanContent,
  patient: ValidatorPatient
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const days = plan.days ?? [];

  // ── Estadísticas base ────────────────────────────────────────────────────
  const avgCalories = avgMacro(days, 'total_calories');
  const avgProtein  = avgMacro(days, 'protein_g');
  const avgCarbs    = avgMacro(days, 'carbs_g');
  const avgFat      = avgMacro(days, 'fat_g');

  const bmi = calcBMI(patient.weight_kg, patient.height_cm);
  const age = calcAge(patient.date_of_birth);
  const proteinPerKg = patient.weight_kg && avgProtein ? Math.round((avgProtein / patient.weight_kg) * 100) / 100 : null;

  const carbsPctVCT = avgCalories > 0 ? Math.round((avgCarbs * 4 / avgCalories) * 1000) / 10 : null;
  const fatPctVCT   = avgCalories > 0 ? Math.round((avgFat * 9 / avgCalories) * 1000) / 10 : null;

  const deficitPct = patient.tdee && patient.tdee > 0 && avgCalories > 0
    ? Math.round(((patient.tdee - avgCalories) / patient.tdee) * 1000) / 10
    : null;

  const notes = patient.medical_notes ?? '';

  // ════════════════════════════════════════════════════════════════════════
  //  BLOQUES — semáforo rojo
  // ════════════════════════════════════════════════════════════════════════

  // 1. Calorías por debajo del mínimo de seguridad
  const calMin = patient.sex === 'male' ? 1500 : 1200;
  if (days.length > 0 && avgCalories < calMin) {
    issues.push({
      code: 'cal_too_low',
      severity: 'block',
      title: `Calorías por debajo del mínimo seguro (< ${calMin} kcal)`,
      detail: `Media del plan: ${Math.round(avgCalories)} kcal/día. El mínimo recomendado para ${patient.sex === 'male' ? 'hombres' : 'mujeres/indet.'} es ${calMin} kcal/día. Riesgo de deficiencias nutricionales y pérdida de masa magra.`,
    });
  }

  // 2. Déficit calórico > 30% del TDEE
  if (deficitPct !== null && deficitPct > 30) {
    issues.push({
      code: 'deficit_too_high',
      severity: 'block',
      title: `Déficit calórico excesivo (${deficitPct}% del TDEE)`,
      detail: `El plan aporta ${Math.round(avgCalories)} kcal frente a un TDEE de ${patient.tdee} kcal (déficit ${deficitPct}%). Por encima del 30% aumenta el riesgo de pérdida muscular, fatiga severa y deficiencias. Revisa si el objetivo es pérdida de peso agresiva supervisada.`,
    });
  }

  // 3. Proteína < 0.66 g/kg/día (mínimo poblacional DRI)
  if (proteinPerKg !== null && proteinPerKg < 0.66) {
    issues.push({
      code: 'protein_critical',
      severity: 'block',
      title: `Proteína por debajo del mínimo poblacional (${proteinPerKg} g/kg/día)`,
      detail: `La DRI (Dietary Reference Intake) establece 0.66 g/kg/día como mínimo poblacional. Con ${avgProtein}g/día el paciente puede sufrir pérdida de masa muscular y compromiso inmunitario.`,
    });
  }

  // 4. Alérgenos declarados presentes en ingredientes
  if (patient.allergies || patient.dietary_restrictions) {
    const allergenMatches = findAllergenMatches(plan, patient);
    if (allergenMatches.length > 0) {
      const uniqueAllergens = [...new Set(allergenMatches.map((m) => m.allergen))].join(', ');
      const examples = allergenMatches
        .slice(0, 3)
        .map((m) => `"${m.ingredient}" (${m.day} · ${m.meal})`)
        .join('; ');
      issues.push({
        code: 'allergen_present',
        severity: 'block',
        title: 'Posible alérgeno declarado detectado en el plan',
        detail: `Se han encontrado ingredientes que pueden contener: ${uniqueAllergens}. Ejemplos: ${examples}. Verifica manualmente antes de aprobar.`,
        affected: allergenMatches.map((m) => `${m.day}: ${m.ingredient}`).slice(0, 5).join(', '),
      });
    }
  }

  // 5. Condiciones de alto riesgo que requieren protocolo específico
  const isTCA  = detectCondition(notes, CONDITIONS.tca);
  const isERC35 = detectCondition(notes, CONDITIONS.erc35);
  const isBMIBelow16 = bmi !== null && bmi < 16;

  if (isTCA) {
    issues.push({
      code: 'high_risk_tca',
      severity: 'block',
      title: 'Paciente con TCA detectado en notas clínicas',
      detail: 'Se han detectado términos relacionados con trastorno de la conducta alimentaria (anorexia, bulimia, TCA, ortorexia). Este perfil requiere abordaje multidisciplinar y protocolos específicos de restricción calórica. Revisa con especial atención.',
    });
  }
  if (isERC35) {
    issues.push({
      code: 'high_risk_erc',
      severity: 'block',
      title: 'ERC estadio 3-5 o diálisis detectada en notas clínicas',
      detail: 'La enfermedad renal crónica avanzada requiere restricción proteica, fosfórica y potásica específica. Un plan estándar puede ser peligroso. Aplica el protocolo renal correspondiente.',
    });
  }
  if (isBMIBelow16) {
    issues.push({
      code: 'high_risk_bmi16',
      severity: 'block',
      title: `IMC extremadamente bajo (${bmi} kg/m²)`,
      detail: `Un IMC < 16 kg/m² indica desnutrición severa (OMS criterio III). El protocolo de realimentación en este rango requiere incremento calórico muy gradual para evitar el síndrome de realimentación.`,
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  ALERTAS — semáforo amarillo
  // ════════════════════════════════════════════════════════════════════════

  // 6. Déficit 20-30% TDEE
  if (deficitPct !== null && deficitPct >= 20 && deficitPct <= 30) {
    issues.push({
      code: 'deficit_high',
      severity: 'warning',
      title: `Déficit calórico elevado (${deficitPct}% del TDEE)`,
      detail: `El plan tiene un déficit del ${deficitPct}% respecto al TDEE (${patient.tdee} kcal). Aceptable para pérdida de peso supervisada, pero puede ser excesivo según el perfil del paciente. Revisa que el objetivo lo justifique.`,
    });
  }

  // 7. Proteína 0.66-0.83 g/kg
  if (proteinPerKg !== null && proteinPerKg >= 0.66 && proteinPerKg < 0.83) {
    issues.push({
      code: 'protein_low',
      severity: 'warning',
      title: `Proteína por debajo de la RDA óptima (${proteinPerKg} g/kg/día)`,
      detail: `La RDA es 0.83 g/kg/día (EFSA). Aunque supera el mínimo, puede ser insuficiente para adultos mayores, pacientes en déficit o con ejercicio físico. Considera aumentar si el perfil lo requiere.`,
    });
  }

  // 8. Carbohidratos fuera de 45-65% VCT
  if (carbsPctVCT !== null) {
    if (carbsPctVCT < 45) {
      issues.push({
        code: 'carbs_low_pct',
        severity: 'warning',
        title: `Carbohidratos por debajo del rango recomendado (${carbsPctVCT}% VCT)`,
        detail: `Las guías SENC recomiendan 45-60% del VCT en hidratos. Con ${carbsPctVCT}% el plan puede ser bajo en hidratos. Verifica que sea intencionado (p.ej., dieta cetogénica supervisada).`,
      });
    } else if (carbsPctVCT > 60) {
      issues.push({
        code: 'carbs_high_pct',
        severity: 'warning',
        title: `Carbohidratos por encima del rango recomendado (${carbsPctVCT}% VCT)`,
        detail: `Con ${carbsPctVCT}% VCT en hidratos se supera el rango SENC (45-60%). Puede ser adecuado para deportistas de alto rendimiento; confirma que el objetivo lo justifique.`,
      });
    }
  }

  // 9. Grasa > 35% VCT
  if (fatPctVCT !== null && fatPctVCT > 35) {
    issues.push({
      code: 'fat_high_pct',
      severity: 'warning',
      title: `Grasa total elevada (${fatPctVCT}% VCT)`,
      detail: `Se supera el límite superior SENC del 35% VCT. Verifica la calidad de las grasas (AGS vs AGI) y que el contexto clínico lo permita.`,
    });
  }

  // 10. Carbohidratos < 130 g/día (mínimo cerebral EFSA/IOM)
  if (avgCarbs > 0 && avgCarbs < 130) {
    issues.push({
      code: 'carbs_cerebral_min',
      severity: 'warning',
      title: `Carbohidratos por debajo del mínimo cerebral (${Math.round(avgCarbs)} g/día)`,
      detail: `La EFSA establece 130 g/día como mínimo para cubrir los requerimientos cerebrales de glucosa. Por debajo de este umbral el organismo entra en cetosis. Confirma que sea un objetivo terapéutico.`,
    });
  }

  // 11. Paciente diabético
  if (detectCondition(notes, CONDITIONS.diabetes)) {
    issues.push({
      code: 'risk_diabetes',
      severity: 'warning',
      title: 'Paciente con diabetes — revisa índice glucémico y distribución de HC',
      detail: 'Se han detectado términos de diabetes en las notas clínicas. Verifica que la distribución de carbohidratos sea uniforme entre comidas, que se eviten azúcares simples y que el plan sea compatible con la medicación hipoglucemiante.',
    });
  }

  // 12. Embarazo
  if (detectCondition(notes, CONDITIONS.pregnancy)) {
    issues.push({
      code: 'risk_pregnancy',
      severity: 'warning',
      title: 'Paciente embarazada — requerimientos nutricionales aumentados',
      detail: 'Las notas indican posible embarazo. Verifica ácido fólico, hierro, yodo y DHA. Evita restricción calórica agresiva. Los requerimientos calóricos aumentan +300-500 kcal/día según trimestre.',
    });
  }

  // 13. Menor de edad
  if (age !== null && age < 18) {
    issues.push({
      code: 'risk_minor',
      severity: 'warning',
      title: `Paciente menor de edad (${age} años) — protocolos pediátricos aplicables`,
      detail: 'Los pacientes menores de 18 años requieren protocolos pediátricos. La restricción calórica agresiva puede afectar el crecimiento. Aplica las guías ESPGHAN para pediatría.',
    });
  }

  // 14. Mayor de 75 años
  if (age !== null && age > 75) {
    issues.push({
      code: 'risk_elderly',
      severity: 'warning',
      title: `Paciente mayor de 75 años (${age} años) — riesgo de sarcopenia`,
      detail: 'En mayores de 75 años el riesgo de sarcopenia y fragilidad es elevado. Considera aumentar proteína (1.2-1.5 g/kg), vitamina D y calcio. Evita restricciones calóricas agresivas.',
    });
  }

  // 15. IMC < 18.5 (bajo peso) o > 35 (obesidad severa)
  if (bmi !== null && bmi < 18.5 && bmi >= 16) {
    issues.push({
      code: 'risk_bmi_low',
      severity: 'warning',
      title: `IMC bajo (${bmi} kg/m²) — posible desnutrición`,
      detail: `IMC < 18.5 indica bajo peso. Prioriza recuperación de masa muscular y densidad ósea. Evita déficit calórico; considera hipercalórico supervisado.`,
    });
  }
  if (bmi !== null && bmi > 35) {
    issues.push({
      code: 'risk_bmi_high',
      severity: 'warning',
      title: `IMC elevado (${bmi} kg/m²) — obesidad severa`,
      detail: `IMC > 35 indica obesidad severa. Verifica que el déficit calórico se haya calculado sobre el peso ajustado (no el real) y que el plan incluya seguimiento médico estrecho.`,
    });
  }

  // 16. Interacción warfarina / vitamina K
  if (detectCondition(notes, CONDITIONS.warfarin)) {
    issues.push({
      code: 'drug_warfarin',
      severity: 'warning',
      title: 'Anticoagulante (warfarina/acenocumarol) — revisa contenido en vitamina K',
      detail: 'El paciente toma anticoagulantes orales. Los alimentos ricos en vitamina K (espinacas, col, brócoli, acelgas) pueden antagonizar el efecto. Asegura un aporte constante entre días o consulta con el hematólogo.',
    });
  }

  // 17. Interacción metformina / vitamina B12
  if (detectCondition(notes, CONDITIONS.metformin)) {
    issues.push({
      code: 'drug_metformin',
      severity: 'warning',
      title: 'Metformina — riesgo de déficit de vitamina B12',
      detail: 'La metformina reduce la absorción de vitamina B12. Verifica que el plan incluya fuentes adecuadas de B12 (carnes, pescado, huevos, lácteos) o considera suplementación.',
    });
  }

  // 18. Interacción levotiroxina / calcio, hierro, fibra
  if (detectCondition(notes, CONDITIONS.levothyroxine)) {
    issues.push({
      code: 'drug_levothyroxine',
      severity: 'warning',
      title: 'Levotiroxina — interacción con calcio, hierro y fibra en el desayuno',
      detail: 'La levotiroxina debe tomarse en ayunas (30-60 min antes del desayuno). Alimentos ricos en calcio, hierro o fibra en las primeras horas reducen su absorción. Incluye una nota sobre el timing de la medicación.',
    });
  }

  // 19. Interacción IECA / potasio
  if (detectCondition(notes, CONDITIONS.acei)) {
    issues.push({
      code: 'drug_acei',
      severity: 'warning',
      title: 'IECA/ARA-II — riesgo de hiperpotasemia con alimentos ricos en potasio',
      detail: 'Los IECA (enalapril, ramipril…) retienen potasio. Un plan rico en plátano, aguacate, legumbres, frutos secos y patata puede elevar el K sérico. Revisa la distribución de alimentos ricos en potasio.',
    });
  }

  const blocks   = issues.filter((i) => i.severity === 'block');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return {
    issues,
    blocks,
    warnings,
    stats: {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      proteinPerKg,
      bmi,
      age,
      deficitPct,
      carbsPctVCT,
      fatPctVCT,
    },
  };
}
