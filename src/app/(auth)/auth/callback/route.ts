// ref: https://github.com/vercel/next.js/blob/canary/examples/with-supabase/app/auth/callback/route.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

const siteUrl = getURL();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect(`${siteUrl}/login`);
    }

    const next = requestUrl.searchParams.get('next');
    if (next && next.startsWith('/')) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }

    // Verificar si completó onboarding — si no, enviar al wizard
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed_at) {
      return NextResponse.redirect(`${siteUrl}/onboarding`);
    }

    return NextResponse.redirect(`${siteUrl}/dashboard`);
  }

  return NextResponse.redirect(siteUrl);
}
