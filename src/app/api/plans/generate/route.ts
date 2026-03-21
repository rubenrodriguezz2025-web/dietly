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
export const runtime = 'nodejs';

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

// Mapeos legibles para los valores de select del intake
const COME_FUERA_LABELS: Record<string, string> = {
  no: 'no, casi siempre en casa',
  si_poco: 'sí, 1-2 veces por semana',
  si_bastante: 'sí, 3-4 veces por semana',
  si_mucho: 'sí, casi todos los días',
};

const COCINA_EN_CASA_LABELS: Record<string, string> = {
  si_siempre: 'sí, casi siempre',
  si_a_veces: 'sí, a veces',
  poco: 'poco, cosas sencillas',
  no: 'no cocina',
};

export type IntakeAnswers = {
  comidas_al_dia?: string;
  hora_desayuno?: string;
  hora_almuerzo?: string;
  hora_merienda?: string;
  hora_cena?: string;
  alergias_intolerancias?: string;
  alimentos_no_gustados?: string;
  come_fuera?: string;
  cocina_en_casa?: string;
  actividad_fisica?: string;
  objetivo_personal?: string;
  dieta_especial?: string;
  condicion_medica?: string;
  observaciones?: string;
};

function buildIntakeSection(answers: IntakeAnswers): string {
  const lines: string[] = [];

  // Horarios
  const horarios: string[] = [];
  if (answers.hora_desayuno) horarios.push(`desayuno ${answers.hora_desayuno}`);
  if (answers.hora_merienda) horarios.push(`media mañana ${answers.hora_merienda}`);
  if (answers.hora_almuerzo) horarios.push(`almuerzo ${answers.hora_almuerzo}`);
  if (answers.hora_cena) horarios.push(`cena ${answers.hora_cena}`);
  if (horarios.length > 0) lines.push(`- Horarios habituales: ${horarios.join(', ')}`);

  if (answers.comidas_al_dia) lines.push(`- Número de comidas preferidas al día: ${answers.comidas_al_dia}`);
  if (answers.alimentos_no_gustados?.trim()) lines.push(`- Alimentos que no le gustan o evita: ${answers.alimentos_no_gustados.trim()}`);
  if (answers.alergias_intolerancias?.trim()) lines.push(`- Alergias/intolerancias declaradas por el paciente: ${answers.alergias_intolerancias.trim()}`);

  const comeFuera = answers.come_fuera ? COME_FUERA_LABELS[answers.come_fuera] : null;
  if (comeFuera) lines.push(`- Come fuera de casa: ${comeFuera}`);

  const cocinaEnCasa = answers.cocina_en_casa ? COCINA_EN_CASA_LABELS[answers.cocina_en_casa] : null;
  if (cocinaEnCasa) lines.push(`- Cocina en casa: ${cocinaEnCasa}`);

  if (answers.dieta_especial?.trim()) lines.push(`- Dieta especial que sigue actualmente: ${answers.dieta_especial.trim()}`);
  if (answers.condicion_medica?.trim()) lines.push(`- Condición médica declarada: ${answers.condicion_medica.trim()}`);
  if (answers.observaciones?.trim()) lines.push(`- Observaciones del paciente: ${answers.observaciones.trim()}`);

  if (lines.length === 0) return '';
  return `\nCUESTIONARIO DEL PACIENTE (respondido por el propio paciente):\n${lines.join('\n')}`;
}

function buildDayPrompt(
  patient: Patient,
  dayNum: number,
  targets: ReturnType<typeof calcTargets>,
  previousDays: PlanDay[],
  intakeAnswers?: IntakeAnswers
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

  const intakeSection = intakeAnswers ? buildIntakeSection(intakeAnswers) : '';

  const carbsPctDisplay = Math.round(targets.carbs_pct * 100);
  const fatPctDisplay = Math.round(targets.fat_pct * 100);

  // Horarios por defecto desde el intake (si existen)
  const horarioDesayuno = intakeAnswers?.hora_desayuno ?? '08:00';
  const horarioAlmuerzo = intakeAnswers?.hora_almuerzo ?? '14:00';
  const horarioCena = intakeAnswers?.hora_cena ?? '21:00';
  const horarioMerienda = intakeAnswers?.hora_merienda ?? '17:00';

  return `Eres un dietista-nutricionista experto. Genera el plan nutricional del ${DAY_NAMES[dayNum - 1]} (día ${dayNum}/7).

PERFIL DEL PACIENTE:
- Objetivo: ${patient.goal ? (GOAL_LABELS[patient.goal] ?? patient.goal) : 'mejorar salud general'}
- Calorías diarias objetivo: ${targets.calories} kcal
- Proteína objetivo: ${targets.protein_g}g (${targets.protein_per_kg}g/kg peso corporal)
- Carbohidratos: ${targets.carbs_g}g (${carbsPctDisplay}% de calorías restantes tras proteína)
- Grasa: ${targets.fat_g}g (${fatPctDisplay}% de calorías restantes tras proteína)${restrictions ? `\n- Restricciones/alergias: ${restrictions}` : ''}${patient.preferences ? `\n- Preferencias: ${patient.preferences}` : ''}${patient.medical_notes ? `\n- Notas médicas: ${patient.medical_notes}` : ''}${intakeSection}${variety}

REQUISITOS OBLIGATORIOS:
- 4-5 comidas (desayuno, media mañana opcional, almuerzo, merienda, cena)
- Cada comida: mínimo 2 ingredientes con cantidades exactas en gramos/ml/unidades
- Los macros de las comidas deben sumar aproximadamente el total diario
- Usa alimentos típicos españoles y mediterráneos variados
- Las instrucciones de preparación deben ser prácticas y concretas
- Respeta los horarios habituales del paciente como time_suggestion: desayuno ${horarioDesayuno}, almuerzo ${horarioAlmuerzo}, merienda ${horarioMerienda}, cena ${horarioCena}

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

// ── Constantes beta ───────────────────────────────────────────────────────────

const BETA_PLAN_LIMIT = 10;

// Precios claude-sonnet-4-5 (USD por token)
const COST_PER_INPUT_TOKEN = 0.000003;
const COST_PER_OUTPUT_TOKEN = 0.000015;

function calcCost(inputTokens: number, outputTokens: number): number {
  return Math.round((inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN) * 1_000_000) / 1_000_000;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Leer el body antes de abrir el stream (el Request body solo se puede
  // leer una vez y no es accesible dentro del ReadableStream callback).
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

  const encoder = new TextEncoder();

  // IMPORTANTE: abrimos el stream INMEDIATAMENTE antes de cualquier query a DB.
  // Así el Response llega al cliente de golpe y el primer evento SSE confirma
  // que el stream funciona. Toda la lógica de auth/DB/Claude va dentro del start().
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      // Primer evento inmediato — confirma que el stream SSE está abierto
      // antes de cualquier query a DB o llamada a Claude.
      send({ type: 'progress', day: 0, message: 'Iniciando generación...' });

      // Keepalive: envía un comentario SSE cada 15 s para que el proxy/navegador
      // no cierre la conexión mientras Claude procesa (puede tardar >30 s por día).
      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { /* controller ya cerrado */ }
      }, 15_000);

      const days: PlanDay[] = [];
      let totalTokensInput = 0;
      let totalTokensOutput = 0;
      let planId: string | undefined;

      try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          send({ type: 'error', message: 'No autorizado' });
          controller.close();
          return;
        }
        send({ type: 'progress', step: 'auth_ok' });

        // ── Límite beta ───────────────────────────────────────────────────────
        const { data: whitelistEntry, error: whitelistError } = await (supabaseAdminClient as any)
          .from('beta_whitelist')
          .select('plan_limit')
          .eq('email', user.email)
          .maybeSingle() as { data: { plan_limit: number | null } | null; error: { message: string } | null };

        console.log('[plans/generate] beta check — email:', user.email, '| whitelistEntry:', JSON.stringify(whitelistEntry), '| error:', whitelistError?.message ?? null);

        const effectiveLimit = whitelistEntry?.plan_limit === -1
          ? -1
          : (whitelistEntry?.plan_limit ?? BETA_PLAN_LIMIT);

        console.log('[plans/generate] effectiveLimit:', effectiveLimit);

        if (effectiveLimit !== -1) {
          const { count: planCount } = await (supabaseAdminClient as any)
            .from('nutrition_plans')
            .select('id', { count: 'exact', head: true })
            .eq('nutritionist_id', user.id);

          if ((planCount ?? 0) >= effectiveLimit) {
            send({
              type: 'error',
              message: `Has alcanzado el límite de ${effectiveLimit} planes durante la beta. Escríbenos a hola@dietly.es para ampliar tu acceso.`,
              beta_limit_reached: true,
            });
            controller.close();
            return;
          }
        }
        send({ type: 'progress', step: 'beta_ok' });

        // ── Paciente ──────────────────────────────────────────────────────────
        const { data: patient } = (await (supabase as any)
          .from('patients')
          .select('*')
          .eq('id', patient_id)
          .eq('nutritionist_id', user.id)
          .single()) as { data: Patient | null };

        if (!patient) {
          send({ type: 'error', message: 'Paciente no encontrado' });
          controller.close();
          return;
        }
        send({ type: 'progress', step: 'patient_ok' });

        // ── Intake form ───────────────────────────────────────────────────────
        const { data: intakeFormData } = await (supabaseAdminClient as any)
          .from('intake_forms')
          .select('answers')
          .eq('patient_id', patient_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: { answers: IntakeAnswers } | null };

        const intakeAnswers: IntakeAnswers | undefined = intakeFormData?.answers ?? undefined;
        send({ type: 'progress', step: 'intake_ok' });

        const targets = calcTargets(patient, macro_overrides);

        // ── Crear registro del plan ───────────────────────────────────────────
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
          console.error('[plans/generate] createError:', createError?.message);
          send({ type: 'error', message: `Error creando el plan: ${createError?.message ?? 'unknown'}` });
          controller.close();
          return;
        }

        planId = planRecord.id as string;
        send({ type: 'progress', step: 'plan_created' });

        // Inicializar cliente Anthropic dentro del try para que cualquier error
        // (API key ausente, red, etc.) se capture y llegue al cliente vía SSE
        // en lugar de dejar el plan en estado 'generating' para siempre.
        const anthropic = new Anthropic({
          apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
          // Timeout por llamada: 45 s. Sin esto el SDK espera 600 s por defecto,
          // lo que bloquea el stream cuando Claude tarda o hay error de red.
          timeout: 45_000,
        });

        send({ type: 'start', plan_id: planId });
        send({ type: 'progress', step: 'starting_claude' });

        // Generar los 7 días
        for (let dayNum = 1; dayNum <= 7; dayNum++) {
          send({ type: 'progress', day: dayNum, day_name: DAY_NAMES[dayNum - 1] });

          let dayData: PlanDay | null = null;
          let attempts = 0;

          while (attempts < 2 && !dayData) {
            attempts++;
            if (attempts > 1) send({ type: 'progress', day: dayNum, day_name: DAY_NAMES[dayNum - 1], retry: true });
            try {
              const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                tools: [DAY_TOOL],
                tool_choice: { type: 'tool', name: 'generate_day' },
                messages: [
                  { role: 'user', content: buildDayPrompt(patient, dayNum, targets, days, intakeAnswers) },
                ],
              });

              // Registrar tokens y coste en plan_generations
              const inputTok = response.usage.input_tokens;
              const outputTok = response.usage.output_tokens;
              totalTokensInput += inputTok;
              totalTokensOutput += outputTok;
              void (supabaseAdminClient as any).from('plan_generations').insert({
                plan_id: planId,
                nutritionist_id: user.id,
                day_generated: dayNum,
                tokens_input: inputTok,
                tokens_output: outputTok,
                cost_usd: calcCost(inputTok, outputTok),
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
              console.error(`[plans/generate] day ${dayNum} attempt ${attempts} error:`, err instanceof Error ? err.message : err);
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
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            tools: [SHOPPING_LIST_TOOL],
            tool_choice: { type: 'tool', name: 'generate_shopping_list' },
            messages: [{ role: 'user', content: buildShoppingListPrompt(days) }],
          });

          // Registrar tokens de la lista de la compra como día 8
          const slInput = shoppingResponse.usage.input_tokens;
          const slOutput = shoppingResponse.usage.output_tokens;
          totalTokensInput += slInput;
          totalTokensOutput += slOutput;
          void (supabaseAdminClient as any).from('plan_generations').insert({
            plan_id: planId,
            nutritionist_id: user.id,
            day_generated: 8, // convenio: 8 = lista de la compra
            tokens_input: slInput,
            tokens_output: slOutput,
            cost_usd: calcCost(slInput, slOutput),
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
          .update({
            status: 'draft',
            content,
            claude_tokens_used: totalTokensInput + totalTokensOutput,
          })
          .eq('id', planId);

        send({ type: 'done', plan_id: planId });
      } catch (err) {
        console.error('[plans/generate] error:', err);
        if (planId) {
          await (supabaseAdminClient as any)
            .from('nutrition_plans')
            .update({ status: 'error' })
            .eq('id', planId);
        }
        send({ type: 'error', message: 'Error inesperado. Inténtalo de nuevo.' });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
