import type { NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { data: plan } = await (supabase as any)
    .from('nutrition_plans')
    .select('status')
    .eq('id', id)
    .eq('nutritionist_id', user.id)
    .single();

  if (!plan) return Response.json({ error: 'Plan no encontrado' }, { status: 404 });

  return Response.json({ status: plan.status as string });
}
