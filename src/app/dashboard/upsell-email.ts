import { createElement } from 'react';

import { UpsellEmail } from '@/features/emails/upsell';
import { resendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { render } from '@react-email/components';

type UpsellCheckInput = {
  userId: string;
  email: string | null;
  name: string;
  createdAt: string | null;
  subscriptionStatus: string | null;
  upsellSentAt: string | null;
};

const UPSELL_THRESHOLD_DAYS = 10;

/**
 * Dispara el email de upsell cuando el nutricionista cumple ≥10 días sin suscripción
 * y aún no lo ha recibido. Fire-and-forget: nunca bloquea el render del dashboard.
 */
export function maybeSendUpsellEmail(input: UpsellCheckInput): void {
  if (!input.email) return;
  if (input.subscriptionStatus === 'trialing' || input.subscriptionStatus === 'active') return;
  if (input.upsellSentAt) return;
  if (!input.createdAt) return;

  const daysSinceSignup =
    (Date.now() - new Date(input.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceSignup < UPSELL_THRESHOLD_DAYS) return;

  // Fire-and-forget: ejecuta en background y captura errores sin propagarlos.
  void sendUpsellEmail(input).catch((err) => {
    console.error('[upsell-email] Error enviando email de upsell:', err);
  });
}

async function sendUpsellEmail(input: UpsellCheckInput): Promise<void> {
  if (!input.email) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const pricingUrl = `${appUrl}/pricing`;
  const firstName = input.name.split(' ')[0] ?? input.name;

  const emailElement = createElement(UpsellEmail, {
    name: firstName,
    pricingUrl,
  });

  const [html, text] = await Promise.all([
    render(emailElement),
    render(emailElement, { plainText: true }),
  ]);

  const { error } = await resendClient.emails.send({
    from: 'Dietly <hola@dietly.es>',
    replyTo: 'hola@dietly.es',
    to: input.email,
    subject: `¿Qué tal con Dietly, ${firstName}?`,
    html,
    text,
  });

  if (error) {
    console.error('[upsell-email] Resend error:', error);
    return;
  }

  // Marcar enviado para no reenviarlo en próximos logins
  const { error: updateError } = await (supabaseAdminClient as any)
    .from('profiles')
    .update({ upsell_email_sent_at: new Date().toISOString() })
    .eq('id', input.userId);

  if (updateError) {
    console.error('[upsell-email] Error marcando upsell_email_sent_at:', updateError);
  }
}
