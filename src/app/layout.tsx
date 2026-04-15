import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Montserrat_Alternates, Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import Link from 'next/link';
import { IoLogoInstagram, IoLogoTwitter } from 'react-icons/io5';

import { ConsentAnalytics } from '@/components/consent-analytics';
import { CookieBanner, CookiePreferencesLink } from '@/components/cookie-banner';
import { Logo } from '@/components/logo';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/utils/cn';

import { Navigation } from './navigation';

import '@/styles/globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

const SITE_DESCRIPTION =
  'Genera planes nutricionales personalizados en 2 minutos con IA. Tú revisas, ajustas y firmas con tu marca. Diseñado para nutricionistas autónomos en España.';

export const metadata: Metadata = {
  metadataBase: new URL('https://dietly.es'),
  title: {
    default: 'Dietly — Software para nutricionistas con IA',
    template: '%s | Dietly',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'software nutricionista',
    'planes nutricionales IA',
    'dietista España',
    'app nutricionista',
    'consulta nutricional online',
  ],
  authors: [{ name: 'Dietly' }],
  creator: 'Dietly',
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: 'https://dietly.es' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://dietly.es',
    siteName: 'Dietly',
    title: 'Dietly — Software para nutricionistas con IA',
    description: SITE_DESCRIPTION,
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'Dietly' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dietly — Software para nutricionistas con IA',
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  verification: { google: 'ZAqPEz33rrIhsXhC0hGte5ObU8EvwIHTtdgPu1h2Oh0' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://dietly.es/#organization',
      name: 'Dietly',
      url: 'https://dietly.es',
      logo: 'https://dietly.es/logo.png',
      description: 'Software para nutricionistas con IA',
      areaServed: { '@type': 'Country', name: 'España' },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'hola@dietly.es',
        contactType: 'customer support',
        availableLanguage: ['Spanish'],
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://dietly.es/#software',
      name: 'Dietly',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: [
        {
          '@type': 'Offer',
          name: 'Plan Básico',
          price: '46',
          priceCurrency: 'EUR',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '46',
            priceCurrency: 'EUR',
            unitCode: 'MON',
          },
        },
        {
          '@type': 'Offer',
          name: 'Plan Profesional',
          price: '89',
          priceCurrency: 'EUR',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '89',
            priceCurrency: 'EUR',
            unitCode: 'MON',
          },
        },
      ],
      provider: { '@id': 'https://dietly.es/#organization' },
      inLanguage: 'es-ES',
    },
  ],
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isPwa = pathname.startsWith('/p/');
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <html lang='es'>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={cn('font-sans antialiased', plusJakartaSans.variable, montserratAlternates.variable)}>
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
