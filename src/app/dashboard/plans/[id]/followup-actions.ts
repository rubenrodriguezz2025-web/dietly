'use server';

import { revalidatePath } from 'next/cache';

import { resendClient } from '@/libs/resend/resend-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// ── Guardar recordatorio de seguimiento ───────────────────────────────────────

export async function saveFollowupReminder(
  patientId: string,
  nutritionistId: string,
  days: number | null,
  patientName: string,
): Promise<{ error?: string }> {
  if (days === null) return {};

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const remindAt = new Date();
  remindAt.setDate(remindAt.getDate() + days);
  const remindAtStr = remindAt.toISOString().split('T')[0];

  const { error } = await (supabase as any).from('followup_reminders').insert({
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    remind_at: remindAtStr,
    status: 'pending',
    days_interval: days,
  });

  if (error) return { error: 'Error guardando el recordatorio.' };

  // Enviar email al nutricionista con el recordatorio
  try {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('full_name')
      .eq('id', nutritionistId)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const fichaUrl = `${appUrl}/dashboard/patients/${patientId}`;
    const fechaRecordatorio = remindAt.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await resendClient.emails.send({
      from: 'Dietly <noreply@dietly.es>',
      to: user.email ?? '',
      subject: `Recordatorio configurado — revisión de ${patientName} el ${fechaRecordatorio}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
          <div style="margin-bottom:24px">
            <span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
              RECORDATORIO CONFIGURADO
            </span>
          </div>
          <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">
            Hola, ${profile?.full_name?.split(' ')[0] ?? 'nutricionista'}
          </h2>
          <p style="margin:0 0 24px;color:#52525b;font-size:15px">
            Hemos anotado que quieres revisar a <strong>${patientName}</strong> el
            <strong>${fechaRecordatorio}</strong> (en ${days} días). Te avisaremos ese día en el dashboard.
          </p>
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
    console.error('[followup/saveFollowupReminder] email error:', emailErr);
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  return {};
}
