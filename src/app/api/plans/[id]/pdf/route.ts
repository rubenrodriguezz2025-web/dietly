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

  // Obtener perfil del nutricionista
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('full_name, clinic_name')
    .eq('id', user.id)
    .single();

  const profile: Pick<Profile, 'full_name' | 'clinic_name'> = profileData ?? {
    full_name: '',
    clinic_name: null,
  };

  const patient = plan.patients as Pick<Patient, 'name' | 'email'>;

  // Generar el PDF
  try {
    const elemento = React.createElement(NutritionPlanPDF, {
      plan: { week_start_date: plan.week_start_date },
      content,
      patient,
      profile,
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
