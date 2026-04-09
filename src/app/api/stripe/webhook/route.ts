import Stripe from 'stripe';

import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';
import { toDateTime } from '@/utils/to-date-time';

// Webhook principal de Dietly — configurar en Stripe Dashboard:
// URL: https://TU_DOMINIO/api/stripe/webhook
// Eventos: checkout.session.completed, customer.subscription.*,
//          product.created/updated, price.created/updated

const EVENTOS_RELEVANTES = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const secret = getEnvVar(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');

  let evento: Stripe.Event;
  try {
    evento = stripeAdmin.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return Response.json(
      { error: `Webhook error: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (!EVENTOS_RELEVANTES.has(evento.type)) {
    return Response.json({ received: true });
  }

  try {
    switch (evento.type) {
      // ── Catálogo de productos y precios ──────────────────────────────────────
      case 'product.created':
      case 'product.updated':
        await upsertProduct(evento.data.object as Stripe.Product);
        break;

      case 'price.created':
      case 'price.updated':
        await upsertPrice(evento.data.object as Stripe.Price);
        break;

      // ── Suscripciones ─────────────────────────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = evento.data.object as Stripe.Subscription;
        await sincronizarSuscripcion(sub);
        break;
      }

      // ── Checkout completado ───────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = evento.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripeAdmin.subscriptions.retrieve(
            session.subscription as string
          );
          await sincronizarSuscripcion(sub, true);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook] Error procesando evento:', evento.type, err);
    return Response.json({ error: 'Error procesando webhook' }, { status: 400 });
  }

  return Response.json({ received: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sincronizarSuscripcion(
  subscription: Stripe.Subscription,
  esNueva = false
) {
  // Obtener el userId desde profiles
  const { data: clienteData, error: errCliente } = await supabaseAdminClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single();

  if (errCliente || !clienteData) {
    throw new Error(`Cliente no encontrado para customer ${subscription.customer}`);
  }

  const userId = clienteData.id;

  // Upsert en tabla subscriptions del boilerplate
  const datosSub = {
    id: subscription.id,
    user_id: userId,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? toDateTime(subscription.cancel_at).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? toDateTime(subscription.canceled_at).toISOString()
      : null,
    current_period_start: toDateTime(subscription.current_period_start).toISOString(),
    current_period_end: toDateTime(subscription.current_period_end).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at
      ? toDateTime(subscription.ended_at).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? toDateTime(subscription.trial_start).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? toDateTime(subscription.trial_end).toISOString()
      : null,
  };

  const { error: errSub } = await supabaseAdminClient
    .from('subscriptions')
    .upsert([datosSub]);

  if (errSub) throw errSub;

  // Actualizar subscription_status en profiles (columna añadida en migración 002)
  // Si la migración no se ha aplicado aún, el error se ignora silenciosamente.
  const estadoParaPerfil =
    subscription.status === 'canceled' ||
    subscription.status === 'incomplete_expired'
      ? 'canceled'
      : subscription.status;

  await supabaseAdminClient
    .from('profiles')
    .update({ subscription_status: estadoParaPerfil })
    .eq('id', userId);

  // Si es suscripción nueva, copiar datos de facturación al cliente de Stripe
  if (esNueva && subscription.default_payment_method) {
    const metodoPago = await stripeAdmin.paymentMethods.retrieve(
      subscription.default_payment_method as string
    );
    const { name, phone, address } = metodoPago.billing_details;
    if (name && phone && address) {
      await stripeAdmin.customers.update(subscription.customer as string, {
        name,
        phone,
        address: address as Stripe.AddressParam,
      });
    }
  }

  console.info(
    `[stripe/webhook] Suscripción ${subscription.id} sincronizada — estado: ${subscription.status} — usuario: ${userId}`
  );
}
