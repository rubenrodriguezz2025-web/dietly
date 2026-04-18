import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Página no encontrada · Dietly',
};

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center'>
      <Image
        src='/logo.png'
        alt='Dietly'
        width={48}
        height={48}
        className='h-12 w-auto'
        priority
      />
      <div className='flex flex-col items-center gap-2'>
        <h1 className='text-3xl font-bold tracking-tight text-zinc-100'>
          Página no encontrada
        </h1>
        <p className='max-w-md text-sm text-zinc-400'>
          La página que buscas no existe o ha sido movida.
        </p>
      </div>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <Link
          href='/dashboard'
          className='inline-flex items-center justify-center rounded-lg bg-[#1a7a45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#156538]'
        >
          Volver al dashboard →
        </Link>
        <Link
          href='/'
          className='inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800'
        >
          Ir al inicio →
        </Link>
      </div>
    </div>
  );
}
