'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { resendClient } from '@/libs/resend/resend-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// ── Crear cita ────────────────────────────────────────────────────────────────

export async function createAppointment(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const patient_id = (formData.get('patient_id') as string) || null;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const type = (formData.get('type') as string) || 'presencial';
  const notes = (formData.get('notes') as string) || null;
  const meeting_url = (formData.get('meeting_url') as string).trim() || null;

  if (!date || !time) return { error: 'La fecha y la hora son obligatorias.' };

  const { error } = await (supabase as any).from('appointments').insert({
    nutritionist_id: user.id,
    patient_id,
    date,
    time,
    type,
    notes,
    meeting_url: type === 'online' ? meeting_url : null,
    status: 'scheduled',
  });

  if (error) return { error: 'Error al guardar la cita. Inténtalo de nuevo.' };

  revalidatePath('/dashboard/agenda');
  return { success: true };
}

// ── Cambiar estado de cita ────────────────────────────────────────────────────

export async function updateAppointmentStatus(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  if (!id || !status) return;

  await (supabase as any)
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  revalidatePath('/dashboard/agenda');
}

// ── Eliminar cita ─────────────────────────────────────────────────────────────

export async function deleteAppointment(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  if (!id) return;

  await (supabase as any)
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('nutritionist_id', user.id);

  revalidatePath('/dashboard/agenda');
}

// ── Enviar recordatorio de videollamada al paciente ───────────────────────────

export async function sendAppointmentReminder(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const appointmentId = formData.get('appointment_id') as string;
  if (!appointmentId) return { error: 'ID de cita no válido.' };

  // Obtener la cita con datos del paciente y del nutricionista
  const { data: cita } = await (supabase as any)
    .from('appointments')
    .select('*, patients(name, email)')
    .eq('id', appointmentId)
    .eq('nutritionist_id', user.id)
    .single();

  if (!cita) return { error: 'Cita no encontrada.' };
  if (!cita.meeting_url) return { error: 'Esta cita no tiene enlace de videollamada.' };
  if (!cita.patients?.email) return { error: 'El paciente no tiene email registrado.' };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name')
    .eq('id', user.id)
    .single();

  const nutricionista = profile?.clinic_name ?? profile?.full_name ?? 'tu nutricionista';

  // Formatear fecha y hora
  const [year, month, day] = cita.date.split('-');
  const fecha = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const hora = cita.time.substring(0, 5);

  const { error: emailError } = await resendClient.emails.send({
    from: 'Dietly <noreply@dietly.es>',
    to: cita.patients.email as string,
    subject: `Recordatorio: tu consulta online el ${fecha} a las ${hora}`,
    html: buildReminderHtml({
      patientName: cita.patients.name as string,
      nutricionista,
      fecha,
      hora,
      meetingUrl: cita.meeting_url as string,
    }),
  });

  if (emailError) return { error: 'No se pudo enviar el email. Inténtalo de nuevo.' };

  return { success: true };
}

// ── HTML del email de recordatorio ───────────────────────────────────────────

function buildReminderHtml({
  patientName,
  nutricionista,
  fecha,
  hora,
  meetingUrl,
}: {
  patientName: string;
  nutricionista: string;
  fecha: string;
  hora: string;
  meetingUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de consulta online</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Cabecera verde -->
          <tr>
            <td style="background:#1a7a45;padding:28px 40px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:1px;">Dietly</p>
              <p style="margin:6px 0 0;font-size:12px;color:#a7f3d0;letter-spacing:0.3px;">Recordatorio de consulta online</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#18181b;">Hola <strong>${escHtml(patientName)}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
                Te recordamos que tienes una <strong>consulta online</strong> programada con
                <strong>${escHtml(nutricionista)}</strong>:
              </p>

              <!-- Tarjeta de datos -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">📅 Fecha</p>
                    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#18181b;text-transform:capitalize;">${escHtml(fecha)}</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">🕐 Hora</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#18181b;">${escHtml(hora)}</p>
                  </td>
                </tr>
              </table>

              <!-- Botón de videollamada -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escHtml(meetingUrl)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
                      Unirse a la videollamada
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                Si tienes alguna duda, contacta directamente con ${escHtml(nutricionista)}.<br>
                Este es un mensaje automático enviado desde Dietly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #e4e4e7;padding:20px 40px;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">
                Dietly · Plataforma para nutricionistas
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
