import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  const { data, error } = await supabaseAdminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Error buscando perfil del usuario: ${error.message}`);
  }

  if (data.stripe_customer_id) {
    return data.stripe_customer_id;
  }

  // No tiene stripe_customer_id, crear customer en Stripe
  const customer = await stripeAdmin.customers.create({
    email,
    metadata: { userId },
  });

  // Guardar stripe_customer_id en profiles
  const { error: updateError } = await supabaseAdminClient
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  return customer.id;
}
