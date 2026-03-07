import type { NextRequest } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { ActivityLevel, Patient, PatientGoal, PlanContent, PlanDay } from '@/types/dietly';
import { getEnvVar } from '@/utils/get-env-var';
import Anthropic from '@anthropic-ai/sdk';

// Vercel: allow up to 5 minutes for 7 sequential Claude calls
export const maxDuration = 300;

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const GOAL_CALORIE_ADJ: Record<PatientGoal, number> = {
  weight_loss: -400,
  weight_gain: 300,
  maintenance: 0,
  muscle_gain: 300,
  health: 0,
};

const MACRO_DIST: Record<PatientGoal, { protein: number; carbs: number; fat: number }> = {
  weight_loss: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  weight_gain: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  maintenance: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  muscle_gain: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  health: { protein: 0.25, carbs: 0.5, fat: 0.25 },
};

function calcTargets(patient: Patient) {
  let tdee = patient.tdee;
  if (!tdee && patient.weight_kg && patient.height_cm && patient.date_of_birth && patient.sex && patient.sex !== 'other') {
    const age = Math.floor(
      (Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    const base = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * age;
    const tmb = patient.sex === 'male' ? base + 5 : base - 161;
    const factor = patient.activity_level ? ACTIVITY_FACTORS[patient.activity_level] : 1.375;
    tdee = Math.round(tmb * factor);
  }
  const baseTdee = tdee ?? 2000;
  const adj = patient.goal ? GOAL_CALORIE_ADJ[patient.goal] : 0;
  const calories = baseTdee + adj;
  const dist = patient.goal ? MACRO_DIST[patient.goal] : MACRO_DIST.health;
  return {
    calories,
    protein_g: Math.round((calories * dist.protein) / 4),
    carbs_g: Math.round((calories * dist.carbs) / 4),
    fat_g: Math.round((calories * dist.fat) / 9),
  };
}

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

function buildPrompt(
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

  return `Eres un dietista-nutricionista experto. Genera el plan nutricional del ${DAY_NAMES[dayNum - 1]} (día ${dayNum}/7).

PERFIL DEL PACIENTE:
- Objetivo: ${patient.goal ?? 'mejorar salud general'}
- Calorías diarias objetivo: ${targets.calories} kcal
- Macros objetivo: ${targets.protein_g}g proteína · ${targets.carbs_g}g carbohidratos · ${targets.fat_g}g grasa${restrictions ? `\n- Restricciones/alergias: ${restrictions}` : ''}${patient.preferences ? `\n- Preferencias: ${patient.preferences}` : ''}${patient.medical_notes ? `\n- Notas médicas: ${patient.medical_notes}` : ''}${variety}

REQUISITOS OBLIGATORIOS:
- 4-5 comidas (desayuno, media mañana opcional, almuerzo, merienda, cena)
- Cada comida: mínimo 2 ingredientes con cantidades exactas en gramos/ml/unidades
- Los macros de las comidas deben sumar aproximadamente el total diario
- Usa alimentos típicos españoles y mediterráneos variados
- Las instrucciones de preparación deben ser prácticas y concretas

Usa la herramienta generate_day para devolver el plan estructurado.`;
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
  try {
    const body = await req.json();
    patient_id = body.patient_id;
    if (!patient_id) throw new Error('missing patient_id');
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

  const targets = calcTargets(patient);

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
    return Response.json({ error: 'Error creando el plan' }, { status: 500 });
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
                  { role: 'user', content: buildPrompt(patient, dayNum, targets, days) },
                ],
              });

              const toolUse = response.content.find((b) => b.type === 'tool_use');
              if (toolUse?.type === 'tool_use') {
                const candidate = toolUse.input as PlanDay;
                const invalidMeals = validateDay(candidate);
                if (invalidMeals.length === 0 || attempts >= 2) {
                  dayData = candidate;
                }
                // else: retry with a nudge (second attempt)
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

        // Weekly averages
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
          },
          days,
          shopping_list: { produce: [], protein: [], dairy: [], grains: [], pantry: [] },
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
