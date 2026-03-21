import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: patientId } = await params;

  // Verificar autenticación
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar que el paciente pertenece a este nutricionista
  const { data: patient } = await (supabaseAdminClient as any)
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('nutritionist_id', user.id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
  }

  // Recopilar todos los datos del paciente en paralelo
  const [plansResult, progressResult, intakeResult, consentsResult, followupResult] = await Promise.all([
    (supabaseAdminClient as any)
      .from('nutrition_plans')
      .select('id, status, week_start_date, plan_data, generated_at, approved_at, sent_at, claude_tokens_used')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),

    (supabaseAdminClient as any)
      .from('patient_progress')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: true }),

    (supabaseAdminClient as any)
      .from('intake_forms')
      .select('answers, completed_at, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),

    (supabaseAdminClient as any)
      .from('patient_consents')
      .select('consent_type, granted_at, revoked_at, consent_text_version, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),

    (supabaseAdminClient as any)
      .from('followup_forms')
      .select('created_at, completed_at, answers')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
  ]);

  // Eliminar campos internos antes de exportar
  const { id: _id, nutritionist_id: _nid, intake_token: _token, ...patientPublic } = patient;

  const exportData = {
    schema_version: '1.0',
    exported_at: new Date().toISOString(),
    legal_basis: 'RGPD Art. 20 — Derecho a la portabilidad de los datos',
    patient: patientPublic,
    nutrition_plans: plansResult.data ?? [],
    progress: progressResult.data ?? [],
    intake_forms: intakeResult.data ?? [],
    consents: consentsResult.data ?? [],
    followup_forms: followupResult.data ?? [],
  };

  const filename = `datos-paciente-${patientId}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
