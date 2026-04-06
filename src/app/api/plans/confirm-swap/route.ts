import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Meal } from '@/types/dietly';
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

    // Verificar que la comida existe en el plan
    const content = plan.content as { days: Array<{ day_number: number; meals: Meal[] }> };
    const dayIndex = content.days.findIndex((d) => d.day_number === day_number);
    if (dayIndex === -1) {
      return NextResponse.json({ error: 'Día no encontrado' }, { status: 404 });
    }
    if (!content.days[dayIndex].meals[meal_index]) {
      return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });
    }

    // Verificar que no hay ya un swap pendiente para esta misma comida
    const { count: pendingCount } = await (supabaseAdminClient as any)
      .from('meal_swaps')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', plan_id)
      .eq('day_number', day_number)
      .eq('meal_index', meal_index)
      .eq('status', 'pending');

    if ((pendingCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Ya tienes un intercambio pendiente de aprobación para esta comida.' },
        { status: 409 },
      );
    }

    // Insertar swap con status 'pending' — NO actualizamos plan_data
    const { data: swapResult, error: swapError } = await (supabaseAdminClient as any)
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
        status: 'pending',
        initiated_by: 'patient',
      })
      .select('id')
      .single();

    if (swapError) {
      console.error('[confirm-swap] Error insertando swap:', swapError);
      return NextResponse.json({ error: 'Error al guardar la sugerencia' }, { status: 500 });
    }

    // ── Notificación email al nutricionista (fire-and-forget, rate limited) ──
    void (async () => {
      try {
        // Rate limit: máx 3 emails por paciente por día
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const { count: recentNotifs } = await (supabaseAdminClient as any)
          .from('meal_swaps')
          .select('id', { count: 'exact', head: true })
          .eq('patient_id', plan.patient_id)
          .not('notification_sent_at', 'is', null)
          .gte('notification_sent_at', dayStart.toISOString());

        if ((recentNotifs ?? 0) >= 3) return; // Límite diario alcanzado

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

        // Diferencia de macros
        const diffKcal = selected_meal.calories - original_meal.calories;
        const diffP = selected_meal.macros.protein_g - original_meal.macros.protein_g;
        const diffC = selected_meal.macros.carbs_g - original_meal.macros.carbs_g;
        const diffG = selected_meal.macros.fat_g - original_meal.macros.fat_g;
        const sign = (n: number) => (n > 0 ? '+' : '') + n;

        const { resendClient } = await import('@/libs/resend/resend-client');
        await resendClient.emails.send({
          from: 'Dietly <noreply@dietly.es>',
          to: emailNutricionista,
          subject: `${patientName} sugiere cambiar un plato`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
              <div style="margin-bottom:24px">
                <span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
                  INTERCAMBIO PENDIENTE
                </span>
              </div>
              <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">
                ${patientName} sugiere cambiar un plato
              </h2>
              <p style="margin:0 0 24px;color:#52525b;font-size:15px">
                El paciente propone un cambio en su plan nutricional. Revisa y aprueba o rechaza desde tu panel.
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
                <tr style="background:#fffbeb">
                  <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Sugerido</td>
                  <td style="padding:12px 16px;font-weight:600;color:#92400e;font-size:13px;border-top:1px solid #e4e4e7">${newName} (${selected_meal.calories} kcal)</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Diferencia</td>
                  <td style="padding:12px 16px;color:#71717a;font-size:12px;border-top:1px solid #e4e4e7">
                    ${sign(diffKcal)} kcal · ${sign(diffP)}g P · ${sign(diffC)}g C · ${sign(diffG)}g G
                  </td>
                </tr>
              </table>
              <div style="margin-top:28px">
                <a
                  href="${fichaUrl}"
                  style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px"
                >
                  Revisar intercambio →
                </a>
              </div>
              <p style="margin-top:32px;color:#a1a1aa;font-size:12px;border-top:1px solid #e4e4e7;padding-top:16px">
                Email generado automáticamente por Dietly · No respondas a este mensaje.
              </p>
            </div>
          `,
        });

        // Marcar notificación enviada
        if (swapResult?.id) {
          await (supabaseAdminClient as any)
            .from('meal_swaps')
            .update({ notification_sent_at: new Date().toISOString() })
            .eq('id', swapResult.id);
        }
      } catch (emailErr) {
        console.error('[confirm-swap] email notification error:', emailErr);
      }
    })();

    return NextResponse.json({
      success: true,
      swap_id: swapResult?.id ?? null,
      status: 'pending',
    });
  } catch (err) {
    console.error('[confirm-swap] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
