'use client';

import Link from 'next/link';

type Props = {
  dias: Array<{ numero: number; nombre: string }>;
  diaActual: number;
  token: string;
};

export function NavegadorDias({ dias, diaActual, token }: Props) {
  return (
    <nav className='my-4 -mx-4 overflow-x-auto px-4'>
      <div className='flex gap-2 pb-1' style={{ width: 'max-content' }}>
        {dias.map((dia) => {
          const activo = dia.numero === diaActual;
          return (
            <Link
              key={dia.numero}
              href={`/p/${token}?dia=${dia.numero}`}
              scroll={false}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
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
