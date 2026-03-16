'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { updatePassword } from '../auth-actions';

const inputClass =
  'border-[#1a2e1a] bg-[#0a0f0a] text-zinc-100 placeholder:text-zinc-600 focus:border-[#1a7a45] focus:ring-[#1a7a45]/30';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value;

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      setPending(false);
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setPending(false);
      return;
    }

    const result = await updatePassword(password);

    if (result?.error) {
      setError('No hemos podido actualizar la contraseña. El enlace puede haber expirado — solicita uno nuevo.');
    } else {
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2500);
    }

    setPending(false);
  }

  return (
    <section className='mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16'>
      <div className='flex w-full flex-col gap-6 rounded-2xl border border-[#1a2e1a] bg-[#0d140d] p-8 text-center'>
        {/* Logo */}
        <div className='flex flex-col items-center gap-3'>
          <svg width='44' height='44' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden>
            <rect width='40' height='40' rx='10' fill='#1a7a45' />
            <path fill='white' d='M20 31 C11 29 7 22 9 14 C11 8 16 6 20 6 C24 6 31 10 31 19 C31 26 26 31 20 31 Z' />
            <path stroke='#1a7a45' strokeWidth='2' strokeLinecap='round' d='M20 30 L20 13' />
            <path stroke='#1a7a45' strokeWidth='1.3' strokeLinecap='round' d='M20 23 L25 18' />
            <path stroke='#1a7a45' strokeWidth='1.3' strokeLinecap='round' d='M20 19 L15 15' />
          </svg>
          <span className='font-alt text-xl font-bold text-white'>Dietly</span>
        </div>

        {done ? (
          <div className='flex flex-col gap-3'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1a7a45]/20'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='22'
                height='22'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-[#1a7a45]'
                aria-hidden='true'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
            </div>
            <h1 className='text-lg font-semibold text-zinc-100'>Contraseña actualizada</h1>
            <p className='text-sm text-zinc-500'>
              Tu contraseña se ha cambiado correctamente. Redirigiendo al dashboard...
            </p>
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-1.5'>
              <h1 className='text-lg font-semibold text-zinc-100'>Nueva contraseña</h1>
              <p className='text-sm text-zinc-500'>Elige una contraseña segura para tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-3 text-left'>
              <div className='flex flex-col gap-1'>
                <label htmlFor='password' className='text-xs text-zinc-500'>Nueva contraseña</label>
                <Input
                  id='password'
                  type='password'
                  name='password'
                  placeholder='Mínimo 8 caracteres'
                  required
                  autoFocus
                  className={inputClass}
                />
              </div>

              <div className='flex flex-col gap-1'>
                <label htmlFor='confirm' className='text-xs text-zinc-500'>Confirmar contraseña</label>
                <Input
                  id='confirm'
                  type='password'
                  name='confirm'
                  placeholder='Repite la contraseña'
                  required
                  className={inputClass}
                />
              </div>

              {error && <p className='rounded-md bg-red-950 px-3 py-2 text-xs text-red-400'>{error}</p>}

              <Button
                type='submit'
                disabled={pending}
                className='mt-1 w-full bg-[#1a7a45] font-semibold text-white hover:bg-[#22c55e] hover:text-black disabled:cursor-not-allowed disabled:opacity-50'
              >
                {pending ? (
                  <span className='flex items-center justify-center gap-2'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='animate-spin'
                      aria-hidden='true'
                    >
                      <path d='M21 12a9 9 0 1 1-6.219-8.56' />
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  'Guardar nueva contraseña'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
