'use client';

import Link from 'next/link';

type Props = {
  dias: Array<{ numero: number; nombre: string }>;
  diaActual: number;
  planId: string;
  /** Token HMAC y expiración: necesarios para que el middleware valide cada carga de día. */
  token: string;
  expires: string;
};

export function NavegadorDiasPlan({
  dias,
  diaActual,
  planId,
  token,
  expires,
}: Props) {
  return (
    <nav className='-mx-4 my-4 overflow-x-auto px-4'>
      <div className='flex gap-2 pb-1' style={{ width: 'max-content' }}>
        {dias.map((dia) => {
          const activo = dia.numero === diaActual;
          // Preservar token y expires en cada link de navegación entre días
          const href = `/plan/${planId}?token=${token}&expires=${expires}&dia=${dia.numero}`;
          return (
            <Link
              key={dia.numero}
              href={href}
              scroll={false}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activo
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {dia.nombre.substring(0, 3)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
