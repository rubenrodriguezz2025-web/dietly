import type { Metadata } from 'next';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { FollowupForm } from './followup-form';

export const metadata: Metadata = {
  title: 'Cuestionario de seguimiento · Dietly',
  description: 'Responde a tu cuestionario de seguimiento nutricional.',
};

export default async function PaginaSeguimiento({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Buscar el formulario por token
  const { data: form } = await (supabaseAdminClient as any)
    .from('followup_forms')
    .select('id, patient_id, nutritionist_id, completed_at, patients(name)')
    .eq('token', token)
    .maybeSingle();

  if (!form) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950 p-6'>
        <div className='max-w-sm text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='text-zinc-500'
              aria-hidden='true'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          </div>
          <h1 className='text-lg font-bold text-zinc-200'>Enlace no válido</h1>
          <p className='mt-2 text-sm text-zinc-500'>
            Este cuestionario no existe o el enlace ha expirado.
          </p>
        </div>
      </div>
    );
  }

  if (form.completed_at) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950 p-6'>
        <div className='max-w-sm text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='22'
              height='22'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='text-emerald-400'
              aria-hidden='true'
            >
              <polyline points='20 6 9 17 4 12' />
            </svg>
          </div>
          <h1 className='text-lg font-bold text-zinc-100'>Cuestionario ya enviado</h1>
          <p className='mt-2 text-sm text-zinc-500'>
            Ya enviaste este cuestionario el{' '}
            {new Date(form.completed_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . Tu nutricionista ya tiene tus respuestas.
          </p>
        </div>
      </div>
    );
  }

  const patientName: string = (form.patients as { name: string } | null)?.name ?? 'Paciente';

  return (
    <div className='min-h-screen bg-zinc-950'>
      {/* Cabecera mínima */}
      <header className='border-b border-zinc-800/60 px-4 py-4'>
        <div className='mx-auto max-w-xl'>
          <p className='text-xs font-semibold tracking-wider text-[#1a7a45]'>DIETLY</p>
          <h1 className='mt-0.5 text-base font-semibold text-zinc-200'>
            Cuestionario de seguimiento
          </h1>
          <p className='text-sm text-zinc-500'>Hola, {patientName}. Cuéntanos cómo te ha ido.</p>
        </div>
      </header>

      <main className='mx-auto max-w-xl px-4 py-6 pb-16'>
        <FollowupForm token={token} patientName={patientName} />
      </main>
    </div>
  );
}
