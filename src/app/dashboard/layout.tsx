import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { MobileDashboardNav, SidebarNav } from './sidebar-nav';

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className='mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'>
      <div className='flex min-h-[calc(100vh-200px)] gap-8 py-4 lg:py-6'>
        {/* Desktop sidebar */}
        <aside className='hidden w-48 flex-shrink-0 lg:block'>
          <div className='sticky top-8'>
            <SidebarNav />
          </div>
        </aside>

        {/* Main content */}
        <div className='min-w-0 flex-1'>
          {/* Mobile nav — horizontal pills, shown only on mobile */}
          <MobileDashboardNav />
          {children}
        </div>
      </div>
    </div>
  );
}
