import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const VALID_TYPES = ['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection'];

// Rate limiting por IP usando DB — 3 solicitudes por hora
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Rate limiting basado en DB (plan_access_attempts como tabla genérica)
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { count: recentAttempts } = await supabaseAdminClient
    .from('plan_access_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('patient_token', 'data_rights')
    .gte('attempted_at', windowStart);

  if ((recentAttempts ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Inténtalo de nuevo en una hora.' },
      { status: 429 },
    );
  }

  // Registrar intento
  await supabaseAdminClient.from('plan_access_attempts').insert({
    ip_address: ip,
    patient_token: 'data_rights',
    attempted_at: new Date().toISOString(),
  });

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

  // Siempre devolver 201 para evitar enumeración de emails (H-06)
  if (!patients || patients.length === 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
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
