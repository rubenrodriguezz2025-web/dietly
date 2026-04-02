import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { OnboardingWizard } from './onboarding-form';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Solo redirigir si el onboarding ya fue completado
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    redirect('/dashboard');
  }

  return (
    <main style={{ backgroundColor: '#050a05', minHeight: '100vh' }}>
      <OnboardingWizard />
    </main>
  );
}
