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

  // Obtener perfil del nutricionista (logo, firma, número de colegiado y ajustes de marca)
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name, logo_url, signature_url, college_number, primary_color, show_macros, show_shopping_list, welcome_message, font_preference, profile_photo_url')
    .eq('id', user.id)
    .single();

  const profile: Pick<Profile, 'full_name' | 'clinic_name' | 'college_number'> & {
    primary_color?: string | null;
    show_macros?: boolean | null;
    show_shopping_list?: boolean | null;
    welcome_message?: string | null;
    font_preference?: string | null;
    profile_photo_url?: string | null;
  } = profileData ?? {
    full_name: '',
    clinic_name: null,
    college_number: null,
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

  // Helper: descarga un archivo de Storage y devuelve data URI base64
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

  // Construir data URIs de logo, firma y foto de perfil (logo/firma solo Plan Pro)
  let logo_uri: string | null = null;
  let signature_uri: string | null = null;
  let profile_photo_uri: string | null = null;

  if (is_pro) {
    if (profileData?.logo_url) {
      logo_uri = await downloadAsDataUri('nutritionist-logos', profileData.logo_url as string);
    }
    if (profileData?.signature_url) {
      signature_uri = await downloadAsDataUri('nutritionist-signatures', profileData.signature_url as string);
    }
  }

  // Foto de perfil disponible para todos los planes
  if (profileData?.profile_photo_url) {
    profile_photo_uri = await downloadAsDataUri('nutritionist-photos', profileData.profile_photo_url as string);
  }

  // Fecha de aprobación formateada
  const approved_at = plan.approved_at
    ? new Date(plan.approved_at as string).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  const patient = plan.patients as Pick<Patient, 'name' | 'email'>;

  // Generar el PDF
  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: { week_start_date: plan.week_start_date },
      content,
      patient,
      profile,
      logo_uri,
      signature_uri,
      profile_photo_uri,
      is_pro,
      approved_at,
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
