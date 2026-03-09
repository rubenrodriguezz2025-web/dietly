import React from 'react';

import { NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import type { Patient, PlanContent, Profile } from '@/types/dietly';
import { renderToBuffer } from '@react-pdf/renderer';


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Obtener el plan con datos del paciente
  const { data: plan, error } = await (supabase as any)
    .from('nutrition_plans')
    .select('*, patients(id, name, email)')
    .eq('id', id)
    .eq('nutritionist_id', user.id)
    .single();

  if (error || !plan) {
    return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
  }

  if (plan.status !== 'approved') {
    return Response.json(
      { error: 'El plan debe estar aprobado antes de generar el PDF' },
      { status: 400 }
    );
  }

  const content = plan.content as PlanContent | null;
  if (!content?.days?.length) {
    return Response.json(
      { error: 'El plan no tiene contenido' },
      { status: 400 }
    );
  }

  // Obtener perfil del nutricionista (incluye logo_url)
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name, logo_url')
    .eq('id', user.id)
    .single();

  const profile: Pick<Profile, 'full_name' | 'clinic_name'> = profileData ?? {
    full_name: '',
    clinic_name: null,
  };

  // Verificar si el usuario tiene suscripción Pro activa
  // Plan Pro = producto Stripe cuyo nombre contiene "pro" o "profesional"
  // TODO: cuando haya price_id de Pro en variables de entorno, comparar directamente
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
      // Fallback: si tiene suscripción activa pero no podemos leer el nombre, es Pro
      productName === '');

  // Construir data URI del logo si el usuario es Pro y tiene logo
  let logo_uri: string | null = null;
  if (is_pro && profileData?.logo_url) {
    try {
      const { data: logoBlob } = await supabase.storage
        .from('nutritionist-logos')
        .download(profileData.logo_url as string);

      if (logoBlob) {
        const arrayBuffer = await logoBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = (logoBlob as Blob).type || 'image/png';
        logo_uri = `data:${mimeType};base64,${base64}`;
      }
    } catch {
      // Si falla la descarga del logo, continuar sin él
      logo_uri = null;
    }
  }

  const patient = plan.patients as Pick<Patient, 'name' | 'email'>;

  // Generar el PDF
  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: { week_start_date: plan.week_start_date },
      content,
      patient,
      profile,
      logo_uri,
      is_pro,
    });

    const buffer = await renderToBuffer(elemento as any);

    const nombreArchivo = `plan-nutricional-${patient.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Error generando PDF:', err);
    return Response.json(
      { error: 'Error al generar el PDF. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
