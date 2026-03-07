'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';

const titleMap = {
  login: 'Accede a tu cuenta',
  signup: 'Empieza gratis con Dietly',
} as const;

const subtitleMap = {
  login: 'Bienvenido de nuevo. Introduce tu email para continuar.',
  signup: 'Genera planes nutricionales completos en 2 minutos. 14 días de prueba, sin tarjeta.',
} as const;

export function AuthUI({
  mode,
  signInWithOAuth: _signInWithOAuth,
  signInWithEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const response = await signInWithEmail(email);

    if (response?.error) {
      const msg = (response.error as { message?: string })?.message;
      console.error('[AuthUI] signInWithEmail error:', response.error);
      toast({
        variant: 'destructive',
        title: 'Error al enviar el enlace',
        description: msg ?? 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
      });
    } else {
      toast({
        description: `Revisa tu email. Te hemos enviado un enlace de acceso a: ${email}`,
      });
    }

    form.reset();
    setPending(false);
  }

  return (
    <section className='flex w-full flex-col gap-8 rounded-2xl border border-[#1a2e1a] bg-[#0d140d] p-8 text-center'>
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

      {/* Título */}
      <div className='flex flex-col gap-1.5'>
        <h1 className='text-lg font-semibold text-zinc-100'>{titleMap[mode]}</h1>
        <p className='text-sm text-zinc-500'>{subtitleMap[mode]}</p>
      </div>

      {/* Formulario email */}
      <form onSubmit={handleEmailSubmit} className='flex flex-col gap-3'>
        <Input
          type='email'
          name='email'
          placeholder='tu@email.com'
          aria-label='Tu email'
          required
          autoFocus
          className='border-[#1a2e1a] bg-[#0a0f0a] text-zinc-100 placeholder:text-zinc-600 focus:border-[#1a7a45] focus:ring-[#1a7a45]/30'
        />
        <Button
          type='submit'
          disabled={pending}
          className='w-full bg-[#1a7a45] font-semibold text-white hover:bg-[#22c55e] hover:text-black disabled:opacity-50'
        >
          {pending ? 'Enviando...' : mode === 'login' ? 'Continuar con email' : 'Crear cuenta gratis'}
        </Button>
      </form>

      {/* Enlace alternativo */}
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

      {/* Legal */}
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
