'use client';

import Link from 'next/link';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center'>
      <h2 className='text-2xl font-semibold'>Error en el panel</h2>
      <p className='max-w-md text-neutral-500'>
        Ha ocurrido un error inesperado. Si el problema persiste, contacta con nosotros en hola@dietly.es.
      </p>
      <div className='flex gap-3'>
        <button
          onClick={reset}
          className='rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800'
        >
          Intentar de nuevo
        </button>
        <Link
          href='/dashboard'
          className='rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100'
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
