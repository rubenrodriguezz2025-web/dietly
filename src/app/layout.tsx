import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';
import Link from 'next/link';
import { IoLogoFacebook, IoLogoInstagram, IoLogoTwitter } from 'react-icons/io5';

import { Logo } from '@/components/logo';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';

import { Navigation } from './navigation';

import '@/styles/globals.css';

export const dynamic = 'force-dynamic';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dietly — Planes nutricionales con IA',
  description:
    'Software para nutricionistas que genera planes nutricionales completos en 2 minutos con IA. Tú los revisas, ajustas y entregas con tu marca.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='es'>
      <body className={cn('bg-[#050a05] font-sans antialiased', montserrat.variable, montserratAlternates.variable)}>
        <div className='flex min-h-screen flex-col'>
          <AppBar />
          <main className='relative flex-1'>{children}</main>
          <Footer />
        </div>
        <Toaster />
        <Analytics />
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
          <div className='grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-16'>
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
            <div className='flex flex-col gap-2 lg:gap-6'>
              <div className='font-semibold text-neutral-100'>Síguenos</div>
              <nav className='flex flex-col gap-2 lg:gap-6'>
                <Link href='#'>
                  <span className='flex items-center gap-2'>
                    <IoLogoInstagram size={22} /> <span>Instagram</span>
                  </span>
                </Link>
                <Link href='#'>
                  <span className='flex items-center gap-2'>
                    <IoLogoTwitter size={22} /> <span>Twitter / X</span>
                  </span>
                </Link>
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
          </span>
        </div>
      </div>
    </footer>
  );
}
