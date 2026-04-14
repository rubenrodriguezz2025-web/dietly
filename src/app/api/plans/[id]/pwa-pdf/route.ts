import React from 'react';

import { type FontPreference, NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { getUserSubscriptionById } from '@/features/account/controllers/get-user-subscription';
import { validatePlanAccessToken } from '@/libs/auth/plan-tokens';
import { getImageDimensionsFromDataUri, isRasterDataUri } from '@/libs/image-dimensions';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { PlanContent, Profile } from '@/types/dietly';
import { renderToBuffer } from '@react-pdf/renderer';

// Vercel: permitir hasta 30s para generación de PDF
export const maxDuration = 30;

// Rate limit: máx 5 descargas por plan por día
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;
    console.log('[PWA-PDF] Inicio. planId:', planId);

    // Validar body
    let body: { patientToken: string; hmac: string; expires: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Body inválido' }, { status: 400 });
    }

    const { patientToken, hmac, expires } = body;
    if (!patientToken || !hmac || !expires) {
      return Response.json({ error: 'Faltan parámetros de autenticación' }, { status: 400 });
    }
    console.log('[PWA-PDF] Parámetros OK. Validando token...');

    // Verificar HMAC del token de acceso
    let tokenResult: { valid: boolean };
    try {
      tokenResult = await validatePlanAccessToken(patientToken, hmac, expires);
    } catch (tokenErr) {
      console.error('[PWA-PDF] Error en validatePlanAccessToken:', tokenErr);
      return Response.json({ error: 'Error validando token' }, { status: 500 });
    }

    if (!tokenResult.valid) {
      return Response.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }
    console.log('[PWA-PDF] Token válido. Buscando plan...');

    // Obtener el plan verificando que el patient_token coincide
    const { data: plan, error: planError } = await (supabaseAdminClient as any)
      .from('nutrition_plans')
      .select('*, patients(id, name, email, nutritionist_id)')
      .eq('id', planId)
      .eq('patient_token', patientToken)
      .in('status', ['approved', 'sent'])
      .single();

    if (planError) {
      console.error('[PWA-PDF] Error DB buscando plan:', planError.message);
    }

    if (!plan) {
      return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
    }
    console.log('[PWA-PDF] Plan encontrado. Verificando contenido...');

    const content = plan.content as PlanContent | null;
    if (!content?.days?.length) {
      return Response.json({ error: 'El plan no tiene contenido' }, { status: 400 });
    }

    // Rate limiting: máx 5 descargas por plan por día (por IP)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await (supabaseAdminClient as any)
      .from('plan_access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .eq('ip_address', ip)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('[PWA-PDF] Error rate limit query:', countError.message);
    }

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return Response.json(
        { error: 'Demasiadas descargas. Inténtalo de nuevo mañana.' },
        { status: 429 }
      );
    }
    console.log('[PWA-PDF] Rate limit OK. count:', count);

    // Registrar intento de acceso
    try {
      await (supabaseAdminClient as any)
        .from('plan_access_attempts')
        .insert({ plan_id: planId, ip_address: ip });
    } catch (e) {
      console.warn('[PWA-PDF] No se pudo registrar intento:', e);
    }

    const paciente = plan.patients as { id: string; name: string; email?: string; nutritionist_id: string };
    console.log('[PWA-PDF] Buscando perfil nutricionista:', paciente.nutritionist_id);

    // Obtener perfil del nutricionista
    const { data: profileData, error: profileError } = await (supabaseAdminClient as any)
      .from('profiles')
      .select('*')
      .eq('id', paciente.nutritionist_id)
      .single();

    if (profileError) {
      console.error('[PWA-PDF] Error obteniendo perfil:', profileError.message);
    }

    const profile: Pick<Profile, 'full_name' | 'clinic_name' | 'college_number'> & {
      primary_color?: string | null;
      show_macros?: boolean | null;
      show_shopping_list?: boolean | null;
      welcome_message?: string | null;
      font_preference?: FontPreference | null;
      profile_photo_url?: string | null;
    } = {
      ...(profileData ?? { full_name: '', clinic_name: null, college_number: null }),
      font_preference: ((profileData?.font_preference as string | null) ?? 'clasica') as FontPreference,
      full_name: profileData?.full_name || '',
    };

    // Verificar si Pro (fuente: profiles.subscription_status + stripe_price_id)
    const subscription = await getUserSubscriptionById(paciente.nutritionist_id as string);
    const is_pro = subscription?.isActive === true && subscription.isPro === true;

    console.log('[PWA-PDF] is_pro:', is_pro, '— Descargando assets...');

    // Helper: descarga archivo de Storage como data URI base64
    async function downloadAsDataUri(bucket: string, storagePath: string): Promise<string | null> {
      try {
        const { data: blob } = await supabaseAdminClient.storage.from(bucket).download(storagePath);
        if (!blob) return null;
        const buf = await blob.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return `data:${(blob as Blob).type || 'image/png'};base64,${b64}`;
      } catch {
        return null;
      }
    }

    // Descargar assets en paralelo
    const [logo_uri, signature_uri, profile_photo_uri] = await Promise.all([
      is_pro && profileData?.logo_url
        ? downloadAsDataUri('nutritionist-logos', profileData.logo_url as string)
        : Promise.resolve(null),
      is_pro && profileData?.signature_url
        ? downloadAsDataUri('nutritionist-signatures', profileData.signature_url as string)
        : Promise.resolve(null),
      profileData?.profile_photo_url
        ? downloadAsDataUri('nutritionist-photos', profileData.profile_photo_url as string)
        : Promise.resolve(null),
    ]);

    // SVG no es soportado por <Image> de react-pdf — descartar si es SVG
    const logo_uri_raster = isRasterDataUri(logo_uri) ? logo_uri : null;
    const profile_photo_uri_raster = isRasterDataUri(profile_photo_uri) ? profile_photo_uri : null;

    const logo_dimensions = logo_uri_raster ? getImageDimensionsFromDataUri(logo_uri_raster) : null;
    const photo_dimensions = profile_photo_uri_raster ? getImageDimensionsFromDataUri(profile_photo_uri_raster) : null;

    console.log('[PWA-PDF] Assets OK. logo:', !!logo_uri_raster, 'signature:', !!signature_uri, 'photo:', !!profile_photo_uri_raster);

    // Fecha de aprobación formateada
    const approved_at = plan.approved_at
      ? new Date(plan.approved_at as string).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : undefined;

    console.log('[PWA-PDF] Generando PDF...');

    // Generar el PDF
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: { week_start_date: plan.week_start_date },
      content,
      patient: { name: paciente.name, email: paciente.email },
      profile,
      logo_uri: logo_uri_raster,
      signature_uri,
      profile_photo_uri: profile_photo_uri_raster,
      logo_dimensions,
      photo_dimensions,
      is_pro,
      approved_at,
    });

    let buffer: Buffer;
    try {
      buffer = await renderToBuffer(elemento as unknown as React.JSX.Element);
    } catch (renderErr) {
      console.error('[PWA-PDF] Error en renderToBuffer:', renderErr);
      return Response.json(
        { error: 'Error al renderizar el PDF. Inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    console.log('[PWA-PDF] PDF generado. Tamaño bytes:', buffer.length);

    const fechaStr = new Date(plan.week_start_date as string).toISOString().split('T')[0];
    const nombrePaciente = paciente.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="plan-${nombrePaciente}-${fechaStr}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (err) {
    console.error('[PWA-PDF] Excepción no capturada:', err);
    return Response.json(
      { error: 'Error inesperado al generar el PDF. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
