import React from 'react';

import type { FontPreference } from '@/components/pdf/NutritionPlanPDF';
import { NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { renderToBuffer } from '@react-pdf/renderer';

// ── Datos ficticios hardcodeados — sin llamar a Claude API ────────────────────

const PREVIEW_PATIENT = {
  name: 'María García',
  email: 'maria@ejemplo.com',
};

const PREVIEW_PLAN = {
  week_start_date: new Date().toISOString(),
};

const PREVIEW_CONTENT = {
  week_summary: {
    target_daily_calories: 1800,
    target_macros: { protein_g: 120, carbs_g: 200, fat_g: 60 },
    weekly_averages: { calories: 1800, protein_g: 120, carbs_g: 200, fat_g: 60 },
    goal: 'weight_loss',
  },
  days: [
    {
      day_number: 1,
      day_name: 'Lunes',
      total_calories: 1800,
      total_macros: { protein_g: 108, carbs_g: 128, fat_g: 58 },
      meals: [
        {
          meal_type: 'desayuno',
          meal_name: 'Tostadas con aguacate y huevo',
          time_suggestion: '08:00',
          calories: 420,
          macros: { protein_g: 22, carbs_g: 38, fat_g: 18 },
          ingredients: [
            { name: 'Pan integral', quantity: 60, unit: 'g' },
            { name: 'Aguacate', quantity: 80, unit: 'g' },
            { name: 'Huevo', quantity: 2, unit: 'unidades' },
          ],
          preparation:
            'Tostar el pan, aplastar el aguacate con sal y limón, colocar los huevos pochados encima.',
          notes: '',
        },
        {
          meal_type: 'almuerzo',
          meal_name: 'Pollo con arroz integral y verduras',
          time_suggestion: '14:00',
          calories: 620,
          macros: { protein_g: 48, carbs_g: 62, fat_g: 18 },
          ingredients: [
            { name: 'Pechuga de pollo', quantity: 200, unit: 'g' },
            { name: 'Arroz integral', quantity: 80, unit: 'g' },
            { name: 'Brócoli', quantity: 150, unit: 'g' },
          ],
          preparation:
            'Cocinar el arroz, saltear el pollo con las verduras al wok con aceite de oliva.',
          notes: '',
        },
        {
          meal_type: 'cena',
          meal_name: 'Salmón al horno con ensalada',
          time_suggestion: '21:00',
          calories: 480,
          macros: { protein_g: 38, carbs_g: 28, fat_g: 22 },
          ingredients: [
            { name: 'Salmón', quantity: 150, unit: 'g' },
            { name: 'Espinacas', quantity: 100, unit: 'g' },
            { name: 'Tomate cherry', quantity: 80, unit: 'g' },
          ],
          preparation:
            'Hornear el salmón a 180 °C durante 15 minutos. Preparar la ensalada con espinacas y tomates aliñada con aceite y limón.',
          notes: '',
        },
      ],
    },
  ],
  shopping_list: {
    protein: ['Pechuga de pollo 200g', 'Salmón 150g', 'Huevos x2'],
    produce: ['Aguacate 80g', 'Brócoli 150g', 'Espinacas 100g', 'Tomate cherry 80g'],
    grains: ['Pan integral 60g', 'Arroz integral 80g'],
    pantry: ['Aceite de oliva', 'Limón'],
  },
};

// ── Helper: descarga imagen de Storage como data URI base64 ───────────────────

async function downloadAsDataUri(
  supabase: Awaited<ReturnType<typeof import('@/libs/supabase/supabase-server-client').createSupabaseServerClient>>,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { data: blob } = await supabase.storage.from(bucket).download(path);
    if (!blob) return null;
    const buf = await blob.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    return `data:${(blob as Blob).type || 'image/png'};base64,${b64}`;
  } catch {
    return null;
  }
}

// ── Handler compartido ────────────────────────────────────────────────────────

async function handlePreview() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select(
      'full_name, clinic_name, logo_url, signature_url, college_number, primary_color, show_macros, show_shopping_list, welcome_message, font_preference, profile_photo_url'
    )
    .eq('id', user.id)
    .single();

  // Determinar si tiene suscripción Pro (para logo/firma)
  const { data: subscription } = await (supabase as any)
    .from('subscriptions')
    .select('status, prices(products(name))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  const productName: string = (subscription as any)?.prices?.products?.name ?? '';
  const is_pro =
    subscription != null &&
    (productName.toLowerCase().includes('pro') ||
      productName.toLowerCase().includes('profesional') ||
      productName === '');

  let logo_uri: string | null = null;
  let signature_uri: string | null = null;
  let profile_photo_uri: string | null = null;

  if (is_pro && profileData?.logo_url) {
    logo_uri = await downloadAsDataUri(supabase, 'nutritionist-logos', profileData.logo_url as string);
  }
  if (is_pro && profileData?.signature_url) {
    signature_uri = await downloadAsDataUri(supabase, 'nutritionist-signatures', profileData.signature_url as string);
  }
  if (profileData?.profile_photo_url) {
    profile_photo_uri = await downloadAsDataUri(supabase, 'nutritionist-photos', profileData.profile_photo_url as string);
  }

  const profile = {
    full_name: (profileData?.full_name as string) || 'Nutricionista Demo',
    clinic_name: (profileData?.clinic_name as string | null) ?? null,
    college_number: (profileData?.college_number as string | null) ?? null,
    primary_color: (profileData?.primary_color as string | null) ?? '#1a7a45',
    show_macros: (profileData?.show_macros as boolean | null) ?? true,
    show_shopping_list: (profileData?.show_shopping_list as boolean | null) ?? true,
    welcome_message: (profileData?.welcome_message as string | null) ?? null,
    font_preference: ((profileData?.font_preference as string | null) ?? 'clasica') as FontPreference,
    profile_photo_url: (profileData?.profile_photo_url as string | null) ?? null,
  };

  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: PREVIEW_PLAN,
      content: PREVIEW_CONTENT,
      patient: PREVIEW_PATIENT,
      profile,
      logo_uri,
      signature_uri,
      profile_photo_uri,
      is_pro,
      approved_at: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    });

    const buffer = await renderToBuffer(elemento as React.ReactElement);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview-mi-marca.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[pdf/preview] Error generando PDF:', err);
    return Response.json(
      { error: 'Error al generar el PDF. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}

export const GET = handlePreview;
export const POST = handlePreview;
