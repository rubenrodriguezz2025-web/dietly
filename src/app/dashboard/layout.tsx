import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { MobileDashboardNav, SidebarNav } from './sidebar-nav';

const ADMIN_EMAIL = 'rubenrodriguezz2025@gmail.com';

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <div className='mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'>
      <div className='flex min-h-[calc(100vh-200px)] gap-8 py-4 lg:py-6'>
        {/* Desktop sidebar */}
        <aside className='hidden w-48 flex-shrink-0 lg:block'>
          <div className='sticky top-8'>
            <SidebarNav isAdmin={isAdmin} />
          </div>
        </aside>

        {/* Main content */}
        <div className='min-w-0 flex-1'>
          {/* Mobile nav — horizontal pills, shown only on mobile */}
          <MobileDashboardNav isAdmin={isAdmin} />
          <div className='animate-page-in'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
