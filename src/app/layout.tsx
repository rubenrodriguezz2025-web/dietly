import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import Link from 'next/link';

import { ConsentAnalytics } from '@/components/consent-analytics';
import { CookieBanner, CookiePreferencesLink } from '@/components/cookie-banner';
import { Logo } from '@/components/logo';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/utils/cn';

import { Navigation } from './navigation';

import '@/styles/globals.css';

const generalSans = localFont({
  src: '../../public/fonts/general-sans/GeneralSans-Variable.woff2',
  variable: '--font-body',
  display: 'swap',
  weight: '200 700',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dietly — Planes nutricionales con IA',
  description:
    'Software para nutricionistas que genera planes nutricionales completos en 2 minutos con IA. Tú los revisas, ajustas y entregas con tu marca.',
  icons: { icon: '/favicon.svg' },
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isPwa = pathname.startsWith('/p/');
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <html lang='es'>
      <body className={cn('font-sans antialiased', generalSans.variable, instrumentSerif.variable)}>
        <ThemeProvider>
          <div className='flex min-h-screen flex-col'>
            {!isPwa && !isDashboard ? (
              <>
                <div className='bg-[#050a05] text-white'>
                  <AppBar />
                </div>
                <main className='relative flex-1'>{children}</main>
                <div className='bg-[#050a05] text-white'>
                  <Footer />
                </div>
              </>
            ) : (
              <main className='relative flex-1'>{children}</main>
            )}
          </div>
          <Toaster />
          <ConsentAnalytics />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}

async function AppBar() {
  return (
    <header className='w-full py-5'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-6'>
        <Logo />
        <Navigation />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className='mt-16 text-neutral-400'>
      <div className='mx-auto max-w-6xl px-6 py-10'>
        <div className='flex flex-col justify-between gap-8 lg:flex-row'>
          <div>
            <Logo />
          </div>
          <div className='grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-16'>
            <div className='flex flex-col gap-2 lg:gap-6'>
              <div className='font-semibold text-neutral-100'>Producto</div>
              <nav className='flex flex-col gap-2 lg:gap-6'>
                <Link href='/signup'>Registrarse</Link>
              </nav>
            </div>
            <div className='flex flex-col gap-2 lg:gap-6'>
              <div className='font-semibold text-neutral-100'>Legal</div>
              <nav className='flex flex-col gap-2 lg:gap-6'>
                <Link href='/legal/privacidad'>Privacidad</Link>
                <Link href='/legal/terminos'>Términos</Link>
                <Link href='/derechos-datos'>Tus derechos RGPD</Link>
              </nav>
            </div>
            <div className='flex flex-col gap-2 lg:gap-6'>
              <div className='font-semibold text-neutral-100'>Contacto</div>
              <nav className='flex flex-col gap-2 lg:gap-6'>
                <a href='mailto:hola@dietly.es'>hola@dietly.es</a>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className='border-t border-zinc-800'>
        <div className='mx-auto max-w-6xl px-6 py-5 text-center'>
          <span className='text-neutral4 text-xs'>
            Copyright {new Date().getFullYear()} © Dietly ·
            {' '}<a href='/legal/privacidad' className='transition-colors hover:text-zinc-300'>Privacidad</a>
            {' · '}
            <a href='/legal/terminos' className='transition-colors hover:text-zinc-300'>Términos</a>
            {' · '}
            <a href='/politica-cookies' className='transition-colors hover:text-zinc-300'>Cookies</a>
            {' · '}
            <CookiePreferencesLink />
          </span>
        </div>
      </div>
    </footer>
  );
}
