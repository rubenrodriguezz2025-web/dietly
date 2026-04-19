/**
 * Pseudonimización de datos del paciente antes de enviar a la API de IA.
 *
 * RGPD Art. 4(5): la pseudonimización reduce el riesgo para el interesado al
 * eliminar los identificadores directos del payload enviado a terceros (Anthropic).
 *
 * Lo que se elimina:
 *   - Nombre real, email, teléfono, DNI (si existieran en el modelo)
 *   - ID real de BD del paciente y del nutricionista
 *   - Fecha de nacimiento exacta → se sustituye por edad en años
 *
 * Lo que se conserva (datos clínicos necesarios para el plan):
 *   - Sexo biológico, peso, talla, nivel de actividad, objetivo
 *   - Restricciones dietéticas, alergias, intolerancias, preferencias, notas médicas
 *   - TDEE/TMB precalculados (valores numéricos, no identificativos)
 */

import type { ActivityLevel, PatientGoal, TrainingTime } from '@/types/dietly';
import type { Patient } from '@/types/dietly';

// ── Tipo pseudonimizado ────────────────────────────────────────────────────────

export type PseudonymizedPatient = {
  /** UUID de sesión generado por petición — NO es el ID real del paciente en la DB. */
  session_id: string;
  /** Edad en años derivada de date_of_birth. La fecha exacta nunca sale del servidor. */
  age_years: number | null;
  sex: 'male' | 'female' | 'other' | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  goal: PatientGoal | null;
  dietary_restrictions: string[] | null;
  allergies: string | null;
  intolerances: string | null;
  /**
   * Preferencias y notas médicas son texto libre escrito por el nutricionista.
   * Pueden contener referencias informales a nombres — es responsabilidad del
   * nutricionista no introducir identificadores en estos campos.
   * Se incluyen porque son contexto clínico necesario para el plan.
   */
  preferences: string | null;
  medical_notes: string | null;
  /** TMB precalculado — valor numérico, sin datos identificativos. */
  tmb: number | null;
  /** TDEE precalculado — valor numérico, sin datos identificativos. */
  tdee: number | null;
  // Datos deportivos (solo relevantes cuando el nutricionista es de especialidad deportiva)
  sport_type: string | null;
  training_days_per_week: number | null;
  training_time: TrainingTime | null;
  training_schedule: string | null;
  supplementation: string | null;
};

// ── Función principal ──────────────────────────────────────────────────────────

/**
 * Devuelve una versión pseudonimizada del paciente apta para incluir en prompts
 * de IA, junto con el `sessionId` que se usa como clave en los logs de auditoría.
 *
 * @param patient  Objeto Patient completo tal como viene de Supabase.
 * @returns        `{ pseudoPatient, sessionId }` donde sessionId es el UUID de sesión.
 */
export function pseudonymizePatient(patient: Patient): {
  pseudoPatient: PseudonymizedPatient;
  sessionId: string;
} {
  // UUID único por petición — vincula el log de auditoría con esta generación
  // sin exponer el ID real del paciente fuera del servidor.
  const sessionId = crypto.randomUUID();

  // Convertir fecha de nacimiento a edad en años — la DOB exacta no sale del servidor
  const age_years = patient.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(patient.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  const pseudoPatient: PseudonymizedPatient = {
    session_id: sessionId,
    age_years,
    sex: patient.sex ?? null,
    weight_kg: patient.weight_kg ?? null,
    height_cm: patient.height_cm ?? null,
    activity_level: patient.activity_level ?? null,
    goal: patient.goal ?? null,
    dietary_restrictions: patient.dietary_restrictions ?? null,
    allergies: patient.allergies ?? null,
    intolerances: patient.intolerances ?? null,
    preferences: patient.preferences ?? null,
    medical_notes: patient.medical_notes ?? null,
    tmb: patient.tmb ?? null,
    tdee: patient.tdee ?? null,
    sport_type: patient.sport_type ?? null,
    training_days_per_week: patient.training_days_per_week ?? null,
    training_time: patient.training_time ?? null,
    training_schedule: patient.training_schedule ?? null,
    supplementation: patient.supplementation ?? null,
  };

  return { pseudoPatient, sessionId };
}
