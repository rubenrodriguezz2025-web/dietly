import { NextResponse } from 'next/server';

import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function POST(req: Request) {
  let body: { token?: string; answers?: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido.' }, { status: 400 });
  }

  const { token, answers } = body;

  if (!token || !answers) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
  }

  // Buscar el formulario por token
  const { data: form } = await (supabaseAdminClient as any)
    .from('followup_forms')
    .select('id, patient_id, nutritionist_id, completed_at, created_at, patients(name, email), profiles(full_name)')
    .eq('token', token)
    .maybeSingle() as {
    data: {
      id: string;
      patient_id: string;
      nutritionist_id: string;
      completed_at: string | null;
      created_at: string;
      patients: { name: string; email: string | null } | null;
      profiles: { full_name: string } | null;
    } | null;
  };

  if (!form) {
    return NextResponse.json({ error: 'Formulario no encontrado.' }, { status: 404 });
  }

  if (form.completed_at) {
    return NextResponse.json({ error: 'Este cuestionario ya fue enviado.' }, { status: 409 });
  }

  const completedAt = new Date().toISOString();

  // Guardar respuestas y marcar como completado
  const { error: updateError } = await (supabaseAdminClient as any)
    .from('followup_forms')
    .update({ answers, completed_at: completedAt })
    .eq('id', form.id);

  if (updateError) {
    return NextResponse.json({ error: 'Error guardando las respuestas.' }, { status: 500 });
  }

  const patientName = form.patients?.name ?? 'Paciente';
  const nutritionistName = form.profiles?.full_name ?? 'Nutricionista';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const fichaUrl = `${appUrl}/dashboard/patients/${form.patient_id}`;

  // Enviar email al nutricionista con las respuestas
  try {
    const { data: nutritionistAuth } = await (supabaseAdminClient as any)
      .from('profiles')
      .select('id')
      .eq('id', form.nutritionist_id)
      .maybeSingle();

    // Obtener email del nutricionista desde auth.users
    const { data: authUser } = await supabaseAdminClient.auth.admin.getUserById(
      nutritionistAuth?.id ?? form.nutritionist_id
    );

    const nutritionistEmail = authUser?.user?.email;

    if (nutritionistEmail) {
      const PREGUNTAS_LABELS: Record<string, string> = {
        adherencia: '¿Has podido seguir el plan esta semana? (0-10)',
        dificultades: '¿Qué comidas o días te han resultado más difíciles?',
        bienestar: '¿Cómo te has sentido en general?',
        cambios_fisicos: '¿Has notado cambios en tu peso o cómo te queda la ropa?',
        actividad: '¿Has realizado actividad física?',
        cambios_recetas: '¿Hay alguna comida o receta que quieras cambiar?',
        cambios_rutina: '¿Ha cambiado algo en tu rutina u horarios?',
        dudas: '¿Tienes alguna duda o algo que quieras comentarle a tu nutricionista?',
      };

      const answersHtml = Object.entries(answers)
        .map(([key, value]) => {
          const label = PREGUNTAS_LABELS[key] ?? key;
          const displayValue = value !== null && value !== '' ? String(value) : '<em style="color:#a1a1aa">Sin respuesta</em>';
          return `
          <tr>
            <td style="padding:10px 16px;border-top:1px solid #e4e4e7;vertical-align:top;width:45%;color:#71717a;font-size:13px">${label}</td>
            <td style="padding:10px 16px;border-top:1px solid #e4e4e7;color:#18181b;font-size:13px">${displayValue}</td>
          </tr>`;
        })
        .join('');

      await resendClient.emails.send({
        from: 'Dietly <noreply@dietly.es>',
        to: nutritionistEmail,
        subject: `${patientName} ha respondido su cuestionario de seguimiento`,
        html: `
          <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#18181b">
            <div style="margin-bottom:24px">
              <span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
                CUESTIONARIO COMPLETADO
              </span>
            </div>
            <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">
              Hola, ${nutritionistName.split(' ')[0]}
            </h2>
            <p style="margin:0 0 24px;color:#52525b;font-size:15px">
              <strong>${patientName}</strong> ha respondido su cuestionario de seguimiento.
            </p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
              <tr style="background:#f4f4f5">
                <td colspan="2" style="padding:10px 16px;font-size:12px;font-weight:700;color:#71717a;letter-spacing:0.05em;text-transform:uppercase">
                  Respuestas
                </td>
              </tr>
              ${answersHtml}
            </table>
            <div style="margin-top:28px">
              <a
                href="${fichaUrl}"
                style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px"
              >
                Ver ficha y generar nuevo plan →
              </a>
            </div>
            <p style="margin-top:32px;color:#a1a1aa;font-size:12px;border-top:1px solid #e4e4e7;padding-top:16px">
              Email generado automáticamente por Dietly · No respondas a este mensaje.
            </p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error('[followup/submit] email notification error:', emailErr);
  }

  // Crear nuevo recordatorio encadenado
  try {
    // Buscar el último recordatorio para este paciente para obtener el intervalo
    const { data: lastReminder } = await (supabaseAdminClient as any)
      .from('followup_reminders')
      .select('days_interval')
      .eq('patient_id', form.patient_id)
      .eq('nutritionist_id', form.nutritionist_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const intervalDays: number | null = lastReminder?.days_interval ?? null;

    if (intervalDays !== null) {
      const nextRemindAt = new Date();
      nextRemindAt.setDate(nextRemindAt.getDate() + intervalDays);
      const nextRemindAtStr = nextRemindAt.toISOString().split('T')[0];

      await (supabaseAdminClient as any).from('followup_reminders').insert({
        patient_id: form.patient_id,
        nutritionist_id: form.nutritionist_id,
        remind_at: nextRemindAtStr,
        status: 'pending',
        days_interval: intervalDays,
      });
    }
  } catch (reminderErr) {
    console.error('[followup/submit] chained reminder error:', reminderErr);
  }

  return NextResponse.json({ ok: true });
}
