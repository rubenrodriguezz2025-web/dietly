'use server';

import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

const BETA_BLOCKED_MSG =
  'Dietly está en acceso anticipado por invitación. Si quieres unirte a la beta escríbenos a hola@dietly.es';

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

export async function signInWithEmail(email: string, password: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('[signInWithEmail] error:', error.message);
    return { data: null, error: error };
  }

  redirect('/dashboard');
}

export async function signUpWithEmail(email: string, password: string): Promise<ActionResponse> {
  // Beta access: verificar que el email está en la lista blanca
  const { data: entry } = await (supabaseAdminClient as any)
    .from('beta_whitelist')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (!entry) {
    return { data: null, error: { message: BETA_BLOCKED_MSG } };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error('[signUpWithEmail] error:', error.message);
    return { data: null, error: error };
  }

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
