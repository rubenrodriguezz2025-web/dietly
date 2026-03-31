'use server';

import { headers } from 'next/headers';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Registra el consentimiento del paciente para ver su plan nutricional.
 *
 * Base legal: RGPD Art. 9(2)(a) — consentimiento explícito para datos de salud.
 * Usa el admin client porque el paciente no tiene sesión autenticada.
 * El nutritionist_id es necesario para mantener la integridad del schema
 * (NOT NULL REFERENCES auth.users) y para la auditoría por nutricionista.
 */
export async function aceptarConsentimientoPlan(
  patientId: string,
  nutritionistId: string,
  _planId: string,
  version: string
): Promise<void> {
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    reqHeaders.get('x-real-ip') ??
    null;

  await (supabaseAdminClient as any).from('patient_consents').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    consent_type: 'plan_view_acceptance',
    consent_text_version: version,
    ip_address: ip,
  });
}
