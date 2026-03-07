import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { IntakeForm } from './intake-form';

export const metadata: Metadata = {
  title: 'Cuestionario de salud · Dietly',
  description: 'Rellena este formulario antes de tu primera consulta.',
};

export default async function PaginaIntake({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Buscar el paciente por intake_token (sin auth — admin client)
  const { data: paciente } = await (supabaseAdminClient as any)
    .from('patients')
    .select('id, name, intake_token')
    .eq('intake_token', token)
    .single();

  if (!paciente) notFound();

  // Comprobar si ya existe una respuesta
  const { data: respuestaExistente } = await (supabaseAdminClient as any)
    .from('intake_forms')
    .select('completed_at')
    .eq('patient_id', paciente.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (respuestaExistente) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#f4f7f5] p-6'>
        <div className='max-w-md text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <svg className='h-6 w-6 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </div>
          <h1 className='text-xl font-bold text-zinc-900'>Cuestionario ya enviado</h1>
          <p className='mt-2 text-sm text-zinc-500'>
            Ya enviaste este cuestionario el{' '}
            {new Date(respuestaExistente.completed_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . Tu nutricionista ya tiene tus datos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f4f7f5]'>
      {/* Cabecera */}
      <header className='border-b border-zinc-200 bg-white px-4 py-4'>
        <div className='mx-auto max-w-lg'>
          <p className='text-xs font-semibold text-green-600'>Dietly</p>
          <h1 className='text-lg font-bold text-zinc-900'>Cuestionario de salud</h1>
          <p className='text-sm text-zinc-500'>Hola, {paciente.name}. Rellénalo antes de tu consulta.</p>
        </div>
      </header>

      <main className='mx-auto max-w-lg px-4 py-6 pb-16'>
        <IntakeForm patientId={paciente.id} />
      </main>
    </div>
  );
}
