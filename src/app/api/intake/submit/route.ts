import { NextResponse } from 'next/server';

import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function POST(req: Request) {
  let body: { patient_id?: string; answers?: Record<string, unknown>; consent?: boolean };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido.' }, { status: 400 });
  }

  const { patient_id, answers, consent } = body;

  if (!patient_id || !answers) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
  }

  // Obtener nombre del paciente y su nutricionista
  const { data: paciente } = await (supabaseAdminClient as any)
    .from('patients')
    .select('id, name, nutritionist_id')
    .eq('id', patient_id)
    .single() as { data: { id: string; name: string; nutritionist_id: string } | null };

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

  // Registrar consentimiento del paciente si fue otorgado
  if (consent) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null;

    await (supabaseAdminClient as any).from('patient_consents').insert({
      patient_id,
      nutritionist_id: paciente.nutritionist_id,
      consent_type: 'patient_ai_consent',
      granted_at: new Date().toISOString(),
      ip_address: ip,
      consent_text_version: 'intake-v1',
    });
    // Si el insert falla no bloqueamos — el cuestionario ya está guardado
  }

  // Enviar notificación email al equipo de Dietly — fire-and-forget
  try {
    const { data: perfil } = await (supabaseAdminClient as any)
      .from('profiles')
      .select('full_name')
      .eq('id', paciente.nutritionist_id)
      .maybeSingle() as { data: { full_name: string } | null };

    const nombreNutricionista = perfil?.full_name ?? 'Nutricionista';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const fichaUrl = `${appUrl}/dashboard/patients/${patient_id}`;
    const fecha = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await resendClient.emails.send({
      from: 'Dietly <noreply@dietly.es>',
      to: 'hola@dietly.es',
      subject: `Paciente ha completado su cuestionario — ${paciente.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
          <div style="margin-bottom:24px">
            <span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
              NUEVO CUESTIONARIO
            </span>
          </div>
          <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">
            Cuestionario completado
          </h2>
          <p style="margin:0 0 24px;color:#52525b;font-size:15px">
            Un paciente ha rellenado su cuestionario de salud y los datos están disponibles en el dashboard.
          </p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
            <tr style="background:#f4f4f5">
              <td style="padding:12px 16px;color:#71717a;font-size:13px;width:40%">Paciente</td>
              <td style="padding:12px 16px;font-weight:600;color:#18181b;font-size:13px">${paciente.name}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Nutricionista</td>
              <td style="padding:12px 16px;font-weight:600;color:#18181b;font-size:13px;border-top:1px solid #e4e4e7">${nombreNutricionista}</td>
            </tr>
            <tr style="background:#f4f4f5">
              <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Fecha y hora</td>
              <td style="padding:12px 16px;color:#18181b;font-size:13px;border-top:1px solid #e4e4e7">${fecha}</td>
            </tr>
          </table>
          <div style="margin-top:28px">
            <a
              href="${fichaUrl}"
              style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px"
            >
              Ver ficha del paciente →
            </a>
          </div>
          <p style="margin-top:32px;color:#a1a1aa;font-size:12px;border-top:1px solid #e4e4e7;padding-top:16px">
            Email generado automáticamente por Dietly · No respondas a este mensaje.
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    // No fallamos la respuesta si el email falla
    console.error('[intake/submit] email notification error:', emailErr);
  }

  return NextResponse.json({ ok: true });
}
