import { redirect } from 'next/navigation';

import { getSubscription } from '@/features/account/controllers/get-subscription';
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

  // Si ya tiene suscripción activa o en trial, va directo al dashboard
  const subscription = await getSubscription();
  if (subscription?.status && ['trialing', 'active'].includes(subscription.status)) {
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
