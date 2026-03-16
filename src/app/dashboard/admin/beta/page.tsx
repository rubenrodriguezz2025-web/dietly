import { redirect } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { AddBetaForm } from './add-form';
import { BetaTable } from './beta-table';

const ADMIN_EMAIL = 'rubenrodriguezz2025@gmail.com';

interface BetaEntry {
  id: string;
  email: string;
  name: string | null;
  added_at: string;
  notes: string | null;
}

export default async function AdminBetaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  const { data: entries } = (await (supabaseAdminClient as any)
    .from('beta_whitelist')
    .select('id, email, name, added_at, notes')
    .order('added_at', { ascending: false })) as { data: BetaEntry[] | null };

  const list = entries ?? [];

  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div>
        <p className='mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600'>
          Admin
        </p>
        <h1 className='text-2xl font-bold text-zinc-100'>Acceso beta</h1>
        <p className='mt-1 text-sm text-zinc-500'>
          Gestiona quién puede registrarse en Dietly durante la fase de acceso anticipado.
        </p>
      </div>

      {/* Counter */}
      <div className='flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4'>
        <span className='text-3xl font-bold tabular-nums text-zinc-100'>{list.length}</span>
        <span className='text-sm text-zinc-500'>
          {list.length === 1 ? 'nutricionista en beta' : 'nutricionistas en beta'}
        </span>
      </div>

      {/* Add form */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-5'>
        <h2 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Añadir nutricionista
        </h2>
        <AddBetaForm />
      </div>

      {/* Table */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-5'>
        <h2 className='mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Lista blanca
        </h2>
        <BetaTable entries={list} />
      </div>
    </div>
  );
}
