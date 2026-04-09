import { NextResponse } from 'next/server';

import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

// POST /api/stripe/portal
// Crea una sesión del Customer Portal de Stripe y devuelve la URL.
// El portal permite gestionar suscripción, cambiar tarjeta, cancelar, ver facturas.

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: customer } = await supabaseAdminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No tienes una cuenta de facturación. Elige un plan primero.' },
      { status: 400 },
    );
  }

  const portalSession = await stripeAdmin.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${getURL()}/dashboard/ajustes`,
  });

  return NextResponse.json({ url: portalSession.url });
}
