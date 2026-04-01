'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActionResponse } from '@/types/action-response';

const titleMap = {
  login: 'Accede a tu cuenta',
  signup: 'Empieza gratis con Dietly',
} as const;

const subtitleMap = {
  login: 'Bienvenido de nuevo.',
  signup: 'Genera planes nutricionales completos en 2 minutos. 14 días de prueba, sin tarjeta.',
} as const;

const inputClass =
  'border-[#1a2e1a] bg-[#0a0f0a] text-zinc-100 placeholder:text-zinc-600 focus:border-[#1a7a45] focus:ring-[#1a7a45]/30';

export function AuthUI({
  mode,
  signInWithOAuth: _signInWithOAuth,
  signInWithEmail,
  signUpWithEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string, password: string) => Promise<ActionResponse>;
  signUpWithEmail: (email: string, password: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        setPending(false);
        return;
      }

      const response = await signUpWithEmail(email, password);
      if (response?.error) {
        setError((response.error as { message?: string })?.message ?? 'Error al crear la cuenta.');
      } else {
        setSignupDone(true);
      }
    } else {
      const response = await signInWithEmail(email, password);
      if (response?.error) {
        setError('Email o contraseña incorrectos.');
      }
      // Si no hay error, signInWithEmail hace redirect server-side a /dashboard
    }

    setPending(false);
  }

  if (signupDone) {
    return (
      <section className='flex w-full flex-col items-center gap-6 rounded-2xl border border-[#1a2e1a] bg-[#0d140d] p-8 text-center'>
        <Logo />
        <div className='flex flex-col gap-2'>
          <h1 className='text-lg font-semibold text-zinc-100'>Revisa tu email</h1>
          <p className='text-sm text-zinc-500'>
            Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta.
          </p>
        </div>
        <Link href='/login' className='text-sm text-[#1a7a45] hover:text-[#22c55e]'>
          Volver al inicio de sesión
        </Link>
      </section>
    );
  }

  return (
    <section className='flex w-full flex-col gap-6 rounded-2xl border border-[#1a2e1a] bg-[#0d140d] p-8 text-center'>
      <Logo />

      <div className='flex flex-col gap-1.5'>
        <h1 className='text-lg font-semibold text-zinc-100'>{titleMap[mode]}</h1>
        <p className='text-sm text-zinc-500'>{subtitleMap[mode]}</p>
      </div>

      <form onSubmit={handleSubmit} className='flex flex-col gap-3 text-left'>
        <div className='flex flex-col gap-1'>
          <label htmlFor='email' className='text-xs text-zinc-500'>Email</label>
          <Input id='email' type='email' name='email' placeholder='tu@email.com' required autoFocus className={inputClass} />
        </div>

        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <label htmlFor='password' className='text-xs text-zinc-500'>Contraseña</label>
            {mode === 'login' && (
              <Link href='/forgot-password' className='text-xs text-zinc-600 transition-colors hover:text-[#1a7a45]'>
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              name='password'
              placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : '••••••••'}
              required
              className={`${inputClass} pr-10`}
            />
            <button
              type='button'
              onClick={() => setShowPassword((v) => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-400'
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94' />
                  <path d='M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19' />
                  <line x1='1' y1='1' x2='23' y2='23' />
                </svg>
              ) : (
                <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                  <circle cx='12' cy='12' r='3' />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p
            className={[
              'rounded-md px-3 py-2 text-xs',
              error.includes('pendiente de activación')
                ? 'bg-amber-950/60 text-amber-300'
                : 'bg-red-950 text-red-400',
            ].join(' ')}
          >
            {error}
          </p>
        )}

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
              {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
            </span>
          ) : mode === 'login' ? (
            'Iniciar sesión'
          ) : (
            'Crear cuenta gratis'
          )}
        </Button>
      </form>

      <p className='text-sm text-zinc-600'>
        {mode === 'login' ? (
          <>
            ¿No tienes cuenta?{' '}
            <Link href='/signup' className='text-[#1a7a45] transition-colors hover:text-[#22c55e]'>
              Regístrate gratis
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{' '}
            <Link href='/login' className='text-[#1a7a45] transition-colors hover:text-[#22c55e]'>
              Inicia sesión
            </Link>
          </>
        )}
      </p>

      {mode === 'signup' && (
        <p className='text-xs text-zinc-700'>
          Al continuar, aceptas los{' '}
          <Link href='/legal/terminos' className='text-zinc-500 underline transition-colors hover:text-zinc-400'>
            Términos de uso
          </Link>{' '}
          y la{' '}
          <Link href='/legal/privacidad' className='text-zinc-500 underline transition-colors hover:text-zinc-400'>
            Política de privacidad
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function Logo() {
  return (
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
  );
}
