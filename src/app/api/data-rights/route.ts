import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const VALID_TYPES = ['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection'];

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; request_type?: string; notes?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { name, email, request_type, notes } = body;

  if (!name || !email || !request_type) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  if (!VALID_TYPES.includes(request_type)) {
    return NextResponse.json({ error: 'Tipo de solicitud no válido' }, { status: 400 });
  }

  // Buscar al paciente por email (puede haber más de uno si varias clínicas lo tienen)
  const { data: patients } = await supabaseAdminClient
    .from('patients')
    .select('id, name, email, nutritionist_id')
    .eq('email', email.toLowerCase().trim());

  if (!patients || patients.length === 0) {
    return NextResponse.json({ error: 'No se encontraron datos para ese email' }, { status: 404 });
  }

  // Crear una solicitud por cada registro encontrado
  const inserts = patients.map((p: { id: string; name: string; email: string | null; nutritionist_id: string }) => ({
    patient_id: p.id,
    nutritionist_id: p.nutritionist_id,
    request_type,
    patient_name_snapshot: p.name ?? name,
    patient_email_snapshot: p.email ?? email,
    notes: notes ?? null,
  }));

  const { error } = await supabaseAdminClient
    .from('data_rights_requests')
    .insert(inserts);

  if (error) {
    console.error('[data-rights] Error al insertar solicitud:', error);
    return NextResponse.json({ error: 'Error interno al registrar la solicitud' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
