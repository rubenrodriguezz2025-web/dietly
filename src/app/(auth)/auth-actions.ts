'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

export async function signInWithOAuth(provider: 'github' | 'google'): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return redirect(data.url);
}

export async function signInWithEmail(email: string): Promise<ActionResponse> {
  // ── Debug: verificar que las env vars están cargadas ──────────────────────
  console.log('[signInWithEmail] NEXT_PUBLIC_SUPABASE_URL defined:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[signInWithEmail] NEXT_PUBLIC_SUPABASE_ANON_KEY defined:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const redirectTo = getURL('/auth/callback');
  console.log('[signInWithEmail] emailRedirectTo:', redirectTo);
  console.log('[signInWithEmail] email:', email);

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error('[signInWithEmail] Supabase error status:', error.status);
    console.error('[signInWithEmail] Supabase error message:', error.message);
    console.error('[signInWithEmail] Supabase error full:', JSON.stringify(error));
    return { data: null, error: error };
  }

  console.log('[signInWithEmail] OTP enviado correctamente a:', email);
  return { data: null, error: null };
}

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}
