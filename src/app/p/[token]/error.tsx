'use client';

export default function PwaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center'>
      <h2 className='text-2xl font-semibold'>No se pudo cargar tu plan</h2>
      <p className='max-w-md text-neutral-500'>
        Ha ocurrido un error. Comprueba tu conexión a internet e inténtalo de nuevo.
      </p>
      <button
        onClick={reset}
        className='rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700'
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
