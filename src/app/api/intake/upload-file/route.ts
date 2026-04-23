import { NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const RATE_LIMIT_MAX = 20; // 20 subidas por IP por hora
const RATE_LIMIT_WINDOW_HOURS = 1;

function sanitizeFileName(name: string): string {
  const extIdx = name.lastIndexOf('.');
  const base = extIdx >= 0 ? name.slice(0, extIdx) : name;
  const ext = extIdx >= 0 ? name.slice(extIdx) : '';
  const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
  return `${safeBase}${safeExt}`;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { count: recentAttempts } = await supabaseAdminClient
    .from('plan_access_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('patient_token', 'intake_upload')
    .gte('attempted_at', windowStart);

  if ((recentAttempts ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Demasiadas subidas. Inténtalo de nuevo en una hora.' },
      { status: 429 },
    );
  }

  await supabaseAdminClient.from('plan_access_attempts').insert({
    ip_address: ip,
    patient_token: 'intake_upload',
    attempted_at: new Date().toISOString(),
  });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido.' }, { status: 400 });
  }

  const patientId = formData.get('patient_id');
  const intakeToken = formData.get('intake_token');
  const file = formData.get('file');

  if (typeof patientId !== 'string' || typeof intakeToken !== 'string') {
    return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'El archivo está vacío.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo supera 10 MB.' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Sube un PDF, imagen o documento Word.' },
      { status: 400 },
    );
  }

  const { data: paciente } = await supabaseAdminClient
    .from('patients')
    .select('id, nutritionist_id, intake_token')
    .eq('id', patientId)
    .eq('intake_token', intakeToken)
    .single() as { data: { id: string; nutritionist_id: string; intake_token: string } | null };

  if (!paciente) {
    return NextResponse.json({ error: 'Token de intake inválido o paciente no encontrado.' }, { status: 403 });
  }

  const safeName = sanitizeFileName(file.name || 'archivo');
  const path = `${paciente.nutritionist_id}/${paciente.id}/${Date.now()}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await supabaseAdminClient.storage
    .from('intake-files')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 });
  }

  return NextResponse.json({ path, name: file.name });
}
