import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { NewPatientForm } from './new-patient-form';

export default async function NewPatientPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('specialty')
    .eq('id', user.id)
    .single();

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-bold text-zinc-100'>Nuevo paciente</h1>
        <p className='mt-1 text-sm text-zinc-500'>
          Introduce los datos del paciente para crear su ficha clínica.
        </p>
      </div>
      <NewPatientForm specialty={profile?.specialty ?? null} />
    </div>
  );
}
