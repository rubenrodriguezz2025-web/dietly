/**
 * Logger de peticiones a la API de IA — tabla ai_request_logs.
 *
 * Características de la tabla (ver migración 016_ai_request_logs.sql):
 *   - Append-only desde el cliente: los nutricionistas solo pueden SELECT.
 *     No existe política de INSERT/UPDATE/DELETE para el rol 'authenticated'.
 *   - El servidor escribe SIEMPRE via supabaseAdminClient (service_role),
 *     que bypasa RLS. Esto garantiza que ningún payload externo puede
 *     forzar la creación o borrado de logs.
 *   - Para borrado por derecho al olvido (RGPD Art. 17), usar service_role
 *     directamente desde un endpoint de administración autenticado.
 *
 * Campos que se loguean:
 *   - prompt: ya pseudonimizado — sin nombre, email ni IDs reales del paciente
 *   - response_summary: JSON del tool_use.input (datos de comidas, sin PII)
 *   - session_patient_id: UUID de sesión, NO el ID real del paciente
 */

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type AIRequestType =
  | 'generate_day'
  | 'regenerate_day'
  | 'recalculate_macros'
  | 'shopping_list';

export interface LogAIRequestParams {
  /** ID real del nutricionista (no sale del servidor, va a la columna de auditoría). */
  nutritionistId: string;
  /**
   * UUID de sesión pseudonimizado — generado por pseudonymizePatient().
   * Para peticiones sin paciente (recalculate_macros) se genera uno ad-hoc.
   */
  sessionPatientId: string;
  /** ID del plan, si aplica. */
  planId?: string;
  /** Identificador del modelo usado, p.ej. 'claude-sonnet-4-6'. */
  modelVersion: string;
  requestType: AIRequestType;
  /** Número de día (1-7) para generate_day / regenerate_day. */
  dayNumber?: number;
  /** Prompt completo enviado a la IA — debe estar ya pseudonimizado. */
  prompt: string;
  /** JSON stringificado del tool_use.input devuelto por la IA. */
  responseSummary?: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd?: number;
}

// ── Función principal ──────────────────────────────────────────────────────────

/**
 * Inserta un registro de auditoría en ai_request_logs.
 *
 * Fire-and-forget: nunca lanza excepciones para no interrumpir el flujo
 * principal. Los errores se reportan solo a console.error.
 */
export async function logAIRequest(params: LogAIRequestParams): Promise<void> {
  const { error } = await (supabaseAdminClient as any)
    .from('ai_request_logs')
    .insert({
      nutritionist_id:   params.nutritionistId,
      session_patient_id: params.sessionPatientId,
      plan_id:           params.planId ?? null,
      model_version:     params.modelVersion,
      request_type:      params.requestType,
      day_number:        params.dayNumber ?? null,
      prompt:            params.prompt,
      response_summary:  params.responseSummary ?? null,
      tokens_input:      params.tokensInput,
      tokens_output:     params.tokensOutput,
      cost_usd:          params.costUsd ?? null,
    });

  if (error) {
    // Logging nunca debe romper el flujo principal
    console.error('[ai-logger] Error insertando log:', error.message);
  }
}
