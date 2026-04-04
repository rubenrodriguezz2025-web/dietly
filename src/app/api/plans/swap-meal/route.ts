import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Meal, PlanContent } from '@/types/dietly';
import type Anthropic from '@anthropic-ai/sdk';

// ── Zod schema ──────────────────────────────────────────────────────────────

const bodySchema = z.object({
  plan_id: z.string().uuid(),
  day_number: z.number().int().min(1).max(7),
  meal_index: z.number().int().min(0),
  patient_token: z.string().min(1),
});

// ── Tool definition para Claude ─────────────────────────────────────────────

const ALTERNATIVES_TOOL: Anthropic.Tool = {
  name: 'generate_alternatives',
  description: 'Genera 3 alternativas de comida equivalentes en calorías y macros',
  input_schema: {
    type: 'object',
    properties: {
      alternatives: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            meal_type: { type: 'string' },
            meal_name: { type: 'string', description: 'Nombre descriptivo de la comida alternativa' },
            time_suggestion: { type: 'string' },
            calories: { type: 'number' },
            macros: {
              type: 'object',
              properties: {
                protein_g: { type: 'number' },
                carbs_g: { type: 'number' },
                fat_g: { type: 'number' },
              },
              required: ['protein_g', 'carbs_g', 'fat_g'],
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['name', 'quantity', 'unit'],
              },
            },
            preparation: { type: 'string' },
            notes: { type: 'string' },
          },
          required: ['meal_type', 'meal_name', 'time_suggestion', 'calories', 'macros', 'ingredients', 'preparation', 'notes'],
        },
      },
    },
    required: ['alternatives'],
  },
};

// ── Vercel config ────────────────────────────────────────────────────────────

export const maxDuration = 60;
export const runtime = 'nodejs';

// ── Handler ──────────────────────────────────────────────────────────────────

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

    const { plan_id, day_number, meal_index, patient_token } = parsed.data;

    // Lazy imports para evitar error en build time (env vars no disponibles)
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const { anthropicClient } = await import('@/libs/anthropic/client');
    const { callAnthropicWithResilience } = await import('@/libs/ai/resilience');

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

    // Verificar plan y token
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

    const content = plan.content as PlanContent;
    const day = content.days.find((d) => d.day_number === day_number);
    if (!day) {
      return NextResponse.json({ error: 'Día no encontrado' }, { status: 404 });
    }

    const meal = day.meals[meal_index];
    if (!meal) {
      return NextResponse.json({ error: 'Comida no encontrada' }, { status: 404 });
    }

    // Obtener restricciones del paciente para contexto
    const { data: patient } = await (supabaseAdminClient as any)
      .from('patients')
      .select('dietary_restrictions, allergies, intolerances, preferences')
      .eq('id', plan.patient_id)
      .single();

    const restrictions = patient?.dietary_restrictions?.join(', ') || 'ninguna';
    const allergies = patient?.allergies || 'ninguna';
    const intolerances = patient?.intolerances || 'ninguna';

    // Generar 3 alternativas con Claude
    const targetCal = meal.calories;
    const tolerance = Math.round(targetCal * 0.1);

    const prompt =
      `El paciente quiere cambiar esta comida de su plan:\n` +
      `- Tipo: ${meal.meal_type}\n` +
      `- Nombre: ${meal.meal_name}\n` +
      `- Calorías: ${targetCal} kcal\n` +
      `- Macros: P=${meal.macros.protein_g}g, C=${meal.macros.carbs_g}g, G=${meal.macros.fat_g}g\n` +
      `- Hora sugerida: ${meal.time_suggestion}\n\n` +
      `Restricciones del paciente:\n` +
      `- Dietéticas: ${restrictions}\n` +
      `- Alergias: ${allergies}\n` +
      `- Intolerancias: ${intolerances}\n\n` +
      `Genera 3 alternativas DIFERENTES entre sí que:\n` +
      `1. Sean del mismo tipo de comida (${meal.meal_type})\n` +
      `2. Tengan entre ${targetCal - tolerance} y ${targetCal + tolerance} kcal\n` +
      `3. Mantengan macros similares (±10%)\n` +
      `4. Usen alimentos típicos españoles y mediterráneos\n` +
      `5. Respeten las restricciones, alergias e intolerancias\n` +
      `6. Sean prácticas y fáciles de preparar\n` +
      `7. NO repitan la comida original ni entre sí\n\n` +
      `Usa la herramienta generate_alternatives para devolver las 3 alternativas.`;

    const alternatives = await callAnthropicWithResilience(async () => {
      const response = await anthropicClient.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system:
          'Eres un dietista-nutricionista experto en nutrición mediterránea española. ' +
          'Generas alternativas de comida equivalentes en calorías y macronutrientes. ' +
          'Las preparaciones deben ser en tono cercano ("Sofríe...", "Mezcla..."), ' +
          'con ingredientes cotidianos y cantidades exactas en g/ml/unidades. ' +
          'Usa la herramienta generate_alternatives para devolver el resultado.',
        messages: [{ role: 'user', content: prompt }],
        tools: [ALTERNATIVES_TOOL],
        tool_choice: { type: 'tool', name: 'generate_alternatives' },
      });

      const toolBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (!toolBlock) {
        throw new Error('Claude no devolvió alternativas');
      }

      return (toolBlock.input as { alternatives: Meal[] }).alternatives;
    }, 'swap_meal_alternatives');

    return NextResponse.json({
      alternatives,
      original_meal: meal,
      day_number,
      meal_index,
    });
  } catch (err) {
    console.error('[swap-meal] Error:', err);
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Error generando alternativas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
