import { PropsWithChildren } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className='mx-auto w-full max-w-[1400px] px-6 lg:px-10'>
    <div className='flex min-h-[calc(100vh-200px)] gap-8 py-6'>
      <aside className='hidden w-52 flex-shrink-0 lg:block'>
        <nav className='flex flex-col gap-1'>
          <SidebarLink href='/dashboard'>Inicio</SidebarLink>
          <SidebarLink href='/dashboard/agenda'>Agenda</SidebarLink>
          <SidebarLink href='/dashboard/patients/new'>Nuevo paciente</SidebarLink>
        </nav>
      </aside>
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
    </div>
  );
}

function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className='rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100'
    >
      {children}
    </Link>
  );
}
