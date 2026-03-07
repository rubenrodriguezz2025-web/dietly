import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

import { signInWithEmail, signInWithOAuth } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function LoginPage() {
  let hasSession = false;
  try {
    const session = await getSession();
    hasSession = !!session;
  } catch (err) {
    console.error('[LoginPage] Error al obtener la sesión:', err);
    // Continúa y renderiza el formulario aunque getSession falle
  }

  if (hasSession) {
    redirect('/dashboard');
  }

  return (
    <section className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16'>
      <AuthUI mode='login' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} />
    </section>
  );
}
