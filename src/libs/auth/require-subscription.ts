import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'rubenrodriguezz2025@gmail.com';

type SubscriptionCheck =
  | { authorized: true; userId: string; email: string }
  | { authorized: false; error: string; code: 'SUBSCRIPTION_REQUIRED' | 'UNAUTHORIZED' };

/**
 * Verifica que el usuario autenticado tenga una suscripción activa o en trial.
 * Admins (ADMIN_EMAIL) pasan siempre.
 *
 * Uso en API routes:
 *   const check = await requireActiveSubscription();
 *   if (!check.authorized) return NextResponse.json(
 *     { error: check.error, code: check.code }, { status: 403 }
 *   );
 *
 * Uso en Server Actions:
 *   const check = await requireActiveSubscription();
 *   if (!check.authorized) return { error: check.error };
 */
export async function requireActiveSubscription(): Promise<SubscriptionCheck> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: 'No autorizado', code: 'UNAUTHORIZED' };
  }

  // Admin bypass
  if (user.email === ADMIN_EMAIL) {
    return { authorized: true, userId: user.id, email: user.email };
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (!subscription) {
    return {
      authorized: false,
      error: 'Necesitas una suscripción activa para usar esta función.',
      code: 'SUBSCRIPTION_REQUIRED',
    };
  }

  return { authorized: true, userId: user.id, email: user.email ?? '' };
}
