import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export const maxDuration = 30;

interface MealImageRequest {
  planId: string;
  mealIndex: number;
  mealName: string;
  ingredients: string[];
}

interface ImagenPrediction {
  bytesBase64Encoded?: string;
  mimeType?: string;
}

export async function POST(req: NextRequest) {
  console.log('[meal-image] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('[meal-image] NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[meal-image] SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

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
      console.log('[meal-image] HEAD check:', headRes.status, publicUrl);
      if (headRes.ok) {
        return NextResponse.json({ url: publicUrl });
      }
    } catch (headErr) {
      console.error('[meal-image] HEAD check error:', headErr);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[meal-image] GEMINI_API_KEY no configurada — añádela en Vercel Environment Variables');
      return NextResponse.json({ url: null, error: 'GEMINI_API_KEY no configurada' });
    }

    const ingredientesTexto = ingredients.slice(0, 6).join(', ');
    const prompt =
      `Professional food photography of "${mealName}". ` +
      `Main ingredients: ${ingredientesTexto}. ` +
      `Bright natural light, top-down view, white ceramic plate, clean minimalist background. ` +
      `Appetizing and fresh. No text, no labels, no watermarks.`;

    console.log('[meal-image] Llamando a Gemini para:', mealName);

    const imagenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!imagenRes.ok) {
      const imagenError = await imagenRes.text();
      console.error('[meal-image] Imagen3 status:', imagenRes.status, imagenError);
      return NextResponse.json({ url: null, error: `Imagen3 ${imagenRes.status}: ${imagenError}` });
    }

    const imagenData = (await imagenRes.json()) as {
      predictions?: ImagenPrediction[];
    };

    console.log('[meal-image] Imagen3 predictions:', imagenData?.predictions?.length ?? 0);

    const prediction = imagenData?.predictions?.[0];

    if (!prediction?.bytesBase64Encoded) {
      console.error('[meal-image] Imagen3 no devolvió imagen. Data:', JSON.stringify(imagenData));
      return NextResponse.json({ url: null, error: 'Imagen3 no devolvió imagen' });
    }

    const imageBuffer = Buffer.from(prediction.bytesBase64Encoded, 'base64');
    console.log('[meal-image] Imagen generada, tamaño (bytes):', imageBuffer.length);

    const { error: uploadError } = await supabaseAdminClient.storage
      .from('meal-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[meal-image] Error subiendo a Storage:', uploadError.message, uploadError);
      return NextResponse.json({ url: null, error: `Storage upload: ${uploadError.message}` });
    }

    const { data: urlData } = supabaseAdminClient.storage
      .from('meal-images')
      .getPublicUrl(storagePath);

    console.log('[meal-image] OK, URL:', urlData.publicUrl);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[meal-image] Error inesperado:', err);
    return NextResponse.json({ url: null, error: message });
  }
}
