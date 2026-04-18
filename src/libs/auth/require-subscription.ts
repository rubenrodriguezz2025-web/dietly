import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const BYPASS_EMAILS = [
  'rubenrodriguezz2025@gmail.com',
  'rubenrodriguezz2025+test11@gmail.com',
  'davixeb@gmail.com',
];

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
  if (user.email && BYPASS_EMAILS.includes(user.email)) {
    return { authorized: true, userId: user.id, email: user.email };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  const status = profile?.subscription_status;
  const hasActive = status === 'trialing' || status === 'active';

  if (!hasActive) {
    // Freemium: permitir si el usuario tiene ≤2 pacientes (el límite duro se
    // aplica en createPatient). El tope de pacientes ES el muro freemium,
    // no la generación de plan.
    const { count } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id);

    if ((count ?? 0) > 2) {
      return {
        authorized: false,
        error: 'Necesitas una suscripción activa para usar esta función.',
        code: 'SUBSCRIPTION_REQUIRED',
      };
    }
  }

  return { authorized: true, userId: user.id, email: user.email ?? '' };
}
