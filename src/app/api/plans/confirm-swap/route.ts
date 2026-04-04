import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Meal, PlanContent } from '@/types/dietly';
import { escapeHtml } from '@/utils/escape-html';

// ── Zod schema ──────────────────────────────────────────────────────────────

const mealSchema = z.object({
  meal_type: z.string(),
  meal_name: z.string(),
  time_suggestion: z.string(),
  calories: z.number(),
  macros: z.object({
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
  }),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })),
  preparation: z.string(),
  notes: z.string(),
});

const bodySchema = z.object({
  plan_id: z.string().uuid(),
  patient_token: z.string().min(1),
  day_number: z.number().int().min(1).max(7),
  meal_index: z.number().int().min(0),
  selected_meal: mealSchema,
  original_meal: mealSchema,
  alternatives: z.array(mealSchema),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      plan_id,
      patient_token,
      day_number,
      meal_index,
      selected_meal,
      original_meal,
      alternatives,
      reason,
    } = parsed.data;

    // Lazy import para evitar error en build time
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');

    // Rate limiting: máximo 10 swaps por plan por día
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: swapsToday } = await (supabaseAdminClient as any)
      .from('meal_swaps')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', plan_id)
      .gte('created_at', todayStart.toISOString());

    if ((swapsToday ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de 10 intercambios por día para este plan.' },
        { status: 429 },
      );
    }

    // Verificar plan
    const { data: plan, error: planError } = await (supabaseAdminClient as any)
      .from('nutrition_plans')
      .select('id, content, patient_id, nutritionist_id, status')
      .eq('id', plan_id)
      .eq('patient_token', patient_token)
      .in('status', ['approved', 'sent'])
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // Actualizar el contenido del plan con la nueva comida
    const content = plan.content as PlanContent;
    const dayIndex = content.days.findIndex((d) => d.day_number === day_number);
    if (dayIndex === -1) {
      return NextResponse.json({ error: 'Día no encontrado' }, { status: 404 });
    }

    if (!content.days[dayIndex].meals[meal_index]) {
      return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });
    }

    // Reemplazar la comida en el plan
    content.days[dayIndex].meals[meal_index] = selected_meal as Meal;

    // Recalcular totales del día
    const dayMeals = content.days[dayIndex].meals;
    content.days[dayIndex].total_calories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    content.days[dayIndex].total_macros = {
      protein_g: dayMeals.reduce((sum, m) => sum + m.macros.protein_g, 0),
      carbs_g: dayMeals.reduce((sum, m) => sum + m.macros.carbs_g, 0),
      fat_g: dayMeals.reduce((sum, m) => sum + m.macros.fat_g, 0),
    };

    // Persistir en paralelo: actualizar plan + insertar registro de swap
    const [updateResult, swapResult] = await Promise.all([
      (supabaseAdminClient as any)
        .from('nutrition_plans')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', plan_id),
      (supabaseAdminClient as any)
        .from('meal_swaps')
        .insert({
          plan_id,
          patient_id: plan.patient_id,
          nutritionist_id: plan.nutritionist_id,
          day_number,
          meal_index,
          original_meal: original_meal,
          selected_meal: selected_meal,
          alternatives: alternatives,
          reason: reason ?? null,
        })
        .select('id')
        .single(),
    ]);

    if (updateResult.error) {
      console.error('[confirm-swap] Error actualizando plan:', updateResult.error);
      return NextResponse.json({ error: 'Error al guardar el cambio' }, { status: 500 });
    }

    if (swapResult.error) {
      console.error('[confirm-swap] Error insertando swap:', swapResult.error);
      // El plan ya se actualizó, no bloqueamos — el swap se registrará como huérfano
    }

    // ── Notificación email al nutricionista (fire-and-forget, rate limited) ──
    void (async () => {
      try {
        // Rate limit: 1 email por paciente cada 6 horas
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        const { count: recentNotifs } = await (supabaseAdminClient as any)
          .from('meal_swaps')
          .select('id', { count: 'exact', head: true })
          .eq('patient_id', plan.patient_id)
          .not('notification_sent_at', 'is', null)
          .gte('notification_sent_at', sixHoursAgo);

        if ((recentNotifs ?? 0) > 0) return; // Ya se notificó recientemente

        // Obtener datos del nutricionista y paciente
        const [nutResult, patResult] = await Promise.all([
          (supabaseAdminClient as any).auth.admin.getUserById(plan.nutritionist_id),
          (supabaseAdminClient as any)
            .from('patients')
            .select('name')
            .eq('id', plan.patient_id)
            .single(),
        ]);

        const emailNutricionista = nutResult.data?.user?.email;
        if (!emailNutricionista) return;

        const patientName = escapeHtml(patResult.data?.name ?? 'Paciente');
        const originalName = escapeHtml(original_meal.meal_name);
        const newName = escapeHtml(selected_meal.meal_name);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
        const fichaUrl = `${appUrl}/dashboard/patients/${encodeURIComponent(plan.patient_id)}`;

        const NOMBRE_DIA: Record<number, string> = {
          1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
          5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
        };
        const diaNombre = NOMBRE_DIA[day_number] ?? `Día ${day_number}`;

        const { resendClient } = await import('@/libs/resend/resend-client');
        await resendClient.emails.send({
          from: 'Dietly <noreply@dietly.es>',
          to: emailNutricionista,
          subject: `Intercambio de plato — ${patientName}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
              <div style="margin-bottom:24px">
                <span style="display:inline-block;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
                  INTERCAMBIO DE PLATO
                </span>
              </div>
              <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">
                ${patientName} ha cambiado un plato
              </h2>
              <p style="margin:0 0 24px;color:#52525b;font-size:15px">
                El paciente ha utilizado el intercambio de platos en su plan nutricional.
              </p>
              <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
                <tr style="background:#f4f4f5">
                  <td style="padding:12px 16px;color:#71717a;font-size:13px;width:35%">Día</td>
                  <td style="padding:12px 16px;font-weight:600;color:#18181b;font-size:13px">${diaNombre}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Original</td>
                  <td style="padding:12px 16px;color:#18181b;font-size:13px;border-top:1px solid #e4e4e7">${originalName} (${original_meal.calories} kcal)</td>
                </tr>
                <tr style="background:#f0fdf4">
                  <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Nuevo</td>
                  <td style="padding:12px 16px;font-weight:600;color:#047857;font-size:13px;border-top:1px solid #e4e4e7">${newName} (${selected_meal.calories} kcal)</td>
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

        // Marcar notificación enviada
        if (swapResult.data?.id) {
          await (supabaseAdminClient as any)
            .from('meal_swaps')
            .update({ notification_sent_at: new Date().toISOString() })
            .eq('id', swapResult.data.id);
        }
      } catch (emailErr) {
        console.error('[confirm-swap] email notification error:', emailErr);
      }
    })();

    return NextResponse.json({
      success: true,
      swap_id: swapResult.data?.id ?? null,
      updated_day: content.days[dayIndex],
    });
  } catch (err) {
    console.error('[confirm-swap] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
