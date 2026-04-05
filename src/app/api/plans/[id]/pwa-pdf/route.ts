import React from 'react';

import { type FontPreference, NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { validatePlanAccessToken } from '@/libs/auth/plan-tokens';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { PlanContent, Profile } from '@/types/dietly';
import { renderToBuffer } from '@react-pdf/renderer';

// Rate limit: máx 5 descargas por plan por día
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params;

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

  // Verificar HMAC del token de acceso
  const tokenResult = await validatePlanAccessToken(patientToken, hmac, expires);
  if (!tokenResult.valid) {
    return Response.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  // Obtener el plan verificando que el patient_token coincide
  const { data: plan } = await (supabaseAdminClient as any)
    .from('nutrition_plans')
    .select('*, patients(id, name, email, nutritionist_id)')
    .eq('id', planId)
    .eq('patient_token', patientToken)
    .in('status', ['approved', 'sent'])
    .single();

  if (!plan) {
    return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
  }

  const content = plan.content as PlanContent | null;
  if (!content?.days?.length) {
    return Response.json({ error: 'El plan no tiene contenido' }, { status: 400 });
  }

  // Rate limiting: máx 5 descargas por plan por día (por IP)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await (supabaseAdminClient as any)
    .from('plan_access_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)
    .eq('ip_address', ip)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return Response.json(
      { error: 'Demasiadas descargas. Inténtalo de nuevo mañana.' },
      { status: 429 }
    );
  }

  // Registrar intento de acceso
  await (supabaseAdminClient as any)
    .from('plan_access_attempts')
    .insert({ plan_id: planId, ip_address: ip })
    .catch(() => {});

  const paciente = plan.patients as { id: string; name: string; email?: string; nutritionist_id: string };

  // Obtener perfil del nutricionista
  const { data: profileData } = await (supabaseAdminClient as any)
    .from('profiles')
    .select('*')
    .eq('id', paciente.nutritionist_id)
    .single();

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

  // Verificar si Pro
  const { data: subscription } = await (supabaseAdminClient as any)
    .from('subscriptions')
    .select('status, price_id')
    .eq('user_id', paciente.nutritionist_id)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  const is_pro =
    subscription != null &&
    !!process.env.STRIPE_PRICE_PRO_ID &&
    subscription.price_id === process.env.STRIPE_PRICE_PRO_ID;

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

  // Fecha de aprobación formateada
  const approved_at = plan.approved_at
    ? new Date(plan.approved_at as string).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : undefined;

  // Generar el PDF
  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: { week_start_date: plan.week_start_date },
      content,
      patient: { name: paciente.name, email: paciente.email },
      profile,
      logo_uri,
      signature_uri,
      profile_photo_uri,
      is_pro,
      approved_at,
    });

    const buffer = await renderToBuffer(elemento as unknown as React.JSX.Element);

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
    console.error('[PWA-PDF] Error generando PDF:', err);
    return Response.json(
      { error: 'Error al generar el PDF. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
