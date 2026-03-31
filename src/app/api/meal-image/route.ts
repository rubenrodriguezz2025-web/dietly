import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export const maxDuration = 30;

interface MealImageRequest {
  planId: string;
  mealIndex: number;
  mealName: string;
  ingredients: string[];
}

export async function POST(req: NextRequest) {
  console.log('[meal-image] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

  try {
    const body = (await req.json()) as MealImageRequest;
    const { planId, mealIndex, mealName, ingredients } = body;
    console.log('[meal-image] Request:', { planId, mealIndex, mealName, ingredientsCount: ingredients?.length });

    const idx = typeof mealIndex === 'string' ? parseInt(mealIndex, 10) : mealIndex;
    if (!planId || typeof idx !== 'number' || isNaN(idx) || !mealName) {
      console.error('[meal-image] Validación fallida:', { planId, idx, mealName });
      return NextResponse.json({ url: null, error: 'Parámetros inválidos' }, { status: 400 });
    }

    const storagePath = `${planId}/${idx}.png`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

    // Comprobar si ya existe la imagen
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/meal-images/${storagePath}`;
    try {
      const headRes = await fetch(publicUrl, { method: 'HEAD' });
      console.log('[meal-image] HEAD check:', headRes.status);
      if (headRes.ok) {
        return NextResponse.json({ url: publicUrl });
      }
    } catch (headErr) {
      console.error('[meal-image] HEAD check error:', headErr);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[meal-image] GEMINI_API_KEY no configurada');
      return NextResponse.json({ url: null, error: 'GEMINI_API_KEY no configurada' });
    }

    const ingredientesTexto = ingredients.slice(0, 6).join(', ');
    const prompt =
      `Professional food photography of "${mealName}". ` +
      `Main ingredients: ${ingredientesTexto}. ` +
      `Bright natural light, top-down view, white ceramic plate, clean minimalist background. ` +
      `Appetizing and fresh. No text, no labels, no watermarks.`;

    console.log('[meal-image] Llamando a gemini-2.0-flash (test texto)...');

    // DEBUG: test text-only para verificar que API key y modelo funcionan
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Describe briefly: ${prompt}` }] }],
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    console.log('[meal-image] Gemini status:', geminiRes.status);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[meal-image] Gemini error:', errText);
      return NextResponse.json({ url: null, error: `Gemini ${geminiRes.status}: ${errText}` });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const textResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('[meal-image] Gemini text response (primeros 100 chars):', textResponse.slice(0, 100));

    // TODO: una vez confirmada la conexión, añadir generación de imagen aquí
    // Por ahora devolvemos el texto como debug para confirmar que la API funciona
    return NextResponse.json({
      url: null,
      debug: 'API key y modelo funcionan',
      textSample: textResponse.slice(0, 200),
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[meal-image] Error inesperado:', err);
    return NextResponse.json({ url: null, error: message });
  }
}

// Silenciar advertencia de uso de supabaseAdminClient sin imágenes reales por ahora
void supabaseAdminClient;
