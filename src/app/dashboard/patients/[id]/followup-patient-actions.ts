'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// ── Enviar cuestionario de seguimiento al paciente ────────────────────────────

export async function sendFollowupQuestionnaire(
  patientId: string,
  patientEmail: string,
  patientName: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const nutritionistName: string = profile?.full_name ?? 'Tu nutricionista';

  // Generar token único para el formulario
  const token = randomUUID();

  // Insertar en followup_forms
  const { error: insertError } = await supabaseAdminClient.from('followup_forms').insert({
    patient_id: patientId,
    nutritionist_id: user.id,
    token,
    created_at: new Date().toISOString(),
  });

  if (insertError) return { error: 'Error creando el cuestionario.' };

  // Enviar email al paciente
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const formUrl = `${appUrl}/p/seguimiento/${token}`;

  try {
    await resendClient.emails.send({
      from: 'Dietly <noreply@dietly.es>',
      to: patientEmail,
      subject: `${nutritionistName} te ha enviado un cuestionario de seguimiento`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
          <div style="margin-bottom:24px">
            <span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
              CUESTIONARIO DE SEGUIMIENTO
            </span>
          </div>
          <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">
            Hola, ${patientName}
          </h2>
          <p style="margin:0 0 24px;color:#52525b;font-size:15px">
            Tu nutricionista <strong>${nutritionistName}</strong> te ha enviado este cuestionario de seguimiento
            a través de Dietly. Tus respuestas le ayudarán a ajustar tu plan nutricional.
          </p>
          <p style="margin:0 0 16px;color:#52525b;font-size:14px">
            Solo tardarás unos minutos en completarlo.
          </p>
          <div style="margin-top:12px;margin-bottom:28px">
            <a
              href="${formUrl}"
              style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px"
            >
              Responder cuestionario →
            </a>
          </div>
          <p style="margin-top:0;color:#71717a;font-size:13px">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
            <span style="color:#1a7a45">${formUrl}</span>
          </p>
          <p style="margin-top:32px;color:#a1a1aa;font-size:11px;border-top:1px solid #e4e4e7;padding-top:16px">
            Tus datos se tratan conforme al RGPD. Tu nutricionista es el responsable del tratamiento.
            Email generado por Dietly &mdash; No respondas a este mensaje.
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('[followup/sendQuestionnaire] email error:', emailErr);
    return { error: 'Error enviando el email al paciente.' };
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  return {};
}
