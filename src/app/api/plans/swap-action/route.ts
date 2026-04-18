import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recalcPlanAggregates } from '@/libs/plan-aggregates';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Meal, PlanContent } from '@/types/dietly';

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
