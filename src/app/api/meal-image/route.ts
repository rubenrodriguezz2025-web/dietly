// PAUSADO: pendiente de API key Gemini con billing activado
// Roadmap post-beta cuando haya ventas

import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

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
  // Verificar autenticación
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as MealImageRequest;
    const { planId, mealIndex, mealName, ingredients } = body;

    const idx = typeof mealIndex === 'string' ? parseInt(mealIndex, 10) : mealIndex;
    if (!planId || typeof idx !== 'number' || isNaN(idx) || !mealName) {
      return NextResponse.json({ url: null, error: 'Parámetros inválidos' }, { status: 400 });
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
      // continuar con generación
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ url: null, error: 'GEMINI_API_KEY no configurada' });
    }

    const ingredientesTexto = ingredients.slice(0, 6).join(', ');
    const prompt =
      `Professional food photography of "${mealName}". ` +
      `Main ingredients: ${ingredientesTexto}. ` +
      `Bright natural light, top-down view, white ceramic plate, clean minimalist background. ` +
      `Appetizing and fresh. No text, no labels, no watermarks.`;

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

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json({ url: null, error: `Gemini ${geminiRes.status}: ${errText}` });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };

    const parts = (geminiData?.candidates?.[0]?.content?.parts ?? []) as GeminiPart[];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
    const base64 = imagePart?.inlineData?.data;

    if (!base64) {
      return NextResponse.json({ url: null, error: 'No image generated' });
    }

    const imageBuffer = Buffer.from(base64, 'base64');

    const { error: uploadError } = await supabaseAdminClient.storage
      .from('meal-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ url: null, error: `Storage upload: ${uploadError.message}` });
    }

    const { data: urlData } = supabaseAdminClient.storage
      .from('meal-images')
      .getPublicUrl(storagePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ url: null, error: message });
  }
}
