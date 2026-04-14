import { redirect } from 'next/navigation';

import { getUserSubscription } from '@/features/account/controllers/get-user-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { PlanSelectionClient } from './PlanSelectionClient';

export default async function OnboardingPlanPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Guard: si no completó onboarding, redirigir al wizard
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding');
  }

  // Si ya tiene suscripción activa o en trial, va directo al dashboard
  const subscription = await getUserSubscription();
  if (subscription?.isActive) {
    redirect('/dashboard');
  }

  return (
    <main
      style={{
        backgroundColor: '#050a05',
        minHeight: '100vh',
        fontFamily:
          'var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <PlanSelectionClient />
    </main>
  );
}
