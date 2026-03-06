'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function saveProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const full_name = formData.get('full_name') as string;
  const clinic_name = formData.get('clinic_name') as string;
  const specialty = formData.get('specialty') as string;

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name,
    clinic_name,
    specialty,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}
