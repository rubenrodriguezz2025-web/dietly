import { NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function POST(req: Request) {
  let body: { patient_id?: string; answers?: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido.' }, { status: 400 });
  }

  const { patient_id, answers } = body;

  if (!patient_id || !answers) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
  }

  // Verificar que el paciente existe (y obtener su intake_token para validar que es una petición legítima)
  const { data: paciente } = await (supabaseAdminClient as any)
    .from('patients')
    .select('id')
    .eq('id', patient_id)
    .single();

  if (!paciente) {
    return NextResponse.json({ error: 'Paciente no encontrado.' }, { status: 404 });
  }

  // Comprobar si ya existe una respuesta (no permitir duplicados)
  const { data: respuestaExistente } = await (supabaseAdminClient as any)
    .from('intake_forms')
    .select('id')
    .eq('patient_id', patient_id)
    .limit(1)
    .maybeSingle();

  if (respuestaExistente) {
    return NextResponse.json({ error: 'El cuestionario ya fue enviado.' }, { status: 409 });
  }

  const { error } = await (supabaseAdminClient as any).from('intake_forms').insert({
    patient_id,
    answers,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: 'Error al guardar el cuestionario.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
