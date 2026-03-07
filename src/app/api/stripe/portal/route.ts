import { redirect } from 'next/navigation';

import { getCustomerId } from '@/features/account/controllers/get-customer-id';
import { getSession } from '@/features/account/controllers/get-session';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

// GET /api/stripe/portal
// Crea una sesión del portal de cliente de Stripe y redirige al usuario.
// El portal permite gestionar la suscripción, cambiar tarjeta, cancelar, etc.

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const customerId = await getCustomerId({ userId: session.user.id });

  if (!customerId) {
    // El usuario nunca ha iniciado un pago — redirigir al dashboard
    redirect('/dashboard?sin_suscripcion=1');
  }

  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getURL()}/dashboard`,
  });

  redirect(url);
}
