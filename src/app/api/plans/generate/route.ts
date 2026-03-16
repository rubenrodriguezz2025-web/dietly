import type { NextRequest } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Patient, PlanContent, PlanDay, ShoppingList } from '@/types/dietly';
import { GOAL_LABELS } from '@/types/dietly';
import { calcTargets, type MacroOverrides } from '@/utils/calc-targets';
import { getEnvVar } from '@/utils/get-env-var';
import Anthropic from '@anthropic-ai/sdk';

// Vercel: allow up to 5 minutes for 7 sequential Claude calls + shopping list
export const maxDuration = 300;

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DAY_TOOL: Anthropic.Tool = {
  name: 'generate_day',
  description: 'Genera el plan nutricional completo para un día específico de la semana',
  input_schema: {
    type: 'object',
    properties: {
      day_number: { type: 'number', description: 'Número del día (1=Lunes, 7=Domingo)' },
      day_name: { type: 'string', description: 'Nombre del día en español' },
      total_calories: { type: 'number', description: 'Total de calorías del día' },
      total_macros: {
        type: 'object',
        properties: {
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
        },
        required: ['protein_g', 'carbs_g', 'fat_g'],
      },
      meals: {
        type: 'array',
        description: 'Lista de comidas del día (4-5 comidas)',
        items: {
          type: 'object',
          properties: {
            meal_type: {
              type: 'string',
              enum: ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena'],
            },
            meal_name: { type: 'string', description: 'Nombre descriptivo de la comida' },
            time_suggestion: { type: 'string', description: 'Hora sugerida, ej: 08:00' },
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
              description: 'Mínimo 2 ingredientes con cantidades exactas',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string', description: 'g, ml, unidades, cucharadas, etc.' },
                },
                required: ['name', 'quantity', 'unit'],
              },
              minItems: 2,
            },
            preparation: { type: 'string', description: 'Instrucciones de preparación claras' },
            notes: { type: 'string', description: 'Notas adicionales o variantes' },
          },
          required: [
            'meal_type',
            'meal_name',
            'time_suggestion',
            'calories',
            'macros',
            'ingredients',
            'preparation',
            'notes',
          ],
        },
        minItems: 4,
      },
    },
    required: ['day_number', 'day_name', 'total_calories', 'total_macros', 'meals'],
  },
};

const SHOPPING_LIST_TOOL: Anthropic.Tool = {
  name: 'generate_shopping_list',
  description: 'Genera la lista de la compra consolidada y categorizada para el plan semanal completo',
  input_schema: {
    type: 'object',
    properties: {
      produce: {
        type: 'array',
        items: { type: 'string' },
        description: 'Frutas y verduras ÚNICAMENTE (no incluir carnes, embutidos ni lácteos)',
      },
      protein: {
        type: 'array',
        items: { type: 'string' },
        description: 'Carnes, pescados, huevos, legumbres, embutidos y derivados cárnicos',
      },
      dairy: {
        type: 'array',
        items: { type: 'string' },
        description: 'Leche, yogur, queso, bebidas vegetales',
      },
      grains: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pan, arroz, pasta, cereales, avena, harinas',
      },
      pantry: {
        type: 'array',
        items: { type: 'string' },
        description: 'Aceites, condimentos, especias, conservas, frutos secos, salsas',
      },
    },
    required: ['produce', 'protein', 'dairy', 'grains', 'pantry'],
  },
};

function buildDayPrompt(
  patient: Patient,
  dayNum: number,
  targets: ReturnType<typeof calcTargets>,
  previousDays: PlanDay[]
): string {
  const restrictions = [
    patient.dietary_restrictions,
    patient.allergies ? `Alergias: ${patient.allergies}` : null,
    patient.intolerances ? `Intolerancias: ${patient.intolerances}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  const variety =
    previousDays.length > 0
      ? `\nDías ya generados (evita repetir comidas idénticas):\n${previousDays
          .map((d) => `  ${d.day_name}: ${d.meals.map((m) => m.meal_name).join(', ')}`)
          .join('\n')}`
      : '';

  const carbsPctDisplay = Math.round(targets.carbs_pct * 100);
  const fatPctDisplay = Math.round(targets.fat_pct * 100);

  return `Eres un dietista-nutricionista experto. Genera el plan nutricional del ${DAY_NAMES[dayNum - 1]} (día ${dayNum}/7).

PERFIL DEL PACIENTE:
- Objetivo: ${patient.goal ? (GOAL_LABELS[patient.goal] ?? patient.goal) : 'mejorar salud general'}
- Calorías diarias objetivo: ${targets.calories} kcal
- Proteína objetivo: ${targets.protein_g}g (${targets.protein_per_kg}g/kg peso corporal)
- Carbohidratos: ${targets.carbs_g}g (${carbsPctDisplay}% de calorías restantes tras proteína)
- Grasa: ${targets.fat_g}g (${fatPctDisplay}% de calorías restantes tras proteína)${restrictions ? `\n- Restricciones/alergias: ${restrictions}` : ''}${patient.preferences ? `\n- Preferencias: ${patient.preferences}` : ''}${patient.medical_notes ? `\n- Notas médicas: ${patient.medical_notes}` : ''}${variety}

REQUISITOS OBLIGATORIOS:
- 4-5 comidas (desayuno, media mañana opcional, almuerzo, merienda, cena)
- Cada comida: mínimo 2 ingredientes con cantidades exactas en gramos/ml/unidades
- Los macros de las comidas deben sumar aproximadamente el total diario
- Usa alimentos típicos españoles y mediterráneos variados
- Las instrucciones de preparación deben ser prácticas y concretas

Usa la herramienta generate_day para devolver el plan estructurado.`;
}

function buildShoppingListPrompt(days: PlanDay[]): string {
  const allIngredients = days
    .flatMap((d) => d.meals)
    .flatMap((m) => m.ingredients)
    .map((i) => `${i.name} (${i.quantity} ${i.unit})`)
    .join('\n');

  return `Eres un dietista-nutricionista experto. A partir de los ingredientes del plan semanal, genera una lista de la compra consolidada y categorizada.

INGREDIENTES DEL PLAN:
${allIngredients}

REGLAS DE CATEGORIZACIÓN ESTRICTAS:
- "produce": frutas y verduras ÚNICAMENTE (no incluir carnes, embutidos ni lácteos)
- "protein": carnes, pescados, huevos, legumbres, embutidos y derivados cárnicos
- "dairy": leche, yogur, queso, bebidas vegetales
- "grains": pan, arroz, pasta, cereales, avena, harinas
- "pantry": aceites, condimentos, especias, conservas, frutos secos, salsas

Si tienes dudas sobre un alimento, prioriza la categoría "protein" para cualquier alimento de origen animal.

Agrupa los ingredientes similares y suma cantidades cuando aparezcan varias veces (ej: "Pechuga de pollo 800g").
Usa la herramienta generate_shopping_list para devolver la lista estructurada.`;
}

function validateDay(day: PlanDay): number[] {
  return day.meals
    .map((meal, i) => (meal.calories <= 0 || meal.ingredients.length < 2 ? i : -1))
    .filter((i) => i >= 0);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  let patient_id: string;
  let macro_overrides: MacroOverrides | undefined;
  try {
    const body = await req.json();
    patient_id = body.patient_id;
    if (!patient_id) throw new Error('missing patient_id');
    if (body.macro_overrides && typeof body.macro_overrides === 'object') {
      macro_overrides = body.macro_overrides as MacroOverrides;
    }
  } catch {
    return Response.json({ error: 'patient_id requerido' }, { status: 400 });
  }

  const { data: patient } = (await (supabase as any)
    .from('patients')
    .select('*')
    .eq('id', patient_id)
    .eq('nutritionist_id', user.id)
    .single()) as { data: Patient | null };

  if (!patient) {
    return Response.json({ error: 'Paciente no encontrado' }, { status: 404 });
  }

  const targets = calcTargets(patient, macro_overrides);

  // Next Monday as week_start_date
  const now = new Date();
  const daysUntilMonday = ((8 - now.getDay()) % 7) || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + daysUntilMonday);
  weekStart.setHours(0, 0, 0, 0);

  const emptyContent: PlanContent = {
    week_summary: {
      target_daily_calories: targets.calories,
      target_macros: {
        protein_g: targets.protein_g,
        carbs_g: targets.carbs_g,
        fat_g: targets.fat_g,
      },
      weekly_averages: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      protein_per_kg: targets.protein_per_kg,
      carbs_pct: targets.carbs_pct,
      fat_pct: targets.fat_pct,
      goal: patient.goal ?? 'health',
    },
    days: [],
    shopping_list: { produce: [], protein: [], dairy: [], grains: [], pantry: [] },
  };

  const { data: planRecord, error: createError } = await (supabaseAdminClient as any)
    .from('nutrition_plans')
    .insert({
      patient_id,
      nutritionist_id: user.id,
      status: 'generating',
      week_start_date: weekStart.toISOString().split('T')[0],
      content: emptyContent,
      patient_token: crypto.randomUUID(),
    })
    .select('id')
    .single();

  if (createError || !planRecord) {
    console.error('[plans/generate] createError status:', createError?.code);
    console.error('[plans/generate] createError message:', createError?.message);
    console.error('[plans/generate] createError details:', createError?.details);
    console.error('[plans/generate] createError hint:', createError?.hint);
    return Response.json({ error: 'Error creando el plan', detail: createError?.message }, { status: 500 });
  }

  const planId = planRecord.id as string;
  const anthropic = new Anthropic({
    apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      const days: PlanDay[] = [];

      try {
        send({ type: 'start', plan_id: planId });

        // Generar los 7 días
        for (let dayNum = 1; dayNum <= 7; dayNum++) {
          send({ type: 'progress', day: dayNum, day_name: DAY_NAMES[dayNum - 1] });

          let dayData: PlanDay | null = null;
          let attempts = 0;

          while (attempts < 2 && !dayData) {
            attempts++;
            try {
              const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 4096,
                tools: [DAY_TOOL],
                tool_choice: { type: 'tool', name: 'generate_day' },
                messages: [
                  { role: 'user', content: buildDayPrompt(patient, dayNum, targets, days) },
                ],
              });

              const toolUse = response.content.find((b) => b.type === 'tool_use');
              if (toolUse?.type === 'tool_use') {
                const candidate = toolUse.input as PlanDay;
                const invalidMeals = validateDay(candidate);
                if (invalidMeals.length === 0 || attempts >= 2) {
                  dayData = candidate;
                }
              }
            } catch (err) {
              if (attempts >= 2) throw err;
            }
          }

          if (!dayData) {
            await (supabaseAdminClient as any)
              .from('nutrition_plans')
              .update({ status: 'error' })
              .eq('id', planId);
            send({ type: 'error', message: `Error generando el día ${dayNum}. Inténtalo de nuevo.` });
            controller.close();
            return;
          }

          days.push(dayData);
        }

        // Generar lista de la compra
        send({ type: 'progress', day: 8, day_name: 'Lista de la compra' });
        let shoppingList: ShoppingList = { produce: [], protein: [], dairy: [], grains: [], pantry: [] };
        try {
          const shoppingResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 2048,
            tools: [SHOPPING_LIST_TOOL],
            tool_choice: { type: 'tool', name: 'generate_shopping_list' },
            messages: [{ role: 'user', content: buildShoppingListPrompt(days) }],
          });
          const shoppingToolUse = shoppingResponse.content.find((b) => b.type === 'tool_use');
          if (shoppingToolUse?.type === 'tool_use') {
            shoppingList = shoppingToolUse.input as ShoppingList;
          }
        } catch (err) {
          // La lista de la compra no es crítica — continuamos con lista vacía
          console.error('[plans/generate] shopping list error:', err);
        }

        // Promedios semanales
        const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
        const content: PlanContent = {
          week_summary: {
            target_daily_calories: targets.calories,
            target_macros: {
              protein_g: targets.protein_g,
              carbs_g: targets.carbs_g,
              fat_g: targets.fat_g,
            },
            weekly_averages: {
              calories: avg(days.map((d) => d.total_calories)),
              protein_g: avg(days.map((d) => d.total_macros.protein_g)),
              carbs_g: avg(days.map((d) => d.total_macros.carbs_g)),
              fat_g: avg(days.map((d) => d.total_macros.fat_g)),
            },
            protein_per_kg: targets.protein_per_kg,
            carbs_pct: targets.carbs_pct,
            fat_pct: targets.fat_pct,
            goal: patient.goal ?? 'health',
          },
          days,
          shopping_list: shoppingList,
        };

        await (supabaseAdminClient as any)
          .from('nutrition_plans')
          .update({ status: 'draft', content })
          .eq('id', planId);

        send({ type: 'done', plan_id: planId });
      } catch (err) {
        console.error('[plans/generate] error:', err);
        await (supabaseAdminClient as any)
          .from('nutrition_plans')
          .update({ status: 'error' })
          .eq('id', planId);
        send({ type: 'error', message: 'Error inesperado. Inténtalo de nuevo.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
