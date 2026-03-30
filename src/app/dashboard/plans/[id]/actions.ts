'use server';

import { createElement } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { PlanReadyEmail } from '@/features/emails/plan-ready';
import { logAIRequest } from '@/libs/ai/logger';
import {
  buildShoppingListPrompt,
  buildSystemPrompt,
  computeIngredientsFingerprint,
  SHOPPING_LIST_TOOL,
  SYSTEM_PROMPT_DIETISTA,
} from '@/libs/ai/plan-prompts';
import { pseudonymizePatient } from '@/libs/ai/pseudonymize';
import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Meal, NutritionPlan, Patient, PlanContent, PlanDay, ShoppingList } from '@/types/dietly';
import { getEnvVar } from '@/utils/get-env-var';
import Anthropic from '@anthropic-ai/sdk';
import { render } from '@react-email/components';

// ── Recalculate meal macros ───────────────────────────────────────────────────

export async function recalculateMealMacros(
  planId: string,
  meal: Meal
): Promise<{
  calories?: number;
  macros?: { protein_g: number; carbs_g: number; fat_g: number };
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { data: plan } = await supabase
    .from('nutrition_plans')
    .select('status')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single();

  if (!plan) return { error: 'Plan no encontrado.' };
  if (plan.status !== 'draft') return { error: 'Solo se pueden recalcular macros en planes en borrador.' };

  const ingredientsList = meal.ingredients
    .map((ing) => `- ${ing.name}: ${ing.quantity} ${ing.unit}`)
    .join('\n');

  const calcTool: Anthropic.Tool = {
    name: 'calculate_macros',
    description: 'Calcula los macronutrientes y calorías totales de una comida',
    input_schema: {
      type: 'object',
      properties: {
        calories: { type: 'number' },
        protein_g: { type: 'number' },
        carbs_g: { type: 'number' },
        fat_g: { type: 'number' },
      },
      required: ['calories', 'protein_g', 'carbs_g', 'fat_g'],
    },
  };

  try {
    const anthropic = new Anthropic({
      apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
    });

    const calcPrompt = `Calcula los macronutrientes y calorías totales de esta comida basándote en sus ingredientes:\n\nComida: ${meal.meal_name}\nIngredientes:\n${ingredientsList}\n\nUsa la herramienta calculate_macros para devolver el resultado.`;
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: SYSTEM_PROMPT_DIETISTA,
      tools: [calcTool],
      tool_choice: { type: 'tool', name: 'calculate_macros' },
      messages: [{ role: 'user', content: calcPrompt }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { error: 'No se pudo recalcular. Inténtalo de nuevo.' };
    }

    void logAIRequest({
      nutritionistId: user.id,
      // No hay paciente en esta petición — se genera un UUID de sesión ad-hoc
      sessionPatientId: crypto.randomUUID(),
      planId,
      modelVersion: 'claude-sonnet-4-6',
      requestType: 'recalculate_macros',
      prompt: calcPrompt,
      responseSummary: JSON.stringify(toolUse.input),
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      costUsd: Math.round(
        (response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015) * 1_000_000
      ) / 1_000_000,
    });

    const result = toolUse.input as { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    return {
      calories: Math.round(result.calories),
      macros: {
        protein_g: Math.round(result.protein_g),
        carbs_g: Math.round(result.carbs_g),
        fat_g: Math.round(result.fat_g),
      },
    };
  } catch {
    return { error: 'Error llamando a la IA. Inténtalo de nuevo.' };
  }
}

// ── Update day (inline editing) ───────────────────────────────────────────────

export async function updateDay(
  planId: string,
  dayNumber: number,
  updatedDay: PlanDay
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: plan } = (await supabase
    .from('nutrition_plans')
    .select('content')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single()) as { data: { content: PlanContent } | null };

  if (!plan) return { error: 'Plan no encontrado.' };

  const content = plan.content as PlanContent;
  const updatedDays = content.days.map((d) =>
    d.day_number === dayNumber ? updatedDay : d
  );

  const { error } = await supabase
    .from('nutrition_plans')
    .update({ content: { ...content, days: updatedDays } })
    .eq('id', planId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error guardando los cambios. Inténtalo de nuevo.' };

  revalidatePath(`/dashboard/plans/${planId}`);
  return {};
}

// ── Approve ───────────────────────────────────────────────────────────────────

export async function approvePlan(
  planId: string
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  console.log('[approvePlan] Usuario:', user.id, 'Plan:', planId);

  const { error, count } = await supabase
    .from('nutrition_plans')
    .update(
      { status: 'approved', approved_at: new Date().toISOString() },
      { count: 'exact' }
    )
    .eq('id', planId)
    .eq('nutritionist_id', user.id);

  if (error) {
    console.error('[approvePlan] Supabase error:', JSON.stringify(error));
    return { error: 'Error al aprobar el plan. Inténtalo de nuevo.' };
  }

  console.log('[approvePlan] Filas actualizadas:', count);
  if (count === 0) {
    return { error: 'No se encontró el plan o no tienes permiso para aprobarlo.' };
  }

  revalidatePath(`/dashboard/plans/${planId}`);

  // ── Notificación automática al paciente ──────────────────────────────────
  // No bloquea el flujo de aprobación si falla
  try {
    const [planResult, profileResult] = await Promise.all([
      supabaseAdminClient
        .from('nutrition_plans')
        .select('patient_token, patients(email, name)')
        .eq('id', planId)
        .single(),
      supabaseAdminClient
        .from('profiles')
        .select('full_name, clinic_name')
        .eq('id', user.id)
        .single(),
    ]);

    const patientEmail = (planResult.data?.patients as { email: string | null; name: string } | null)?.email;
    const patientName  = (planResult.data?.patients as { email: string | null; name: string } | null)?.name ?? '';
    const patientToken = planResult.data?.patient_token as string | null;

    if (patientEmail && patientToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const planUrl = `${appUrl}/p/${patientToken}`;
      const nutritionistName = profileResult.data?.full_name ?? 'Tu nutricionista';
      const clinicName = profileResult.data?.clinic_name ?? null;

      const emailElement = createElement(PlanReadyEmail, {
        patientName,
        nutritionistName,
        clinicName,
        planUrl,
      });

      const [html, text] = await Promise.all([
        render(emailElement),
        render(emailElement, { plainText: true }),
      ]);

      const sendResult = await resendClient.emails.send({
        from: 'Dietly <hola@dietly.es>',
        replyTo: 'hola@dietly.es',
        to: patientEmail,
        subject: `Tu plan nutricional personalizado está listo – ${clinicName ?? nutritionistName}`,
        html,
        text,
      });

      if (!sendResult.error) {
        await supabaseAdminClient
          .from('nutrition_plans')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', planId);
      }
    }
  } catch (err) {
    console.error('[approvePlan] Error en notificación automática:', err);
  }

  return { ok: true };
}

// ── Send plan to patient ──────────────────────────────────────────────────────

export async function sendPlanToPatient(
  planId: string,
  _prev: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const personalMessage = (formData.get('personal_message') as string | null)?.trim() || null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: plan } = (await supabase
    .from('nutrition_plans')
    .select('*, patients(*)')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single()) as { data: (NutritionPlan & { patients: Patient | null }) | null };

  if (!plan) return { error: 'Plan no encontrado.' };
  if (plan.status !== 'approved' && plan.status !== 'sent')
    return { error: 'Solo se pueden enviar planes aprobados.' };
  if (!plan.patients?.email) return { error: 'El paciente no tiene email registrado. Añádelo en su ficha.' };

  const { data: profile } = (await supabase
    .from('profiles')
    .select('full_name, clinic_name')
    .eq('id', user.id)
    .single()) as { data: { full_name: string; clinic_name: string | null } | null };

  const nombreDN = profile?.full_name ?? 'Tu nutricionista';
  const clinica = profile?.clinic_name ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const planUrl = `${appUrl}/p/${plan.patient_token}`;
  const semana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  try {
    await resendClient.emails.send({
      from: `${nombreDN} <noreply@dietly.es>`,
      to: plan.patients.email,
      subject: `Tu plan nutricional está listo · ${nombreDN}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
          <div style="margin-bottom:20px">
            <span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.05em">
              PLAN NUTRICIONAL LISTO
            </span>
          </div>
          <h2 style="margin:0 0 10px;font-size:22px;color:#18181b">
            Tu plan nutricional está listo
          </h2>
          <p style="margin:0 0 ${personalMessage ? '16px' : '28px'};color:#52525b;font-size:15px;line-height:1.6">
            <strong>${nombreDN}</strong> ha preparado tu plan nutricional personalizado para la semana del ${semana}.
            Puedes consultarlo en cualquier momento desde el enlace de abajo.
          </p>
          ${personalMessage ? `
          <div style="margin-bottom:28px;border-left:3px solid #1a7a45;padding:12px 16px;background:#f0fdf4;border-radius:0 8px 8px 0">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#1a7a45;text-transform:uppercase;letter-spacing:0.05em">Mensaje de tu nutricionista</p>
            <p style="margin:0;font-size:14px;color:#18181b;line-height:1.6;white-space:pre-wrap">${personalMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          ` : ''}
          <div style="margin-bottom:28px">
            <a
              href="${planUrl}"
              style="display:inline-block;background:#1a7a45;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px"
            >
              Ver mi plan nutricional →
            </a>
          </div>
          <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-bottom:28px">
            <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em">Semana del plan</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#18181b">${semana}</p>
          </div>
          <p style="margin:0;font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:16px">
            Si el botón no funciona, copia esta URL en tu navegador:<br/>
            <a href="${planUrl}" style="color:#1a7a45;word-break:break-all">${planUrl}</a>
          </p>
          <p style="margin-top:16px;font-size:11px;color:#d4d4d8">
            Email enviado por ${nombreDN}${clinica ? ` · ${clinica}` : ''}.
            Los valores nutricionales son estimaciones orientativas. Ante cualquier duda, consulta con tu nutricionista.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[sendPlanToPatient] email error:', err);
    return { error: 'Error al enviar el email. Inténtalo de nuevo.' };
  }

  await supabase
    .from('nutrition_plans')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('nutritionist_id', user.id);

  revalidatePath(`/dashboard/plans/${planId}`);
  return { ok: true };
}

// ── Acknowledge validation block ─────────────────────────────────────────────

export async function acknowledgeValidationBlock(
  planId: string,
  blockCode: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Añadir el código al array usando el operador de array de Postgres
  const { error } = await supabase.rpc('append_validation_ack', {
    p_plan_id: planId,
    p_nutritionist_id: user.id,
    p_block_code: blockCode,
  });

  if (error) {
    // Fallback manual si la función RPC no existe aún
    const { data: plan } = await supabase
      .from('nutrition_plans')
      .select('validation_acked_blocks')
      .eq('id', planId)
      .eq('nutritionist_id', user.id)
      .single();

    if (!plan) return { error: 'Plan no encontrado.' };

    const current: string[] = plan.validation_acked_blocks ?? [];
    if (current.includes(blockCode)) return {};

    const { error: updateError } = await supabase
      .from('nutrition_plans')
      .update({ validation_acked_blocks: [...current, blockCode] })
      .eq('id', planId)
      .eq('nutritionist_id', user.id);

    if (updateError) return { error: 'Error al registrar la revisión.' };
  }

  revalidatePath(`/dashboard/plans/${planId}`);
  return {};
}

// ── Approve single day ────────────────────────────────────────────────────────

export async function approveSingleDay(
  planId: string,
  dayNumber: number
): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { data: plan } = (await supabase
    .from('nutrition_plans')
    .select('content, status')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single()) as { data: { content: PlanContent; status: string } | null };

  if (!plan) return { error: 'Plan no encontrado.' };
  if (plan.status !== 'draft') return { error: 'Solo se pueden revisar días en planes en borrador.' };

  const content = plan.content as PlanContent;
  const now = new Date().toISOString();

  const updatedDays = content.days.map((d) =>
    d.day_number === dayNumber
      ? { ...d, day_status: 'approved' as const, approved_at: now }
      : d
  );

  const allApproved = updatedDays.every((d) => d.day_status === 'approved');
  const updatedContent: PlanContent = { ...content, days: updatedDays };

  const updatePayload: Record<string, unknown> = { content: updatedContent };
  if (allApproved) {
    updatePayload.status = 'approved';
    updatePayload.approved_at = now;
  }

  const { error } = await supabase
    .from('nutrition_plans')
    .update(updatePayload)
    .eq('id', planId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error al guardar la revisión.' };

  revalidatePath(`/dashboard/plans/${planId}`);
  return { ok: true };
}

// ── Regenerate day ────────────────────────────────────────────────────────────

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export async function regenerateDay(
  planId: string,
  dayNumber: number,
  _prev: { error?: string },
  _formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch plan + patient
  const { data: plan } = (await supabase
    .from('nutrition_plans')
    .select('*, patients(*)')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single()) as { data: ({ content: PlanContent; patient_id: string; patients: Patient } & Record<string, unknown>) | null };

  if (!plan) return { error: 'Plan no encontrado.' };

  const patient = plan.patients as Patient;
  const content = plan.content as PlanContent;

  // Cargar specialty del nutricionista para system prompt
  const { data: profileData } = await supabase
    .from('profiles')
    .select('specialty')
    .eq('id', user.id)
    .single();
  const systemPrompt = buildSystemPrompt(profileData?.specialty as string | null);

  // Pseudonimizar antes de construir el prompt
  const { pseudoPatient, sessionId } = pseudonymizePatient(patient);

  // Build target calories from existing week_summary
  const targets = content.week_summary.target_macros
    ? {
        calories: content.week_summary.target_daily_calories,
        protein_g: content.week_summary.target_macros.protein_g,
        carbs_g: content.week_summary.target_macros.carbs_g,
        fat_g: content.week_summary.target_macros.fat_g,
      }
    : { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

  // Other days for variety context (exclude the one being regenerated)
  const otherDays = content.days.filter((d) => d.day_number !== dayNumber);

  const restrictions = [
    pseudoPatient.dietary_restrictions,
    pseudoPatient.allergies ? `Alergias: ${pseudoPatient.allergies}` : null,
    pseudoPatient.intolerances ? `Intolerancias: ${pseudoPatient.intolerances}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  const variety =
    otherDays.length > 0
      ? `\nOtros días del plan (evita repetir comidas idénticas):\n${otherDays
          .map((d) => `  ${d.day_name}: ${d.meals.map((m) => m.meal_name).join(', ')}`)
          .join('\n')}`
      : '';

  const prompt = `Regenera el plan del ${DAY_NAMES[dayNumber - 1]} (día ${dayNumber}/7) porque algunas comidas tenían errores.

PERFIL DEL PACIENTE:
- Objetivo: ${pseudoPatient.goal ?? 'mejorar salud general'}
- Calorías diarias objetivo: ${targets.calories} kcal
- Macros objetivo: ${targets.protein_g}g proteína · ${targets.carbs_g}g carbohidratos · ${targets.fat_g}g grasa${restrictions ? `\n- Restricciones/alergias: ${restrictions}` : ''}${pseudoPatient.preferences ? `\n- Preferencias: ${pseudoPatient.preferences}` : ''}${variety}

Todas las comidas deben tener calorías > 0 e ingredientes completos.`;

  const dayTool: Anthropic.Tool = {
    name: 'generate_day',
    description: 'Genera el plan nutricional completo para un día específico',
    input_schema: {
      type: 'object',
      properties: {
        day_number: { type: 'number' },
        day_name: { type: 'string' },
        total_calories: { type: 'number' },
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
          items: {
            type: 'object',
            properties: {
              meal_type: { type: 'string' },
              meal_name: { type: 'string' },
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
            required: [
              'meal_type', 'meal_name', 'time_suggestion', 'calories',
              'macros', 'ingredients', 'preparation', 'notes',
            ],
          },
        },
      },
      required: ['day_number', 'day_name', 'total_calories', 'total_macros', 'meals'],
    },
  };

  try {
    const anthropic = new Anthropic({
      apiKey: getEnvVar(process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [dayTool],
      tool_choice: { type: 'tool', name: 'generate_day' },
      messages: [{ role: 'user', content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { error: 'No se pudo generar el día. Inténtalo de nuevo.' };
    }

    void logAIRequest({
      nutritionistId: user.id,
      sessionPatientId: sessionId,
      planId,
      modelVersion: 'claude-sonnet-4-6',
      requestType: 'regenerate_day',
      dayNumber,
      prompt,
      responseSummary: JSON.stringify(toolUse.input),
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      costUsd: Math.round(
        (response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015) * 1_000_000
      ) / 1_000_000,
    });

    const newDay = toolUse.input as PlanDay;

    // Huella de ingredientes antes y después del cambio (Optimización C)
    const fingerprintBefore = computeIngredientsFingerprint(content.days);
    const updatedDays = content.days.filter((d) => d.day_number !== dayNumber);
    updatedDays.push(newDay);
    updatedDays.sort((a, b) => a.day_number - b.day_number);
    const fingerprintAfter = computeIngredientsFingerprint(updatedDays);

    // Regenerar lista de la compra solo si los ingredientes cambiaron
    let newShoppingList: ShoppingList | null = null;
    if (fingerprintBefore !== fingerprintAfter) {
      try {
        const shoppingPrompt = buildShoppingListPrompt(updatedDays);
        const shoppingResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: systemPrompt,
          tools: [SHOPPING_LIST_TOOL],
          tool_choice: { type: 'tool', name: 'generate_shopping_list' },
          messages: [{ role: 'user', content: shoppingPrompt }],
        });
        const slToolUse = shoppingResponse.content.find((b) => b.type === 'tool_use');
        if (slToolUse?.type === 'tool_use') {
          newShoppingList = slToolUse.input as ShoppingList;
          void logAIRequest({
            nutritionistId: user.id,
            sessionPatientId: sessionId,
            planId,
            modelVersion: 'claude-sonnet-4-6',
            requestType: 'shopping_list',
            prompt: shoppingPrompt,
            responseSummary: JSON.stringify(slToolUse.input),
            tokensInput: shoppingResponse.usage.input_tokens,
            tokensOutput: shoppingResponse.usage.output_tokens,
            costUsd:
              Math.round(
                (shoppingResponse.usage.input_tokens * 0.000003 +
                  shoppingResponse.usage.output_tokens * 0.000015) *
                  1_000_000
              ) / 1_000_000,
          });
        }
      } catch (err) {
        // No bloqueante: si falla la lista, guardamos el día igualmente
        console.warn('[regenerateDay] shopping list regeneration failed (non-blocking):', err instanceof Error ? err.message : err);
      }
    }

    const updatedContent: PlanContent = {
      ...content,
      days: updatedDays,
      ...(newShoppingList ? { shopping_list: newShoppingList } : {}),
    };

    const { error: updateError } = await supabaseAdminClient
      .from('nutrition_plans')
      .update({ content: updatedContent })
      .eq('id', planId);

    if (updateError) return { error: 'Error guardando el día regenerado.' };

    revalidatePath(`/dashboard/plans/${planId}`);
    return {};
  } catch {
    return { error: 'Error llamando a la IA. Inténtalo de nuevo.' };
  }
}
