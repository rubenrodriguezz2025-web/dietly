'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'dietly_cookie_consent';

// Rutas donde NO mostrar el banner (PWA del paciente)
const EXCLUDED_PREFIXES = ['/p/'];

export function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No mostrar en rutas excluidas
    if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return;
    }
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }

    // Permite reabrir desde el footer
    function handleReopen() {
      setVisible(true);
    }
    window.addEventListener('dietly:reopen-cookies', handleReopen);
    return () => window.removeEventListener('dietly:reopen-cookies', handleReopen);
  }, [pathname]);

  function acceptAll() {
    localStorage.setItem(STORAGE_KEY, 'all');
    window.dispatchEvent(new Event('dietly:cookie-consent'));
    setVisible(false);
  }

  function acceptEssential() {
    localStorage.setItem(STORAGE_KEY, 'essential');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role='dialog'
      aria-label='Preferencias de cookies'
      className='fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm p-5 shadow-2xl animate-[slideUpBanner_400ms_cubic-bezier(0.16,1,0.3,1)_600ms_both] motion-reduce:animate-none'
    >
      <p className='text-sm font-semibold text-white'>Cookies y privacidad</p>
      <p className='mt-1 text-sm text-zinc-400'>
        Usamos cookies propias esenciales para el funcionamiento del servicio y cookies de análisis para
        mejorar la experiencia.{' '}
        <Link
          href='/politica-cookies'
          className='text-zinc-300 underline underline-offset-2 transition-colors hover:text-white'
        >
          Más información
        </Link>
        {' · '}
        <Link
          href='/legal/privacidad'
          className='text-zinc-300 underline underline-offset-2 transition-colors hover:text-white'
        >
          Privacidad
        </Link>
      </p>
      <div className='mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
        <button
          onClick={acceptEssential}
          className='rounded-xl border border-zinc-600 px-5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white'
        >
          Solo esenciales
        </button>
        <button
          onClick={acceptAll}
          className='rounded-xl bg-green-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-500'
        >
          Aceptar todas
        </button>
      </div>
    </div>
  );
}

// Enlace para reabrir las preferencias desde el footer
export function CookiePreferencesLink() {
  function handleClick() {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('dietly:reopen-cookies'));
  }

  return (
    <button
      onClick={handleClick}
      className='transition-colors hover:text-zinc-300'
    >
      Preferencias de cookies
    </button>
  );
}
