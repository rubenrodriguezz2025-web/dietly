import type { Metadata } from 'next';

import { DataRightsForm } from './form';

export const metadata: Metadata = {
  title: 'Derechos sobre tus datos — Dietly',
  description:
    'Ejerce tus derechos RGPD: acceso, rectificación, supresión, portabilidad, limitación y oposición al tratamiento de tus datos personales.',
};

export default function DerechosDatosPage() {
  return (
    <div className='min-h-screen bg-zinc-950 px-4 py-12 sm:px-6'>
      <div className='mx-auto max-w-2xl'>
        {/* Header */}
        <div className='mb-8'>
          <div className='mb-4 flex items-center gap-2'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='text-zinc-500'
              aria-hidden='true'
            >
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
            <span className='text-xs font-medium uppercase tracking-wider text-zinc-600'>
              RGPD · Privacidad
            </span>
          </div>
          <h1 className='text-2xl font-bold text-zinc-100'>Tus derechos sobre tus datos</h1>
          <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
            Conforme al Reglamento General de Protección de Datos (RGPD), tienes derecho a
            controlar cómo se usan tus datos de salud. Usa este formulario para ejercer
            cualquiera de los derechos reconocidos en los artículos 15 a 22 del RGPD.
          </p>
        </div>

        {/* Info legal */}
        <div className='mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4'>
          <ul className='flex flex-col gap-2 text-xs text-zinc-500'>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 flex-shrink-0 text-zinc-700'>→</span>
              <span>
                <strong className='text-zinc-400'>Responsable del tratamiento:</strong> el
                nutricionista o clínica que gestiona tu plan nutricional.
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 flex-shrink-0 text-zinc-700'>→</span>
              <span>
                <strong className='text-zinc-400'>Plazo de respuesta:</strong> 30 días naturales
                desde la recepción de tu solicitud (Art. 12.3 RGPD).
              </span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='mt-0.5 flex-shrink-0 text-zinc-700'>→</span>
              <span>
                Si no recibes respuesta en plazo, puedes reclamar ante la{' '}
                <strong className='text-zinc-400'>AEPD</strong> en{' '}
                <span className='text-zinc-500'>aepd.es</span>.
              </span>
            </li>
          </ul>
        </div>

        {/* Formulario */}
        <div className='rounded-xl border border-zinc-800 bg-zinc-900/30 p-6'>
          <DataRightsForm />
        </div>
      </div>
    </div>
  );
}
