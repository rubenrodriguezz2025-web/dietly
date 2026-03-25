import type { NextRequest } from 'next/server';

import { logAIRequest } from '@/libs/ai/logger';
import {
  buildShoppingListPrompt,
  buildSystemPrompt,
  filterRecipesForPatient,
  SHOPPING_LIST_TOOL,
} from '@/libs/ai/plan-prompts';
import { type PseudonymizedPatient,pseudonymizePatient } from '@/libs/ai/pseudonymize';
import {
  AnthropicResilienceError,
  callAnthropicWithResilience,
  checkAndAlertErrorRate,
} from '@/libs/ai/resilience';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Patient, PlanContent, PlanDay, Recipe, ShoppingList } from '@/types/dietly';
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

// SHOPPING_LIST_TOOL importado desde @/libs/ai/plan-prompts

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

function buildRecipesSection(recipes: Recipe[]): string {
  if (recipes.length === 0) return '';
  const lines = recipes
    .filter((r) => r.name && r.ingredients && (r.ingredients as { name: string }[]).length > 0)
    .slice(0, 20)
    .map((r) => {
      const ings = (r.ingredients as { name: string; quantity: number; unit: string }[])
        .map((i) => `${i.name} ${i.quantity}${i.unit}`)
        .join(', ');
      const macros = r.calories_per_serving
        ? ` | ${r.calories_per_serving}kcal, ${r.protein_g_per_serving}g P, ${r.carbs_g_per_serving}g C, ${r.fat_g_per_serving}g G por ración`
        : '';
      const cat = r.category ? ` [${r.category}]` : '';
      return `  - "${r.name}"${cat}${macros} · Ingredientes: ${ings}`;
    });

  if (lines.length === 0) return '';

  return `\nRECETAS PERSONALES DEL NUTRICIONISTA (puedes usarlas si encajan nutricionalmente):
${lines.join('\n')}
Si usas una receta personal, indícalo en el nombre del plato añadiendo ★ al inicio.`;
}

function buildDayPrompt(
  patient: PseudonymizedPatient,
  dayNum: number,
  targets: ReturnType<typeof calcTargets>,
  previousDays: PlanDay[],
  intakeAnswers?: IntakeAnswers,
  nutritionistRecipes?: Recipe[]
): string {
  const restrictions = [
    patient.dietary_restrictions?.length ? patient.dietary_restrictions.join(', ') : null,
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
  const recipesSection = nutritionistRecipes ? buildRecipesSection(nutritionistRecipes) : '';

  const carbsPctDisplay = Math.round(targets.carbs_pct * 100);
  const fatPctDisplay = Math.round(targets.fat_pct * 100);

  // Horarios por defecto desde el intake (si existen)
  const horarioDesayuno = intakeAnswers?.hora_desayuno ?? '08:00';
  const horarioAlmuerzo = intakeAnswers?.hora_almuerzo ?? '14:00';
  const horarioCena = intakeAnswers?.hora_cena ?? '21:00';
  const horarioMerienda = intakeAnswers?.hora_merienda ?? '17:00';

  return `Genera el plan nutricional del ${DAY_NAMES[dayNum - 1]} (día ${dayNum}/7).

PERFIL DEL PACIENTE:
- Objetivo: ${patient.goal ? (GOAL_LABELS[patient.goal] ?? patient.goal) : 'mejorar salud general'}
- Calorías diarias objetivo: ${targets.calories} kcal
- Proteína objetivo: ${targets.protein_g}g (${targets.protein_per_kg}g/kg peso corporal)
- Carbohidratos: ${targets.carbs_g}g (${carbsPctDisplay}% de calorías restantes tras proteína)
- Grasa: ${targets.fat_g}g (${fatPctDisplay}% de calorías restantes tras proteína)${restrictions ? `\n- Restricciones/alergias: ${restrictions}` : ''}${patient.preferences ? `\n- Preferencias: ${patient.preferences}` : ''}${patient.medical_notes ? `\n- Notas médicas: ${patient.medical_notes}` : ''}${intakeSection}${recipesSection}${variety}

Respeta los horarios habituales del paciente como time_suggestion: desayuno ${horarioDesayuno}, almuerzo ${horarioAlmuerzo}, merienda ${horarioMerienda}, cena ${horarioCena}.`;
}

// buildShoppingListPrompt importado desde @/libs/ai/plan-prompts

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
        // El email en beta_whitelist se almacenó en minúsculas (ver auth-actions.ts)
        const normalizedEmail = (user.email ?? '').toLowerCase().trim();
        const { data: whitelistEntry } = await supabaseAdminClient
          .from('beta_whitelist')
          .select('plan_limit')
          .eq('email', normalizedEmail)
          .maybeSingle();

        // plan_limit=-1 → sin límite | null → usar default | N → límite personalizado
        const effectiveLimit: number = whitelistEntry?.plan_limit === -1
          ? -1
          : (whitelistEntry?.plan_limit ?? BETA_PLAN_LIMIT);

        if (effectiveLimit !== -1) {
          const { count: planCount } = await supabaseAdminClient
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
        const { data: patient } = (await supabase
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

        // Bloquear menores de 18 años
        if (patient.date_of_birth) {
          const birth = new Date(patient.date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
          if (age < 18) {
            send({
              type: 'error',
              message:
                'Este paciente es menor de edad. Para generar planes nutricionales para menores se requiere consentimiento parental por escrito. Contacta con hola@dietly.es para más información.',
            });
            controller.close();
            return;
          }
        }

        send({ type: 'progress', step: 'patient_ok' });

        // Pseudonimizar el paciente ANTES de que sus datos salgan del servidor.
        // A partir de aquí, todos los prompts y logs usan pseudoPatient + sessionId.
        const { pseudoPatient, sessionId } = pseudonymizePatient(patient);

        // ── Perfil del nutricionista (specialty para system prompt) ──────────
        const { data: profileData } = await supabase
          .from('profiles')
          .select('specialty')
          .eq('id', user.id)
          .single();
        const systemPrompt = buildSystemPrompt(profileData?.specialty as string | null);

        // ── Intake form ───────────────────────────────────────────────────────
        const { data: intakeFormData } = await supabaseAdminClient
          .from('intake_forms')
          .select('answers')
          .eq('patient_id', patient_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: { answers: IntakeAnswers } | null };

        const intakeAnswers: IntakeAnswers | undefined = intakeFormData?.answers ?? undefined;
        send({ type: 'progress', step: 'intake_ok' });

        // ── Recetas personales del nutricionista ──────────────────────────────
        // Cargamos hasta 20 recetas para inyectar contexto en el prompt.
        // No bloqueamos la generación si falla (fire-and-continue).
        let nutritionistRecipes: Recipe[] = [];
        try {
          const { data: recipesData } = await supabaseAdminClient
            .from('recipes')
            .select('*')
            .eq('nutritionist_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
          if (recipesData) nutritionistRecipes = recipesData as Recipe[];
        } catch {
          console.warn('[plans/generate] No se pudieron cargar recetas del nutricionista (no bloqueante)');
        }

        const targetsResult = (() => {
          try { return calcTargets(patient, macro_overrides); }
          catch (err) { return err instanceof Error ? err.message : 'Error al calcular los objetivos nutricionales.'; }
        })();
        if (typeof targetsResult === 'string') {
          send({ type: 'error', message: targetsResult });
          controller.close();
          return;
        }
        const targets = targetsResult;

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

        const { data: planRecord, error: createError } = await supabaseAdminClient
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
          console.log(`[plans/generate] plan=${planId} — iniciando día ${dayNum}`);

          let dayData: PlanDay | null = null;

          // Primera llamada (con resiliencia completa: retry, 429, 529, circuit breaker)
          const dayPrompt = buildDayPrompt(pseudoPatient, dayNum, targets, days, intakeAnswers, filterRecipesForPatient(nutritionistRecipes, pseudoPatient));
          try {
            const response = await callAnthropicWithResilience(
              () => anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                system: systemPrompt,
                tools: [DAY_TOOL],
                tool_choice: { type: 'tool', name: 'generate_day' },
                messages: [{ role: 'user', content: dayPrompt }],
              }),
              `day_${dayNum}`,
            );

            const inputTok = response.usage.input_tokens;
            const outputTok = response.usage.output_tokens;
            totalTokensInput += inputTok;
            totalTokensOutput += outputTok;
            console.log(`[plans/generate] plan=${planId} día=${dayNum} — Claude OK (in=${inputTok} out=${outputTok} stop=${response.stop_reason})`);

            void supabaseAdminClient.from('plan_generations').insert({
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
              console.log(`[plans/generate] plan=${planId} día=${dayNum} — meals=${candidate.meals?.length ?? 0} invalidMeals=${invalidMeals.length}`);

              // Si pasa validación, lo aceptamos directamente
              if (invalidMeals.length === 0) {
                dayData = candidate;
              } else {
                // Reintento de validación (sin consumir presupuesto de resilience)
                send({ type: 'progress', day: dayNum, day_name: DAY_NAMES[dayNum - 1], retry: true });
                console.warn(`[plans/generate] plan=${planId} día=${dayNum} — validación fallida (${invalidMeals.length} comidas inválidas), reintentando`);
                const retryResponse = await callAnthropicWithResilience(
                  () => anthropic.messages.create({
                    model: 'claude-sonnet-4-6',
                    max_tokens: 4096,
                    system: systemPrompt,
                    tools: [DAY_TOOL],
                    tool_choice: { type: 'tool', name: 'generate_day' },
                    messages: [{ role: 'user', content: dayPrompt }],
                  }),
                  `day_${dayNum}_retry`,
                );
                const retryToolUse = retryResponse.content.find((b) => b.type === 'tool_use');
                // Aceptar el reintento aunque falle la validación (mejor que nada)
                if (retryToolUse?.type === 'tool_use') {
                  dayData = retryToolUse.input as PlanDay;
                } else {
                  dayData = candidate; // fallback al primer intento
                }
              }

              if (dayData) {
                void logAIRequest({
                  nutritionistId: user.id,
                  sessionPatientId: sessionId,
                  planId: planId!,
                  modelVersion: 'claude-sonnet-4-6',
                  requestType: 'generate_day',
                  dayNumber: dayNum,
                  prompt: dayPrompt,
                  responseSummary: JSON.stringify(dayData),
                  tokensInput: inputTok,
                  tokensOutput: outputTok,
                  costUsd: calcCost(inputTok, outputTok),
                });
              }
            } else {
              console.warn(`[plans/generate] plan=${planId} día=${dayNum} — sin tool_use en respuesta. stop_reason=${response.stop_reason}`);
            }
          } catch (err) {
            // Determinar si el error viene del circuit breaker o es recuperable
            const isServiceUnavailable =
              err instanceof AnthropicResilienceError && err.code === 'service_unavailable';

            await supabaseAdminClient
              .from('nutrition_plans')
              .update({ status: 'error' })
              .eq('id', planId);

            // Notificar tasa de error (fire-and-forget)
            void checkAndAlertErrorRate();

            if (isServiceUnavailable) {
              send({
                type:       'error',
                message:    'El servicio de generación está temporalmente no disponible. Inténtelo en unos minutos.',
                error_code: 'service_unavailable',
              });
            } else {
              send({
                type:       'error',
                message:    `Error generando el día ${dayNum}. Inténtalo de nuevo.`,
                error_code: err instanceof AnthropicResilienceError ? err.code : 'unknown',
              });
            }
            controller.close();
            return;
          }

          if (!dayData) {
            await supabaseAdminClient
              .from('nutrition_plans')
              .update({ status: 'error' })
              .eq('id', planId);
            void checkAndAlertErrorRate();
            send({ type: 'error', message: `Error generando el día ${dayNum}. Inténtalo de nuevo.`, error_code: 'unknown' });
            controller.close();
            return;
          }

          days.push(dayData);
          console.log(`[plans/generate] plan=${planId} — día ${dayNum} guardado en memoria (total días: ${days.length})`);
        }

        // Generar lista de la compra
        send({ type: 'progress', day: 8, day_name: 'Lista de la compra' });
        console.log(`[plans/generate] plan=${planId} — generando lista de la compra`);
        let shoppingList: ShoppingList = { produce: [], protein: [], dairy: [], grains: [], pantry: [] };
        try {
          const shoppingPrompt = buildShoppingListPrompt(days);
          const shoppingResponse = await callAnthropicWithResilience(
            () => anthropic.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 2048,
              system: systemPrompt,
              tools: [SHOPPING_LIST_TOOL],
              tool_choice: { type: 'tool', name: 'generate_shopping_list' },
              messages: [{ role: 'user', content: shoppingPrompt }],
            }),
            'shopping_list',
          );

          const slInput = shoppingResponse.usage.input_tokens;
          const slOutput = shoppingResponse.usage.output_tokens;
          totalTokensInput += slInput;
          totalTokensOutput += slOutput;
          console.log(`[plans/generate] plan=${planId} — shopping list OK (in=${slInput} out=${slOutput})`);

          void supabaseAdminClient.from('plan_generations').insert({
            plan_id: planId,
            nutritionist_id: user.id,
            day_generated: 8,
            tokens_input: slInput,
            tokens_output: slOutput,
            cost_usd: calcCost(slInput, slOutput),
          });

          const shoppingToolUse = shoppingResponse.content.find((b) => b.type === 'tool_use');
          if (shoppingToolUse?.type === 'tool_use') {
            shoppingList = shoppingToolUse.input as ShoppingList;
            void logAIRequest({
              nutritionistId: user.id,
              sessionPatientId: sessionId,
              planId: planId!,
              modelVersion: 'claude-sonnet-4-6',
              requestType: 'shopping_list',
              prompt: shoppingPrompt,
              responseSummary: JSON.stringify(shoppingToolUse.input),
              tokensInput: slInput,
              tokensOutput: slOutput,
              costUsd: calcCost(slInput, slOutput),
            });
          }
        } catch (err) {
          console.error(`[plans/generate] plan=${planId} — shopping list error:`, err instanceof Error ? err.message : err);
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

        console.log(`[plans/generate] plan=${planId} — guardando plan en Supabase (días=${days.length})`);
        const { error: finalUpdateError } = await supabaseAdminClient
          .from('nutrition_plans')
          .update({
            status: 'draft',
            content,
            claude_tokens_used: totalTokensInput + totalTokensOutput,
          })
          .eq('id', planId);

        if (finalUpdateError) {
          console.error(`[plans/generate] plan=${planId} — ERROR en UPDATE final:`, finalUpdateError.message, finalUpdateError);
          send({ type: 'error', message: `Error guardando el plan: ${finalUpdateError.message}` });
          controller.close();
          return;
        }

        console.log(`[plans/generate] plan=${planId} — UPDATE final OK → enviando done`);
        send({ type: 'done', plan_id: planId });
      } catch (err) {
        console.error('[plans/generate] error:', err);
        if (planId) {
          await supabaseAdminClient
            .from('nutrition_plans')
            .update({ status: 'error' })
            .eq('id', planId);
          void checkAndAlertErrorRate();
        }
        const isServiceUnavailable =
          err instanceof AnthropicResilienceError && err.code === 'service_unavailable';
        send({
          type:       'error',
          message:    isServiceUnavailable
            ? 'El servicio de generación está temporalmente no disponible. Inténtelo en unos minutos.'
            : 'Error inesperado. Inténtalo de nuevo.',
          error_code: err instanceof AnthropicResilienceError ? err.code : 'unknown',
        });
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
