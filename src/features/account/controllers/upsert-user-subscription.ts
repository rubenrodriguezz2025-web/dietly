import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { toDateTime } from '@/utils/to-date-time';

export async function upsertUserSubscription({
  subscriptionId,
  customerId,
}: {
  subscriptionId: string;
  customerId: string;
}) {
  // Buscar userId en profiles por stripe_customer_id
  const { data: customerData, error: noCustomerError } = await supabaseAdminClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  if (noCustomerError) throw noCustomerError;

  const { id: userId } = customerData!;

  const subscription = await stripeAdmin.subscriptions.retrieve(subscriptionId);

  const subscriptionData: Database['public']['Tables']['subscriptions']['Insert'] = {
    id: subscription.id,
    user_id: userId,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
    canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
    current_period_start: toDateTime(subscription.current_period_start).toISOString(),
    current_period_end: toDateTime(subscription.current_period_end).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
    trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
    trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
  };

  const { error } = await supabaseAdminClient.from('subscriptions').upsert([subscriptionData]);
  if (error) {
    throw error;
  }
  console.info(`Inserted/updated subscription [${subscription.id}] for user [${userId}]`);
}
