'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { signOut } from '@/app/(auth)/auth-actions';
import { cn } from '@/utils/cn';

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconHome({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
      <polyline points='9 22 9 12 15 12 15 22' />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
      <line x1='16' y1='2' x2='16' y2='6' />
      <line x1='8' y1='2' x2='8' y2='6' />
      <line x1='3' y1='10' x2='21' y2='10' />
    </svg>
  );
}

function IconUserPlus({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
      <circle cx='8.5' cy='7' r='4' />
      <line x1='20' y1='8' x2='20' y2='14' />
      <line x1='23' y1='11' x2='17' y2='11' />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' />
      <path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
    </svg>
  );
}

function IconSignOut({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <polyline points='16 17 21 12 16 7' />
      <line x1='21' y1='12' x2='9' y2='12' />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <circle cx='12' cy='12' r='5' />
      <line x1='12' y1='1' x2='12' y2='3' />
      <line x1='12' y1='21' x2='12' y2='23' />
      <line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
      <line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
      <line x1='1' y1='12' x2='3' y2='12' />
      <line x1='21' y1='12' x2='23' y2='12' />
      <line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
      <line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
    </svg>
  );
}

function IconSwap({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <polyline points='17 1 21 5 17 9' />
      <path d='M3 11V9a4 4 0 014-4h14' />
      <polyline points='7 23 3 19 7 15' />
      <path d='M21 13v2a4 4 0 01-4 4H3' />
    </svg>
  );
}

function IconAdmin({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
      <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
    </svg>
  );
}

// ── Nav items ──────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: ({ className }: { className?: string }) => React.JSX.Element;
  matchFn?: (pathname: string) => boolean;
  badge?: number;
  badgeColor?: 'amber' | 'red';
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function NutritionistAvatar({
  name,
  photoUrl,
  specialty,
}: {
  name: string;
  photoUrl: string | null;
  specialty: string | null;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const specialtyLabel: Record<string, string> = {
    weight_loss: 'Pérdida de peso',
    sports: 'Nutrición deportiva',
    clinical: 'Nutrición clínica',
    tca: 'TCA / Psiconutrición',
    general: 'Nutrición general',
  };

  return (
    <div className='mb-5 flex items-center gap-3 px-1'>
      <div className='relative h-9 w-9 flex-shrink-0'>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className='h-9 w-9 rounded-full object-cover ring-1 ring-zinc-800'
          />
        ) : (
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-emerald-200 text-xs font-semibold text-emerald-800'>
            {initials || '?'}
          </div>
        )}
        <span className='absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium leading-tight text-zinc-100'>{name || 'Mi cuenta'}</p>
        {specialty && specialtyLabel[specialty] && (
          <p className='truncate text-[10px] text-zinc-600 leading-tight mt-0.5'>{specialtyLabel[specialty]}</p>
        )}
      </div>
    </div>
  );
}

// ── Nav link ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  matchFn,
  badge,
  badgeColor = 'amber',
}: NavItem) {
  const pathname = usePathname();
  const active = matchFn ? matchFn(pathname) : pathname === href;

  const badgeClasses = badgeColor === 'red'
    ? 'bg-red-500/20 text-red-400'
    : 'bg-amber-500/20 text-amber-400';

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
        active
          ? 'bg-[#1a7a45]/15 font-medium text-emerald-400'
          : 'text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-200',
      )}
    >
      <Icon className={cn('flex-shrink-0 transition-colors duration-150', active ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
      <span className='flex-1'>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={cn('flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums', badgeClasses)}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className='mb-1 mt-4 px-3 text-[10px] font-medium uppercase tracking-widest text-zinc-500 first:mt-0 dark:text-zinc-600'>
      {label}
    </p>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────

export function SidebarNav({
  isAdmin,
  draftCount = 0,
  pendingSwapsCount = 0,
  profileName = '',
  profileSpecialty = null,
  profilePhoto = null,
}: {
  isAdmin?: boolean;
  draftCount?: number;
  pendingSwapsCount?: number;
  profileName?: string;
  profileSpecialty?: string | null;
  profilePhoto?: string | null;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const NAV_GROUPS: NavGroup[] = [
    {
      label: 'Consulta',
      items: [
        {
          href: '/dashboard',
          label: 'Inicio',
          icon: IconHome,
          matchFn: (p) => p === '/dashboard' || p.startsWith('/dashboard/patients'),
          badge: draftCount,
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
      ],
    },
    {
      label: 'Herramientas',
      items: [
        {
          href: '/dashboard/intercambios',
          label: 'Intercambios',
          icon: IconSwap,
          matchFn: (p) => p.startsWith('/dashboard/intercambios'),
          badge: pendingSwapsCount,
          badgeColor: 'red' as const,
        },
        {
          href: '/dashboard/recetas',
          label: 'Mis recetas',
          icon: IconBook,
          matchFn: (p) => p.startsWith('/dashboard/recetas'),
        },
      ],
    },
    {
      label: 'Cuenta',
      items: [
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
      ],
    },
  ];

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <nav className='flex flex-col'>
      <NutritionistAvatar name={profileName} photoUrl={profilePhoto} specialty={profileSpecialty} />

      <div className='flex flex-col'>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <SectionLabel label={group.label} />
            <div className='flex flex-col gap-0.5'>
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <>
            <SectionLabel label='Admin' />
            <div className='flex flex-col gap-0.5'>
              <Link
                href='/dashboard/admin/beta'
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                  'text-zinc-600 hover:bg-zinc-900/70 hover:text-zinc-400',
                )}
              >
                <IconAdmin className='flex-shrink-0 text-zinc-700 transition-colors duration-150 group-hover:text-zinc-500' />
                Beta
              </Link>
            </div>
          </>
        )}
      </div>

      <div className='mx-1 mt-4 border-t border-zinc-800/50' />
      <button
        type='button'
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className='group mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors duration-150 hover:bg-zinc-900/70 hover:text-zinc-400'
      >
        {theme === 'dark' ? (
          <IconSun className='flex-shrink-0 transition-colors duration-150 group-hover:text-zinc-500' />
        ) : (
          <IconMoon className='flex-shrink-0 transition-colors duration-150 group-hover:text-zinc-500' />
        )}
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </button>
      <button
        type='button'
        onClick={handleSignOut}
        className='group mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors duration-150 hover:bg-zinc-900/70 hover:text-zinc-400'
      >
        <IconSignOut className='flex-shrink-0 transition-colors duration-150 group-hover:text-zinc-500' />
        Cerrar sesión
      </button>
    </nav>
  );
}

// ── Mobile horizontal nav ──────────────────────────────────────────────────────

export function MobileDashboardNav({ isAdmin, draftCount = 0, pendingSwapsCount = 0 }: { isAdmin?: boolean; draftCount?: number; pendingSwapsCount?: number }) {
  const pathname = usePathname();

  const ALL_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Inicio', icon: IconHome, matchFn: (p) => p === '/dashboard' || p.startsWith('/dashboard/patients'), badge: draftCount },
    { href: '/dashboard/agenda', label: 'Agenda', icon: IconCalendar, matchFn: (p) => p.startsWith('/dashboard/agenda') },
    { href: '/dashboard/patients/new', label: 'Nuevo paciente', icon: IconUserPlus, matchFn: (p) => p === '/dashboard/patients/new' },
    { href: '/dashboard/intercambios', label: 'Intercambios', icon: IconSwap, matchFn: (p) => p.startsWith('/dashboard/intercambios'), badge: pendingSwapsCount, badgeColor: 'red' as const },
    { href: '/dashboard/recetas', label: 'Mis recetas', icon: IconBook, matchFn: (p) => p.startsWith('/dashboard/recetas') },
    { href: '/dashboard/derechos-datos', label: 'RGPD', icon: IconShield, matchFn: (p) => p.startsWith('/dashboard/derechos-datos') },
    { href: '/dashboard/ajustes', label: 'Ajustes', icon: IconSettings, matchFn: (p) => p.startsWith('/dashboard/ajustes') },
  ];

  return (
    <nav
      className='lg:hidden flex items-center gap-1.5 overflow-x-auto py-3 border-b border-zinc-800/60 mb-2'
      style={{ scrollbarWidth: 'none' }}
      aria-label='Navegación del dashboard'
    >
      {ALL_ITEMS.map(({ href, label, icon: Icon, matchFn, badge, badgeColor = 'amber' }) => {
        const active = matchFn ? matchFn(pathname) : pathname === href;
        const mobileBadgeClasses = badgeColor === 'red'
          ? 'bg-red-500/20 text-red-400'
          : 'bg-amber-500/20 text-amber-400';
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 whitespace-nowrap',
              active
                ? 'bg-[#1a7a45]/20 font-medium text-emerald-400'
                : 'bg-gray-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300',
            )}
          >
            <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-emerald-400' : 'text-zinc-600')} />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className={cn('ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums', mobileBadgeClasses)}>
                {badge}
              </span>
            )}
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
              : 'bg-gray-100 dark:bg-zinc-900 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400',
          )}
        >
          <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='w-3.5 h-3.5 flex-shrink-0' aria-hidden='true'>
            <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
          </svg>
          Beta
        </Link>
      )}
    </nav>
  );
}
