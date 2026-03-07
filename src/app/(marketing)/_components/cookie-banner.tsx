'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('dietly-cookies')) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem('dietly-cookies', 'accepted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className='fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl'>
      <p className='text-sm text-zinc-400'>
        Usamos cookies técnicas necesarias para el funcionamiento del servicio.{' '}
        <Link
          href='/legal/privacidad'
          className='text-zinc-300 underline underline-offset-2 hover:text-white transition-colors'
        >
          Política de privacidad
        </Link>
      </p>
      <div className='mt-3 flex justify-end'>
        <button
          onClick={accept}
          className='rounded-xl bg-green-600 px-5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-500'
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
