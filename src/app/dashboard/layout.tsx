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

  const [{ data: profile }, { count: draftCount }] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('full_name, specialty, profile_photo_url')
      .eq('id', user.id)
      .single() as Promise<{ data: { full_name: string; specialty: string | null; profile_photo_url: string | null } | null }>,
    (supabase as any)
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('nutritionist_id', user.id)
      .eq('status', 'draft') as Promise<{ count: number | null }>,
  ]);

  // Generar signed URL para la foto de perfil del sidebar
  let profilePhotoUrl: string | null = null;
  if (profile?.profile_photo_url) {
    const { data: signedData } = await supabase.storage
      .from('nutritionist-photos')
      .createSignedUrl(profile.profile_photo_url as string, 3600);
    profilePhotoUrl = signedData?.signedUrl ?? null;
  }

  return (
    <div data-dashboard className='min-h-screen'>
      <div className='mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'>
        <div className='flex min-h-[calc(100vh-200px)] gap-8 py-4 lg:py-6'>
          {/* Desktop sidebar */}
          <aside className='hidden w-48 flex-shrink-0 lg:block'>
            <div className='sticky top-8'>
              <SidebarNav
                isAdmin={isAdmin}
                draftCount={draftCount ?? 0}
                profileName={profile?.full_name ?? ''}
                profileSpecialty={profile?.specialty ?? null}
                profilePhoto={profilePhotoUrl}
              />
            </div>
          </aside>

          {/* Main content */}
          <div className='min-w-0 flex-1'>
            {/* Mobile nav — horizontal pills, shown only on mobile */}
            <MobileDashboardNav isAdmin={isAdmin} draftCount={draftCount ?? 0} />
            <div className='animate-page-in'>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
