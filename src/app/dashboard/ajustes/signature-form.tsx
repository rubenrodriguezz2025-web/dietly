'use client';

import { useActionState, useRef, useState } from 'react';
import Image from 'next/image';

import { deleteSignature, uploadSignature } from './actions';

type State = { error?: string; success?: boolean };
const initial: State = {};

export function SignatureForm({
  currentSignatureUrl,
  isPro,
}: {
  currentSignatureUrl: string | null;
  isPro: boolean;
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadSignature, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSignature, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  if (!isPro) {
    return (
      <div className='rounded-xl border border-dashed border-zinc-800 p-6 text-center'>
        <p className='text-sm text-zinc-500'>
          La firma digital en el PDF está disponible en el{' '}
          <span className='font-semibold text-zinc-300'>Plan Profesional</span>.
        </p>
        <a
          href='/pricing'
          className='mt-3 inline-block rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-medium text-white hover:bg-[#22c55e] hover:text-black'
        >
          Ver planes
        </a>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Vista previa */}
      {(preview ?? currentSignatureUrl) && (
        <div className='flex items-center gap-4'>
          <div className='relative flex h-16 w-48 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-2'>
            <Image
              src={preview ?? currentSignatureUrl!}
              alt='Firma actual'
              fill
              className='object-contain'
              unoptimized
            />
          </div>
          <p className='text-xs text-zinc-500'>
            {preview ? 'Vista previa de la nueva firma' : 'Firma actual'}
          </p>
        </div>
      )}

      {/* Subir firma */}
      <form action={uploadAction} className='flex flex-col gap-3'>
        <div
          className='flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 px-6 py-8 transition-colors hover:border-zinc-500'
          onClick={() => inputRef.current?.click()}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <div className='text-center'>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='mx-auto mb-2 h-8 w-8 text-zinc-600'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
            </svg>
            <p className='text-sm text-zinc-400'>
              {preview ? 'Cambiar imagen' : 'Haz clic para subir tu firma'}
            </p>
            <p className='mt-1 text-xs text-zinc-600'>PNG o WebP (fondo transparente) · máx. 256 KB</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type='file'
          name='signature'
          accept='image/png,image/webp'
          className='hidden'
          onChange={handleFileChange}
        />
        {uploadState.error && (
          <p className='text-sm text-red-400'>{uploadState.error}</p>
        )}
        {uploadState.success && (
          <p className='text-sm text-green-400'>Firma actualizada correctamente.</p>
        )}
        <button
          type='submit'
          disabled={uploadPending || !preview}
          className='self-start rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40'
        >
          {uploadPending ? 'Subiendo...' : 'Guardar firma'}
        </button>
      </form>

      {/* Eliminar firma existente */}
      {currentSignatureUrl && !preview && (
        <form action={deleteAction}>
          {deleteState.error && (
            <p className='mb-2 text-sm text-red-400'>{deleteState.error}</p>
          )}
          <button
            type='submit'
            disabled={deletePending}
            className='text-xs text-zinc-600 underline-offset-2 hover:text-red-400 hover:underline disabled:opacity-40'
          >
            {deletePending ? 'Eliminando...' : 'Eliminar firma'}
          </button>
        </form>
      )}
    </div>
  );
}
