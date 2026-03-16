'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { requestPasswordReset } from '../auth-actions';

const inputClass =
  'border-[#1a2e1a] bg-[#0a0f0a] text-zinc-100 placeholder:text-zinc-600 focus:border-[#1a7a45] focus:ring-[#1a7a45]/30';

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    const result = await requestPasswordReset(email);

    if (result?.error) {
      setError('No hemos podido procesar la solicitud. Comprueba el email e inténtalo de nuevo.');
    } else {
      setSent(true);
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

        {sent ? (
          <div className='flex flex-col gap-3'>
            <h1 className='text-lg font-semibold text-zinc-100'>Revisa tu email</h1>
            <p className='text-sm text-zinc-500'>
              Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <Link href='/login' className='mt-2 text-sm text-[#1a7a45] transition-colors hover:text-[#22c55e]'>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-1.5'>
              <h1 className='text-lg font-semibold text-zinc-100'>Recuperar contraseña</h1>
              <p className='text-sm text-zinc-500'>
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-3 text-left'>
              <div className='flex flex-col gap-1'>
                <label htmlFor='email' className='text-xs text-zinc-500'>Email</label>
                <Input
                  id='email'
                  type='email'
                  name='email'
                  placeholder='tu@email.com'
                  required
                  autoFocus
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
                    Enviando...
                  </span>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </Button>
            </form>

            <Link href='/login' className='text-sm text-zinc-600 transition-colors hover:text-zinc-400'>
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
