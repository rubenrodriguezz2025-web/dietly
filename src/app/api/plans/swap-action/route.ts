import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recalcPlanAggregates } from '@/libs/plan-aggregates';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Meal, PlanContent } from '@/types/dietly';
import { escapeHtml } from '@/utils/escape-html';

const NOMBRE_DIA: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
  5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

type SwapEmailContext = {
  action: 'approve' | 'reject';
  patientId: string;
  planId: string;
  dayNumber: number;
  originalMealName: string;
  selectedMealName: string;
};

async function notifyPatientSwapDecision(ctx: SwapEmailContext): Promise<void> {
  try {
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');

    const [planResult, patientResult] = await Promise.all([
      (supabaseAdminClient as any)
        .from('nutrition_plans')
        .select('id, patient_token, nutritionist_id')
        .eq('id', ctx.planId)
        .single(),
      (supabaseAdminClient as any)
        .from('patients')
        .select('name, email')
        .eq('id', ctx.patientId)
        .single(),
    ]);

    const patientEmail = patientResult.data?.email as string | undefined;
    const patientName = (patientResult.data?.name as string | undefined) ?? 'Paciente';
    const patientToken = planResult.data?.patient_token as string | undefined;
    const nutritionistId = planResult.data?.nutritionist_id as string | undefined;

    if (!patientEmail || !patientToken || !nutritionistId) return;

    const { data: profileData } = await (supabaseAdminClient as any)
      .from('profiles')
      .select('full_name, clinic_name')
      .eq('id', nutritionistId)
      .single();

    const nutritionistName = (profileData?.full_name as string | undefined) ?? 'Tu nutricionista';
    const clinicName = profileData?.clinic_name as string | null | undefined;
    const fromLabel = clinicName ?? nutritionistName;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const planUrl = `${appUrl}/p/${encodeURIComponent(patientToken)}`;
    const diaNombre = NOMBRE_DIA[ctx.dayNumber] ?? `Día ${ctx.dayNumber}`;

    const safePatient = escapeHtml(patientName);
    const safeNutri = escapeHtml(nutritionistName);
    const safeFrom = escapeHtml(fromLabel);
    const safeOriginal = escapeHtml(ctx.originalMealName);
    const safeSelected = escapeHtml(ctx.selectedMealName);
    const safeDia = escapeHtml(diaNombre);

    const isApprove = ctx.action === 'approve';
    const subject = isApprove
      ? `${safeFrom}: tu cambio de plato ha sido aprobado`
      : `${safeFrom}: tu sugerencia de cambio ha sido revisada`;

    const badge = isApprove
      ? { bg: '#dcfce7', fg: '#166534', text: 'CAMBIO APROBADO' }
      : { bg: '#fee2e2', fg: '#991b1b', text: 'CAMBIO NO APLICADO' };

    const titulo = isApprove
      ? 'Tu cambio de plato ha sido aprobado'
      : 'Tu sugerencia de cambio ha sido revisada';

    const intro = isApprove
      ? `Tu nutricionista <strong>${safeNutri}</strong> ha aprobado el cambio de plato que solicitaste. Ya está actualizado en tu plan.`
      : `Tu nutricionista <strong>${safeNutri}</strong> ha revisado la sugerencia que enviaste y, por motivos nutricionales, el plato original se mantiene en tu plan. Si tienes dudas, contacta directamente con tu nutricionista.`;

    const filaSugerido = isApprove
      ? `<tr style="background:#f0fdf4">
          <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Nuevo plato</td>
          <td style="padding:12px 16px;font-weight:600;color:#166534;font-size:13px;border-top:1px solid #e4e4e7">${safeSelected}</td>
        </tr>`
      : `<tr>
          <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Sugerido</td>
          <td style="padding:12px 16px;color:#18181b;font-size:13px;border-top:1px solid #e4e4e7">${safeSelected}</td>
        </tr>`;

    const { resendClient } = await import('@/libs/resend/resend-client');
    await resendClient.emails.send({
      from: 'Dietly <noreply@dietly.es>',
      to: patientEmail,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
          <div style="margin-bottom:24px">
            <span style="display:inline-block;background:${badge.bg};color:${badge.fg};font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
              ${badge.text}
            </span>
          </div>
          <h2 style="margin:0 0 6px;font-size:22px;color:#18181b">Hola ${safePatient},</h2>
          <p style="margin:0 0 20px;color:#18181b;font-size:16px;font-weight:500">${titulo}</p>
          <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6">${intro}</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden">
            <tr style="background:#f4f4f5">
              <td style="padding:12px 16px;color:#71717a;font-size:13px;width:35%">Día</td>
              <td style="padding:12px 16px;font-weight:600;color:#18181b;font-size:13px">${safeDia}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#71717a;font-size:13px;border-top:1px solid #e4e4e7">Plato original</td>
              <td style="padding:12px 16px;color:#18181b;font-size:13px;border-top:1px solid #e4e4e7">${safeOriginal}</td>
            </tr>
            ${filaSugerido}
          </table>
          <div style="margin-top:28px">
            <a
              href="${planUrl}"
              style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px"
            >
              Ver mi plan →
            </a>
          </div>
          <p style="margin-top:32px;color:#a1a1aa;font-size:12px;border-top:1px solid #e4e4e7;padding-top:16px">
            Email generado automáticamente por Dietly · No respondas a este mensaje.
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('[swap-action] email notification error:', emailErr);
  }
}

// ── Zod schema ──────────────────────────────────────────────────────────────

const bodySchema = z.object({
  swap_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { swap_id, action } = parsed.data;

    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');

    // Obtener el swap y verificar que pertenece al nutricionista
    const { data: swap, error: swapError } = await (supabaseAdminClient as any)
      .from('meal_swaps')
      .select('id, plan_id, day_number, meal_index, selected_meal, original_meal, status, nutritionist_id, patient_id')
      .eq('id', swap_id)
      .eq('nutritionist_id', user.id)
      .single();

    if (swapError || !swap) {
      return NextResponse.json({ error: 'Intercambio no encontrado' }, { status: 404 });
    }

    if (swap.status !== 'pending') {
      return NextResponse.json(
        { error: `Este intercambio ya fue ${swap.status === 'approved' ? 'aprobado' : 'rechazado'}.` },
        { status: 409 },
      );
    }

    if (action === 'reject') {
      const { error: updateError } = await (supabaseAdminClient as any)
        .from('meal_swaps')
        .update({ status: 'rejected' })
        .eq('id', swap_id);

      if (updateError) {
        console.error('[swap-action] Error rechazando swap:', updateError);
        return NextResponse.json({ error: 'Error al rechazar el intercambio' }, { status: 500 });
      }

      // Notificar al paciente (fire-and-forget, no bloqueante)
      void notifyPatientSwapDecision({
        action: 'reject',
        patientId: swap.patient_id as string,
        planId: swap.plan_id as string,
        dayNumber: swap.day_number as number,
        originalMealName: (swap.original_meal as Meal)?.meal_name ?? '',
        selectedMealName: (swap.selected_meal as Meal)?.meal_name ?? '',
      });

      return NextResponse.json({ success: true, status: 'rejected' });
    }

    // ── Approve: actualizar plan_data + marcar approved ──────────────────────

    // Obtener plan actual
    const { data: plan, error: planError } = await (supabaseAdminClient as any)
      .from('nutrition_plans')
      .select('id, content')
      .eq('id', swap.plan_id)
      .eq('nutritionist_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const content = plan.content as PlanContent;
    const dayIndex = content.days.findIndex((d) => d.day_number === swap.day_number);
    if (dayIndex === -1) {
      return NextResponse.json({ error: 'Día no encontrado en el plan' }, { status: 404 });
    }

    const day = content.days[dayIndex];
    if (!day.meals[swap.meal_index]) {
      return NextResponse.json({ error: 'Comida no encontrada en el plan' }, { status: 404 });
    }

    // Reemplazar comida
    const selectedMeal = swap.selected_meal as Meal;
    day.meals[swap.meal_index] = selectedMeal;

    // Recalcular totales del día
    day.total_calories = day.meals.reduce((sum: number, m: Meal) => sum + m.calories, 0);
    day.total_macros = {
      protein_g: day.meals.reduce((sum: number, m: Meal) => sum + m.macros.protein_g, 0),
      carbs_g: day.meals.reduce((sum: number, m: Meal) => sum + m.macros.carbs_g, 0),
      fat_g: day.meals.reduce((sum: number, m: Meal) => sum + m.macros.fat_g, 0),
    };

    // Recalcular agregados semanales (promedios + lista de la compra)
    const { weekly_averages, shopping_list } = recalcPlanAggregates(content.days);
    const updatedContent: PlanContent = {
      ...content,
      week_summary: { ...content.week_summary, weekly_averages },
      shopping_list,
    };

    // Actualizar plan y swap en paralelo
    const [planUpdate, swapUpdate] = await Promise.all([
      (supabaseAdminClient as any)
        .from('nutrition_plans')
        .update({ content: updatedContent, updated_at: new Date().toISOString() })
        .eq('id', swap.plan_id),
      (supabaseAdminClient as any)
        .from('meal_swaps')
        .update({ status: 'approved' })
        .eq('id', swap_id),
    ]);

    if (planUpdate.error) {
      console.error('[swap-action] Error actualizando plan:', planUpdate.error);
      return NextResponse.json({ error: 'Error al actualizar el plan' }, { status: 500 });
    }

    if (swapUpdate.error) {
      console.error('[swap-action] Error aprobando swap:', swapUpdate.error);
      return NextResponse.json({ error: 'Error al aprobar el intercambio' }, { status: 500 });
    }

    // Notificar al paciente (fire-and-forget, no bloqueante)
    void notifyPatientSwapDecision({
      action: 'approve',
      patientId: swap.patient_id as string,
      planId: swap.plan_id as string,
      dayNumber: swap.day_number as number,
      originalMealName: (swap.original_meal as Meal)?.meal_name ?? '',
      selectedMealName: (swap.selected_meal as Meal)?.meal_name ?? '',
    });

    return NextResponse.json({
      success: true,
      status: 'approved',
      updated_day: day,
    });
  } catch (err) {
    console.error('[swap-action] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
