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
  try {
    const body = (await req.json()) as MealImageRequest;
    const { planId, mealIndex, mealName, ingredients } = body;

    const idx = typeof mealIndex === 'string' ? parseInt(mealIndex, 10) : mealIndex;
    if (!planId || typeof idx !== 'number' || isNaN(idx) || !mealName) {
      return NextResponse.json({ url: null }, { status: 400 });
    }

    const storagePath = `${planId}/${idx}.png`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

    // Comprobar si ya existe la imagen
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/meal-images/${storagePath}`;
    try {
      const headRes = await fetch(publicUrl, { method: 'HEAD' });
      if (headRes.ok) {
        return NextResponse.json({ url: publicUrl });
      }
    } catch {
      // Si falla el HEAD, continuamos a generar
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[meal-image] GEMINI_API_KEY no configurada');
      return NextResponse.json({ url: null });
    }

    const ingredientesTexto = ingredients.slice(0, 6).join(', ');
    const prompt =
      `Professional food photography of "${mealName}". ` +
      `Main ingredients: ${ingredientesTexto}. ` +
      `Bright natural light, top-down view, white ceramic plate, clean minimalist background. ` +
      `Appetizing and fresh. No text, no labels, no watermarks.`;

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
      console.error('[meal-image] Gemini status:', geminiRes.status, await geminiRes.text());
      return NextResponse.json({ url: null });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };

    const parts = geminiData?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData?.data) {
      console.warn('[meal-image] Gemini no devolvió imagen para:', mealName);
      return NextResponse.json({ url: null });
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

    const { error: uploadError } = await supabaseAdminClient.storage
      .from('meal-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[meal-image] Error subiendo a Storage:', uploadError.message);
      return NextResponse.json({ url: null });
    }

    const { data: urlData } = supabaseAdminClient.storage
      .from('meal-images')
      .getPublicUrl(storagePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error('[meal-image] Error inesperado:', err);
    return NextResponse.json({ url: null });
  }
}
