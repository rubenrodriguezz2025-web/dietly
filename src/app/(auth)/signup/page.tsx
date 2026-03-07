import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { signInWithEmail, signInWithOAuth } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function SignUp() {
  const session = await getSession();
  const subscription = await getSubscription();

  if (session && subscription) {
    redirect('/account');
  }

  if (session && !subscription) {
    redirect('/pricing');
  }

  return (
    <section className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16'>
      <AuthUI mode='signup' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} />
    </section>
  );
}
