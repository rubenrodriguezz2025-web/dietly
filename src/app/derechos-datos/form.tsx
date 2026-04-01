'use client';

import { useState } from 'react';

const REQUEST_TYPES = [
  {
    value: 'access',
    label: 'Acceso',
    description: 'Solicitar una copia de todos mis datos personales',
  },
  {
    value: 'rectification',
    label: 'Rectificación',
    description: 'Corregir datos incorrectos o incompletos',
  },
  {
    value: 'erasure',
    label: 'Supresión',
    description: 'Eliminar todos mis datos del sistema ("derecho al olvido")',
  },
  {
    value: 'restriction',
    label: 'Limitación',
    description: 'Suspender temporalmente el tratamiento de mis datos',
  },
  {
    value: 'portability',
    label: 'Portabilidad',
    description: 'Recibir mis datos en formato estructurado (JSON)',
  },
  {
    value: 'objection',
    label: 'Oposición',
    description: 'Oponerme al tratamiento de mis datos para un fin concreto',
  },
] as const;

type State = 'idle' | 'submitting' | 'success' | 'not_found' | 'error';

export function DataRightsForm() {
  const [state, setState] = useState<State>('idle');
  const [selectedType, setSelectedType] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      request_type: selectedType,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value.trim(),
    };

    try {
      const res = await fetch('/api/data-rights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (res.status === 404) {
        setState('not_found');
      } else if (!res.ok) {
        setState('error');
        setErrorMsg(json.error ?? 'Error desconocido');
      } else {
        setState('success');
      }
    } catch {
      setState('error');
      setErrorMsg('Error de red. Comprueba tu conexión e inténtalo de nuevo.');
    }
  }

  if (state === 'success') {
    return (
      <div className='rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-6 py-8 text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/50'>
          <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='text-emerald-400' aria-hidden='true'>
            <polyline points='20 6 9 17 4 12' />
          </svg>
        </div>
        <h2 className='mb-2 text-lg font-semibold text-zinc-100'>Solicitud registrada</h2>
        <p className='text-sm leading-relaxed text-zinc-400'>
          Tu solicitud ha sido enviada al profesional responsable de tus datos.
          El plazo legal de respuesta es de <strong className='text-zinc-300'>30 días naturales</strong>.
        </p>
        <p className='mt-3 text-xs text-zinc-600'>
          Si no recibes respuesta en ese plazo, puedes presentar una reclamación ante la{' '}
          <strong className='text-zinc-500'>AEPD</strong> (aepd.es).
        </p>
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className='rounded-xl border border-zinc-700 bg-zinc-800/40 px-6 py-8 text-center'>
        <p className='text-sm leading-relaxed text-zinc-400'>
          No hemos encontrado datos asociados a ese email en nuestro sistema.
        </p>
        <p className='mt-2 text-xs text-zinc-600'>
          Si crees que es un error, contacta directamente con tu nutricionista o envía una
          reclamación a la AEPD (aepd.es).
        </p>
        <button
          type='button'
          onClick={() => setState('idle')}
          className='mt-4 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300'
        >
          Intentar con otro email
        </button>
      </div>
    );
  }

  const isPending = state === 'submitting';

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      {/* Datos de contacto */}
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='name' className='text-sm font-medium text-zinc-300'>
            Nombre completo <span className='text-red-500'>*</span>
          </label>
          <input
            id='name'
            name='name'
            type='text'
            required
            disabled={isPending}
            placeholder='Tu nombre y apellidos'
            className='h-10 rounded-lg border border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50'
          />
        </div>
        <div className='flex flex-col gap-1.5'>
          <label htmlFor='email' className='text-sm font-medium text-zinc-300'>
            Email <span className='text-red-500'>*</span>
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            disabled={isPending}
            placeholder='tu@email.com'
            className='h-10 rounded-lg border border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50'
          />
        </div>
      </div>

      {/* Tipo de derecho */}
      <div className='flex flex-col gap-2'>
        <span className='text-sm font-medium text-zinc-300'>
          Tipo de solicitud <span className='text-red-500'>*</span>
        </span>
        <div className='grid gap-2 sm:grid-cols-2'>
          {REQUEST_TYPES.map(({ value, label, description }) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                selectedType === value
                  ? 'border-emerald-700/60 bg-emerald-950/30'
                  : 'border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 hover:border-zinc-700'
              } ${isPending ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input
                type='radio'
                name='request_type'
                value={value}
                required
                checked={selectedType === value}
                onChange={() => setSelectedType(value)}
                disabled={isPending}
                className='mt-0.5 flex-shrink-0 accent-emerald-500'
              />
              <div>
                <p className='text-sm font-medium text-zinc-200'>{label}</p>
                <p className='mt-0.5 text-xs leading-snug text-zinc-500'>{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='notes' className='text-sm font-medium text-zinc-300'>
          Notas adicionales <span className='text-xs font-normal text-zinc-600'>(opcional)</span>
        </label>
        <textarea
          id='notes'
          name='notes'
          rows={3}
          disabled={isPending}
          placeholder='Especifica cualquier detalle relevante para tu solicitud...'
          className='resize-none rounded-lg border border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:opacity-50'
        />
      </div>

      {state === 'error' && (
        <p className='rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-2.5 text-sm text-red-400'>
          {errorMsg}
        </p>
      )}

      <button
        type='submit'
        disabled={isPending || !selectedType}
        className='self-end rounded-lg bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40'
      >
        {isPending ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
