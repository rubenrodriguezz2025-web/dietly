'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { signOut } from '@/app/(auth)/auth-actions';
import { cn } from '@/utils/cn';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden='true'
    >
      <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
      <polyline points='9 22 9 12 15 12 15 22' />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden='true'
    >
      <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
      <line x1='16' y1='2' x2='16' y2='6' />
      <line x1='8' y1='2' x2='8' y2='6' />
      <line x1='3' y1='10' x2='21' y2='10' />
    </svg>
  );
}

function IconUserPlus({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden='true'
    >
      <path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
      <circle cx='8.5' cy='7' r='4' />
      <line x1='20' y1='8' x2='20' y2='14' />
      <line x1='23' y1='11' x2='17' y2='11' />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden='true'
    >
      <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
    </svg>
  );
}

// ── Nav items ──────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: ({ className }: { className?: string }) => React.JSX.Element;
  matchFn?: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: IconHome,
    matchFn: (p) => p === '/dashboard' || p.startsWith('/dashboard/patients'),
  },
  {
    href: '/dashboard/agenda',
    label: 'Agenda',
    icon: IconCalendar,
    matchFn: (p) => p.startsWith('/dashboard/agenda'),
  },
  {
    href: '/dashboard/patients/new',
    label: 'Nuevo paciente',
    icon: IconUserPlus,
    matchFn: (p) => p === '/dashboard/patients/new',
  },
  {
    href: '/dashboard/derechos-datos',
    label: 'RGPD',
    icon: IconShield,
    matchFn: (p) => p.startsWith('/dashboard/derechos-datos'),
  },
  {
    href: '/dashboard/ajustes',
    label: 'Ajustes',
    icon: IconSettings,
    matchFn: (p) => p.startsWith('/dashboard/ajustes'),
  },
];

// ── Desktop sidebar ────────────────────────────────────────────────────────────

export function SidebarNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <nav className='flex flex-col gap-0.5'>
      {NAV_ITEMS.map(({ href, label, icon: Icon, matchFn }) => {
        const active = matchFn ? matchFn(pathname) : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
              active
                ? 'bg-[#1a7a45]/15 font-medium text-emerald-400'
                : 'text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-200',
            )}
          >
            <Icon
              className={cn('flex-shrink-0 transition-colors duration-150', active ? 'text-emerald-400' : 'text-zinc-600')}
            />
            {label}
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <div className='mx-3 my-2 border-t border-zinc-800/60' />
          <Link
            href='/dashboard/admin/beta'
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
              pathname.startsWith('/dashboard/admin')
                ? 'bg-amber-950/40 font-medium text-amber-400'
                : 'text-zinc-600 hover:bg-zinc-900/70 hover:text-zinc-400',
            )}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className={cn(
                'flex-shrink-0 transition-colors duration-150',
                pathname.startsWith('/dashboard/admin') ? 'text-amber-400' : 'text-zinc-700',
              )}
              aria-hidden='true'
            >
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
            Beta
          </Link>
        </>
      )}

      {/* Separador + cerrar sesión */}
      <div className='mx-3 mt-3 border-t border-zinc-800/50' />
      <button
        type='button'
        onClick={handleSignOut}
        className='mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors duration-150 hover:bg-zinc-900/70 hover:text-zinc-400'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='flex-shrink-0'
          aria-hidden='true'
        >
          <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
          <polyline points='16 17 21 12 16 7' />
          <line x1='21' y1='12' x2='9' y2='12' />
        </svg>
        Cerrar sesión
      </button>
    </nav>
  );
}

// ── Mobile horizontal nav ──────────────────────────────────────────────────────

export function MobileDashboardNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className='lg:hidden flex items-center gap-1.5 overflow-x-auto py-3 border-b border-zinc-800/60 mb-2'
      style={{ scrollbarWidth: 'none' }}
      aria-label='Navegación del dashboard'
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, matchFn }) => {
        const active = matchFn ? matchFn(pathname) : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 whitespace-nowrap',
              active
                ? 'bg-[#1a7a45]/20 font-medium text-emerald-400'
                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300',
            )}
          >
            <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-emerald-400' : 'text-zinc-600')} />
            {label}
          </Link>
        );
      })}

      {isAdmin && (
        <Link
          href='/dashboard/admin/beta'
          className={cn(
            'flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 whitespace-nowrap',
            pathname.startsWith('/dashboard/admin')
              ? 'bg-amber-950/40 font-medium text-amber-400'
              : 'bg-zinc-900 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400',
          )}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='w-3.5 h-3.5 flex-shrink-0'
            aria-hidden='true'
          >
            <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
          </svg>
          Beta
        </Link>
      )}
    </nav>
  );
}
