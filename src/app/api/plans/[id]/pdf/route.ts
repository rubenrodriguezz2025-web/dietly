import React from 'react';

import { type FontPreference,NutritionPlanPDF } from '@/components/pdf/NutritionPlanPDF';
import { getImageDimensionsFromDataUri, isRasterDataUri } from '@/libs/image-dimensions';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
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
  const { data: plan, error } = await supabase
    .from('nutrition_plans')
    .select('*, patients(id, name, email)')
    .eq('id', id)
    .eq('nutritionist_id', user.id)
    .single();

  if (error || !plan) {
    return Response.json({ error: 'Plan no encontrado' }, { status: 404 });
  }

  if (plan.status !== 'approved' && plan.status !== 'sent') {
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

  // A-12: Comprobar si existe PDF cacheado y sigue vigente
  const pdfStoragePath = `${user.id}/${id}.pdf`;
  const pdfGeneratedAt = plan.pdf_generated_at ? new Date(plan.pdf_generated_at as string) : null;
  const planUpdatedAt = plan.updated_at ? new Date(plan.updated_at as string) : null;

  if (pdfGeneratedAt && planUpdatedAt && pdfGeneratedAt >= planUpdatedAt) {
    try {
      const { data: cachedBlob } = await supabase.storage
        .from('plan-pdfs')
        .download(pdfStoragePath);

      if (cachedBlob) {
        const cachedBuffer = await cachedBlob.arrayBuffer();
        const patientForName = plan.patients as { name: string };
        const fechaCache = new Date(plan.week_start_date as string).toISOString().split('T')[0];
        const nombreCache = patientForName.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        return new Response(new Uint8Array(cachedBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="plan-${nombreCache}-${fechaCache}.pdf"`,
            'Cache-Control': 'private, max-age=60',
          },
        });
      }
    } catch {
      // Cache miss — continuar con generación
    }
  }

  // Obtener perfil del nutricionista (logo, firma, número de colegiado y ajustes de marca)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('[PDF] Error al cargar perfil del nutricionista:', profileError.message);
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
    // Si full_name está vacío (perfil sin completar o query fallida), usar metadatos de auth como fallback
    full_name: profileData?.full_name
      || (user.user_metadata?.full_name as string | undefined)
      || '',
  };

  // Verificar si el usuario tiene suscripción Pro activa
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, price_id')
    .eq('user_id', user.id)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  const is_pro =
    subscription != null &&
    !!process.env.STRIPE_PRICE_PRO_ID &&
    subscription.price_id === process.env.STRIPE_PRICE_PRO_ID;

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

  // Descargar logo, firma y foto en paralelo (A-10)
  const downloads = await Promise.all([
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

  logo_uri = isRasterDataUri(downloads[0]) ? downloads[0] : null;
  signature_uri = downloads[1];
  profile_photo_uri = isRasterDataUri(downloads[2]) ? downloads[2] : null;

  const logo_dimensions = logo_uri ? getImageDimensionsFromDataUri(logo_uri) : null;
  const photo_dimensions = profile_photo_uri ? getImageDimensionsFromDataUri(profile_photo_uri) : null;

  // Fecha de aprobación formateada
  const approved_at = plan.approved_at
    ? new Date(plan.approved_at as string).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  const patient = plan.patients as { name: string; email?: string };

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
      logo_dimensions,
      photo_dimensions,
      is_pro,
      approved_at: approved_at ?? undefined,
    });

    const buffer = await renderToBuffer(elemento as unknown as React.JSX.Element);

    // A-12: Guardar PDF en Storage y marcar pdf_generated_at
    try {
      await supabaseAdminClient.storage
        .from('plan-pdfs')
        .upload(pdfStoragePath, new Uint8Array(buffer), {
          contentType: 'application/pdf',
          upsert: true,
        });

      await supabaseAdminClient
        .from('nutrition_plans')
        .update({ pdf_generated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (cacheErr) {
      console.error('[PDF] Error guardando caché:', cacheErr);
    }

    // L-06: Audit log — generación de PDF (RGPD Art. 30)
    try {
      await supabaseAdminClient
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'read',
          resource_type: 'plan',
          resource_id: id,
          metadata: { action: 'pdf_generated', patient_id: plan.patient_id },
        });
    } catch {
      // silenciar error de audit log
    }

    const fechaStr = new Date(plan.week_start_date as string)
      .toISOString()
      .split('T')[0]; // YYYY-MM-DD
    const nombrePaciente = patient.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // eliminar tildes
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const nombreArchivo = `plan-${nombrePaciente}-${fechaStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'Cache-Control': 'private, max-age=60',
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
