import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// Dietly usa profiles.subscription_status + profiles.stripe_price_id como fuente única
// de verdad. Las tablas del boilerplate Stripe (subscriptions/prices/products) nunca se
// aplicaron al proyecto. El webhook escribe ambas columnas en customer.subscription.*.

export type UserSubscription = {
  status: string | null;
  price_id: string | null;
  isActive: boolean;
  isPro: boolean;
};

function toSubscription(
  row: { subscription_status: string | null; stripe_price_id: string | null } | null,
): UserSubscription | null {
  if (!row) return null;
  const status = row.subscription_status;
  const priceId = row.stripe_price_id;
  const isActive = status === 'trialing' || status === 'active';
  const isPro =
    !!priceId &&
    !!process.env.STRIPE_PRICE_PRO_ID &&
    priceId === process.env.STRIPE_PRICE_PRO_ID;
  return { status, price_id: priceId, isActive, isPro };
}

// Para código con contexto de auth (páginas, server actions, API con RLS).
export async function getUserSubscription(): Promise<UserSubscription | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_price_id')
    .eq('id', user.id)
    .maybeSingle();

  return toSubscription(data as { subscription_status: string | null; stripe_price_id: string | null } | null);
}

// Para rutas públicas sin auth (ej. /p/[token]) — usa admin client (bypass RLS).
export async function getUserSubscriptionById(userId: string): Promise<UserSubscription | null> {
  const { data } = await supabaseAdminClient
    .from('profiles')
    .select('subscription_status, stripe_price_id')
    .eq('id', userId)
    .maybeSingle();

  return toSubscription(data as { subscription_status: string | null; stripe_price_id: string | null } | null);
}
