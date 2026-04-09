import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getSession } from '@/features/account/controllers/get-session';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

// POST /api/stripe/checkout
// Body: { plan: 'basico' | 'pro' }
// Crea una sesión de checkout con 14 días de prueba gratuita y redirige al usuario.
// Los price IDs se leen de las variables de entorno STRIPE_PRICE_BASICO_ID / STRIPE_PRICE_PRO_ID.

export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  const planTipo = plan === 'pro' ? 'pro' : 'basico';

  const priceId =
    planTipo === 'pro'
      ? process.env.STRIPE_PRICE_PRO_ID
      : process.env.STRIPE_PRICE_BASICO_ID;

  if (!priceId) {
    console.error(`STRIPE_PRICE_${planTipo.toUpperCase()}_ID no configurado`);
    return NextResponse.json(
      { error: 'Plan no disponible. Contacta con soporte.' },
      { status: 500 }
    );
  }

  const customerId = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email!,
  });

  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer: customerId,
    customer_update: { address: 'auto' },
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 14,
      metadata: { user_id: session.user.id, plan_tier: planTipo },
    },
    allow_promotion_codes: true,
    success_url: `${getURL()}/dashboard?checkout=exito`,
    cancel_url: `${getURL()}/onboarding/plan`,
    locale: 'es',
    metadata: { user_id: session.user.id, plan_tier: planTipo },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'Error creando sesión de pago' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
