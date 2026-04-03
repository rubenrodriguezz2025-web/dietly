import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Meal, PlanContent } from '@/types/dietly';

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
