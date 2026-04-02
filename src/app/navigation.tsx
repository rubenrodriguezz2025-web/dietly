import Link from 'next/link';
import { IoMenu } from 'react-icons/io5';

import { AccountMenu } from '@/components/account-menu';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { getSession } from '@/features/account/controllers/get-session';

import { signOut } from './(auth)/auth-actions';

const navBtnBase =
  'rounded-xl bg-[#1a7a45] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]';

export async function Navigation() {
  const session = await getSession();

  return (
    <div className='relative flex items-center gap-6'>
      {session ? (
        <AccountMenu signOut={signOut} />
      ) : (
        <>
          {/* Desktop CTA */}
          <Link href='/signup' className={`hidden flex-shrink-0 lg:flex ${navBtnBase}`}>
            Empieza gratis
          </Link>
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger className='block lg:hidden'>
              <IoMenu size={28} />
            </SheetTrigger>
            <SheetContent className='w-full bg-black'>
              <SheetHeader>
                <Logo />
                <SheetDescription className='py-8'>
                  <Link href='/signup' className={`flex ${navBtnBase}`}>
                    Empieza gratis
                  </Link>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
