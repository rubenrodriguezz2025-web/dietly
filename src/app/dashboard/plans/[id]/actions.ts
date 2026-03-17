'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Patient, PlanContent, PlanDay } from '@/types/dietly';
import { getEnvVar } from '@/utils/get-env-var';
import Anthropic from '@anthropic-ai/sdk';

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

  const { data: plan } = (await (supabase as any)
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

  const { error } = await (supabase as any)
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
  planId: string,
  _prev: { error?: string },
  _formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await (supabase as any)
    .from('nutrition_plans')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', planId)
    .eq('nutritionist_id', user.id);

  if (error) return { error: 'Error al aprobar el plan. Inténtalo de nuevo.' };

  revalidatePath(`/dashboard/plans/${planId}`);
  redirect(`/dashboard/plans/${planId}?approved=1`);
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
  const { data: plan } = (await (supabase as any)
    .from('nutrition_plans')
    .select('*, patients(*)')
    .eq('id', planId)
    .eq('nutritionist_id', user.id)
    .single()) as { data: ({ content: PlanContent; patient_id: string; patients: Patient } & Record<string, unknown>) | null };

  if (!plan) return { error: 'Plan no encontrado.' };

  const patient = plan.patients as Patient;
  const content = plan.content as PlanContent;

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
    patient.dietary_restrictions,
    patient.allergies ? `Alergias: ${patient.allergies}` : null,
    patient.intolerances ? `Intolerancias: ${patient.intolerances}` : null,
  ]
    .filter(Boolean)
    .join('. ');

  const variety =
    otherDays.length > 0
      ? `\nOtros días del plan (evita repetir comidas idénticas):\n${otherDays
          .map((d) => `  ${d.day_name}: ${d.meals.map((m) => m.meal_name).join(', ')}`)
          .join('\n')}`
      : '';

  const prompt = `Eres un dietista-nutricionista experto. Regenera el plan del ${DAY_NAMES[dayNumber - 1]} (día ${dayNumber}/7) porque algunas comidas tenían errores.

PERFIL DEL PACIENTE:
- Objetivo: ${patient.goal ?? 'mejorar salud general'}
- Calorías diarias objetivo: ${targets.calories} kcal
- Macros objetivo: ${targets.protein_g}g proteína · ${targets.carbs_g}g carbohidratos · ${targets.fat_g}g grasa${restrictions ? `\n- Restricciones/alergias: ${restrictions}` : ''}${patient.preferences ? `\n- Preferencias: ${patient.preferences}` : ''}${variety}

REQUISITOS OBLIGATORIOS:
- 4-5 comidas (desayuno, media mañana opcional, almuerzo, merienda, cena)
- Cada comida: mínimo 2 ingredientes con cantidades exactas
- Todas las comidas deben tener calorías > 0 e ingredientes completos

Usa la herramienta generate_day para devolver el plan.`;

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
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      tools: [dayTool],
      tool_choice: { type: 'tool', name: 'generate_day' },
      messages: [{ role: 'user', content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { error: 'No se pudo generar el día. Inténtalo de nuevo.' };
    }

    const newDay = toolUse.input as PlanDay;

    // Replace the day in content.days (or insert if not present)
    const updatedDays = content.days.filter((d) => d.day_number !== dayNumber);
    updatedDays.push(newDay);
    updatedDays.sort((a, b) => a.day_number - b.day_number);

    const updatedContent: PlanContent = { ...content, days: updatedDays };

    const { error: updateError } = await (supabaseAdminClient as any)
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
