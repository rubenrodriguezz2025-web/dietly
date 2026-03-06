import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Si ya tiene perfil, no necesita onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profile) {
    redirect('/dashboard');
  }

  return (
    <main className='flex min-h-screen items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <h1 className='text-2xl font-bold'>Bienvenido a Dietly</h1>
          <p className='mt-2 text-muted-foreground'>
            Cuéntanos un poco sobre ti para personalizar tu experiencia.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
