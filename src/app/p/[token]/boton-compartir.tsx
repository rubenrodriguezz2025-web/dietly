'use client';

import { useCallback, useState } from 'react';

type Props = {
  titulo: string;
  texto: string;
};

export function BotonCompartir({ titulo, texto }: Props) {
  const [copiado, setCopiado] = useState(false);

  const compartir = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch {
        // El usuario canceló o falló — fallback a copiar
      }
    }

    // Fallback: copiar URL al portapapeles
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard no disponible
    }
  }, [titulo, texto]);

  return (
    <button
      type='button'
      onClick={compartir}
      className='flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25'
      aria-label='Compartir plan'
    >
      {copiado ? (
        <>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
            <polyline points='20 6 9 17 4 12' />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <circle cx='18' cy='5' r='3' />
            <circle cx='6' cy='12' r='3' />
            <circle cx='18' cy='19' r='3' />
            <line x1='8.59' y1='13.51' x2='15.42' y2='17.49' />
            <line x1='15.41' y1='6.51' x2='8.59' y2='10.49' />
          </svg>
          Compartir
        </>
      )}
    </button>
  );
}
