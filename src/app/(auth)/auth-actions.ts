'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

// ── Rate limiting de login — defensa en profundidad ───────────────────────────
// Supabase Auth provee protección a nivel de infraestructura como primera línea.
// Este Map actúa como segunda capa dentro de cada instancia serverless.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

const BETA_BLOCKED_MSG =
  'Tu acceso está pendiente de activación. Escríbenos a hola@dietly.es para solicitar acceso.';

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
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && now <= entry.resetAt && entry.count >= MAX_LOGIN_ATTEMPTS) {
    return {
      data: null,
      error: { message: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.' },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('[signInWithEmail] error:', error.message);
    const current = loginAttempts.get(ip);
    if (!current || now > current.resetAt) {
      loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    } else {
      current.count++;
    }
    return { data: null, error: error };
  }

  loginAttempts.delete(ip);
  redirect('/dashboard');
}

export async function signUpWithEmail(email: string, password: string): Promise<ActionResponse> {
  // Beta whitelist: si BETA_WHITELIST_ENABLED !== 'false', se verifica que el email
  // esté en beta_whitelist. Para abrir registro público, set BETA_WHITELIST_ENABLED=false en env.
  // Default: 'true' (whitelist activo) si la variable no está definida.
  const betaWhitelistEnabled = process.env.BETA_WHITELIST_ENABLED !== 'false';

  if (betaWhitelistEnabled) {
    const { data: entry } = await (supabaseAdminClient as any)
      .from('beta_whitelist')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (!entry) {
      return { data: null, error: { message: BETA_BLOCKED_MSG } };
    }
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

export async function requestPasswordReset(email: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getURL('/auth/callback?next=/reset-password'),
  });

  if (error) {
    console.error('[requestPasswordReset] error:', error.message);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}

export async function updatePassword(password: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('[updatePassword] error:', error.message);
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
