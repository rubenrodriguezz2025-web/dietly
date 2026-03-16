import React from 'react';

import type { FontPreference } from '@/components/pdf/NutritionPlanPDF';
import { NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { renderToBuffer } from '@react-pdf/renderer';

// ── Datos de ejemplo para la preview ─────────────────────────────────────────

const MOCK_PATIENT = {
  name: 'María García',
  email: 'maria@ejemplo.com',
};

const MOCK_PLAN = {
  week_start_date: new Date().toISOString(),
};

const MOCK_CONTENT = {
  week_summary: {
    target_daily_calories: 1650,
    target_macros: { protein_g: 120, carbs_g: 180, fat_g: 58 },
    weekly_averages: { calories: 1640, protein_g: 118, carbs_g: 178, fat_g: 57 },
    goal: 'weight_loss',
  },
  days: [
    {
      day_number: 1,
      day_name: 'Lunes',
      total_calories: 1650,
      total_macros: { protein_g: 120, carbs_g: 180, fat_g: 58 },
      meals: [
        {
          meal_type: 'desayuno',
          meal_name: 'Tostadas de aguacate con huevo poché',
          time_suggestion: '08:00',
          calories: 420,
          macros: { protein_g: 22, carbs_g: 38, fat_g: 18 },
          ingredients: [
            { name: 'Pan de centeno', quantity: 60, unit: 'g' },
            { name: 'Aguacate', quantity: 80, unit: 'g' },
            { name: 'Huevo', quantity: 2, unit: 'unidades' },
            { name: 'Sal y pimienta', quantity: 1, unit: 'pizca' },
          ],
          preparation:
            'Tostar el pan. Aplastar el aguacate con un poco de sal y zumo de limón. Escalfar los huevos en agua hirviendo con un chorrito de vinagre durante 3-4 minutos. Montar sobre las tostadas.',
          notes: '',
        },
        {
          meal_type: 'almuerzo',
          meal_name: 'Pechuga de pollo a la plancha con arroz integral y verduras',
          time_suggestion: '14:00',
          calories: 650,
          macros: { protein_g: 58, carbs_g: 72, fat_g: 12 },
          ingredients: [
            { name: 'Pechuga de pollo', quantity: 180, unit: 'g' },
            { name: 'Arroz integral cocido', quantity: 150, unit: 'g' },
            { name: 'Brócoli', quantity: 100, unit: 'g' },
            { name: 'Zanahoria', quantity: 80, unit: 'g' },
            { name: 'Aceite de oliva', quantity: 10, unit: 'ml' },
          ],
          preparation:
            'Salpimentar el pollo y cocinar a la plancha 6-7 minutos por cada lado. Cocer el brócoli y la zanahoria al vapor. Servir junto al arroz integral aliñado con aceite de oliva y hierbas.',
          notes: '',
        },
        {
          meal_type: 'cena',
          meal_name: 'Sopa de lentejas con verduras',
          time_suggestion: '20:30',
          calories: 480,
          macros: { protein_g: 28, carbs_g: 62, fat_g: 10 },
          ingredients: [
            { name: 'Lentejas cocidas', quantity: 180, unit: 'g' },
            { name: 'Tomate troceado', quantity: 100, unit: 'g' },
            { name: 'Cebolla', quantity: 60, unit: 'g' },
            { name: 'Espinacas', quantity: 80, unit: 'g' },
            { name: 'Comino y pimentón', quantity: 1, unit: 'cucharadita' },
          ],
          preparation:
            'Sofreír la cebolla en aceite de oliva. Añadir tomate y especias. Incorporar las lentejas y caldo vegetal. Cocinar 15 minutos. Agregar espinacas al final y rectificar de sal.',
          notes: '',
        },
      ],
    },
    {
      day_number: 2,
      day_name: 'Martes',
      total_calories: 1620,
      total_macros: { protein_g: 115, carbs_g: 175, fat_g: 57 },
      meals: [
        {
          meal_type: 'desayuno',
          meal_name: 'Yogur griego con avena y frutas del bosque',
          time_suggestion: '08:00',
          calories: 380,
          macros: { protein_g: 22, carbs_g: 48, fat_g: 8 },
          ingredients: [
            { name: 'Yogur griego 0%', quantity: 200, unit: 'g' },
            { name: 'Copos de avena', quantity: 40, unit: 'g' },
            { name: 'Arándanos', quantity: 80, unit: 'g' },
            { name: 'Miel', quantity: 10, unit: 'g' },
          ],
          preparation:
            'Mezclar el yogur con la avena y dejar reposar 10 minutos. Añadir las frutas del bosque y la miel por encima.',
          notes: '',
        },
        {
          meal_type: 'almuerzo',
          meal_name: 'Ensalada de salmón con quinoa y aguacate',
          time_suggestion: '14:00',
          calories: 680,
          macros: { protein_g: 45, carbs_g: 52, fat_g: 28 },
          ingredients: [
            { name: 'Salmón al horno', quantity: 160, unit: 'g' },
            { name: 'Quinoa cocida', quantity: 120, unit: 'g' },
            { name: 'Aguacate', quantity: 70, unit: 'g' },
            { name: 'Rúcula', quantity: 50, unit: 'g' },
            { name: 'Aceite de oliva', quantity: 12, unit: 'ml' },
          ],
          preparation:
            'Hornear el salmón 15 min a 180 °C. Montar la ensalada con quinoa, rúcula y aguacate en láminas. Colocar el salmón encima y aliñar con aceite, limón y sal.',
          notes: '',
        },
      ],
    },
  ],
  shopping_list: {
    produce: [
      'Aguacate x3',
      'Brócoli 300g',
      'Zanahoria 400g',
      'Tomates cherry 500g',
      'Espinacas bolsa 300g',
      'Arándanos 200g',
      'Rúcula bolsa 100g',
    ],
    protein: [
      'Pechuga de pollo 500g',
      'Salmón fresco 400g',
      'Huevos docena',
      'Yogur griego 0% x4',
    ],
    dairy: ['Yogur griego 0% x4'],
    grains: [
      'Pan de centeno 400g',
      'Arroz integral 500g',
      'Avena en copos 500g',
      'Quinoa 300g',
    ],
    pantry: [
      'Lentejas cocidas bote x2',
      'Aceite de oliva virgen extra',
      'Miel 250g',
      'Comino y pimentón',
    ],
  },
};

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Obtener perfil del nutricionista con ajustes de marca
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select(
      'full_name, clinic_name, logo_url, signature_url, college_number, primary_color, show_macros, show_shopping_list, welcome_message, font_preference, profile_photo_url'
    )
    .eq('id', user.id)
    .single();

  // Helper: descargar archivo de Storage como data URI base64
  async function downloadAsDataUri(bucket: string, path: string): Promise<string | null> {
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

  // Determinar si tiene suscripción Pro (para logo/firma)
  const { data: subscription } = await (supabase as any)
    .from('subscriptions')
    .select('status, price_id, prices(unit_amount, products(name))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  const productName: string = subscription?.prices?.products?.name ?? '';
  const is_pro =
    subscription != null &&
    (productName.toLowerCase().includes('pro') ||
      productName.toLowerCase().includes('profesional') ||
      productName === '');

  let logo_uri: string | null = null;
  let signature_uri: string | null = null;
  let profile_photo_uri: string | null = null;

  if (is_pro && profileData?.logo_url) {
    logo_uri = await downloadAsDataUri('nutritionist-logos', profileData.logo_url as string);
  }
  if (is_pro && profileData?.signature_url) {
    signature_uri = await downloadAsDataUri(
      'nutritionist-signatures',
      profileData.signature_url as string
    );
  }
  if (profileData?.profile_photo_url) {
    profile_photo_uri = await downloadAsDataUri(
      'nutritionist-photos',
      profileData.profile_photo_url as string
    );
  }

  const profile = {
    full_name: (profileData?.full_name as string) || 'Nutricionista Demo',
    clinic_name: (profileData?.clinic_name as string | null) ?? null,
    college_number: (profileData?.college_number as string | null) ?? null,
    primary_color: (profileData?.primary_color as string | null) ?? '#1a7a45',
    show_macros: (profileData?.show_macros as boolean | null) ?? true,
    show_shopping_list: (profileData?.show_shopping_list as boolean | null) ?? true,
    welcome_message: (profileData?.welcome_message as string | null) ?? null,
    font_preference: ((profileData?.font_preference as string | null) ??
      'clasica') as FontPreference,
    profile_photo_url: (profileData?.profile_photo_url as string | null) ?? null,
  };

  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: MOCK_PLAN,
      content: MOCK_CONTENT,
      patient: MOCK_PATIENT,
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
    console.error('Error generando PDF de preview:', err);
    return Response.json(
      { error: 'Error al generar el PDF de preview. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
