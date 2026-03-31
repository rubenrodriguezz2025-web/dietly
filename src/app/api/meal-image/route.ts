import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export const maxDuration = 30;

interface MealImageRequest {
  planId: string;
  mealIndex: number;
  mealName: string;
  ingredients: string[];
}

interface GeminiPart {
  inlineData?: { data: string; mimeType: string };
  text?: string;
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

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!geminiRes.ok) {
      const geminiError = await geminiRes.text();
      console.error('[meal-image] Gemini status:', geminiRes.status, geminiError);
      return NextResponse.json({ url: null, error: `Gemini ${geminiRes.status}: ${geminiError}` });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };

    console.log('[meal-image] Gemini candidates:', geminiData?.candidates?.length ?? 0);

    const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData?.data) {
      const partsDebug = parts.map((p) => ({ hasInlineData: !!p.inlineData, hasText: !!p.text, mimeType: p.inlineData?.mimeType }));
      console.error('[meal-image] Gemini no devolvió imagen. Parts:', JSON.stringify(partsDebug));
      return NextResponse.json({ url: null, error: 'Gemini no devolvió imagen', parts: partsDebug });
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
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
