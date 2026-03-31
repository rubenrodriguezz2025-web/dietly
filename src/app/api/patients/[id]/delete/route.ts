import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const patientIdSchema = z.string().uuid('El ID del paciente debe ser un UUID válido.');

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const parseResult = patientIdSchema.safeParse(rawId);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
  }
  const patientId = parseResult.data;

  // Verificar autenticación
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar que el paciente pertenece a este nutricionista
  const { data: patient } = await supabaseAdminClient
    .from('patients')
    .select('id, name, email')
    .eq('id', patientId)
    .eq('nutritionist_id', user.id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
  }

  // Extraer request_id para marcar la solicitud como completada tras el borrado
  const url = new URL(req.url);
  const requestId = url.searchParams.get('request_id');

  // Borrar el paciente — los FK con ON DELETE CASCADE eliminan en cascada:
  //   nutrition_plans, patient_progress, intake_forms,
  //   patient_consents, followup_forms, followup_reminders.
  // data_rights_requests tiene ON DELETE SET NULL (se conserva el historial de auditoría).
  // ai_request_logs NO tiene FK al paciente (pseudonimizados) — ya son datos anónimos.
  const { error } = await supabaseAdminClient
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('nutritionist_id', user.id);

  if (error) {
    console.error('[patients/delete] Error al eliminar paciente:', error);
    return NextResponse.json({ error: 'Error interno al eliminar el paciente' }, { status: 500 });
  }

  // Marcar la solicitud RGPD como completada si se pasó request_id
  if (requestId) {
    await supabaseAdminClient
      .from('data_rights_requests')
      .update({ status: 'completed', responded_at: new Date().toISOString() })
      .eq('id', requestId);
  }

  return NextResponse.json({
    ok: true,
    deleted_patient: patient.name,
    note: 'Los registros de auditoría de IA permanecen pseudonimizados según RGPD Art. 17(3)(e).',
  });
}
