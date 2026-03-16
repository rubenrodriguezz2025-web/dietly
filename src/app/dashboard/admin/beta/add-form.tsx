'use client';

import { useRef, useState, useTransition } from 'react';

import { addBetaEmail } from './actions';

export function AddBetaForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addBetaEmail(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='flex flex-col gap-3'>
      {/* Row: email (required) + name (optional) */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='flex flex-1 flex-col gap-1'>
          <label htmlFor='beta-email' className='text-[11px] font-medium uppercase tracking-wider text-zinc-500'>
            Email <span className='text-red-500'>*</span>
          </label>
          <input
            id='beta-email'
            name='email'
            type='email'
            required
            placeholder='nutricionista@ejemplo.es'
            className='rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500'
          />
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <label htmlFor='beta-name' className='text-[11px] font-medium uppercase tracking-wider text-zinc-500'>
            Nombre <span className='text-zinc-600'>(opcional)</span>
          </label>
          <input
            id='beta-name'
            name='name'
            type='text'
            placeholder='María García'
            className='rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500'
          />
        </div>
      </div>

      {/* Notes */}
      <div className='flex flex-col gap-1'>
        <label htmlFor='beta-notes' className='text-[11px] font-medium uppercase tracking-wider text-zinc-500'>
          Notas <span className='text-zinc-600'>(opcional)</span>
        </label>
        <input
          id='beta-notes'
          name='notes'
          type='text'
          placeholder='Ej: contactada por LinkedIn, Valencia'
          className='rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500'
        />
      </div>

      {error && <p className='text-xs text-red-400'>{error}</p>}

      <div className='flex justify-end'>
        <button
          type='submit'
          disabled={isPending}
          className='rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#155f38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 active:bg-[#0f4a2c]'
        >
          {isPending ? 'Añadiendo...' : 'Añadir a beta'}
        </button>
      </div>
    </form>
  );
}
