import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export const metadata: Metadata = {
  title: 'Empieza gratis con 2 pacientes',
  description:
    'Registro gratuito en Dietly. 2 pacientes gratis sin tarjeta. Cancela cuando quieras.',
  alternates: { canonical: 'https://dietly.es/signup' },
  openGraph: { url: 'https://dietly.es/signup' },
};

export default async function SignUp() {
  let hasSession = false;
  try {
    const session = await getSession();
    hasSession = !!session;
  } catch (err) {
    console.error('[SignUp] Error al obtener la sesión:', err);
    // Continúa y renderiza el formulario aunque getSession falle
  }

  if (hasSession) {
    redirect('/dashboard');
  }

  return (
    <section className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16'>
      <AuthUI mode='signup' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} signUpWithEmail={signUpWithEmail} />
    </section>
  );
}
