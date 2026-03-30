import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Cookies — Dietly',
  description: 'Información sobre el uso de cookies en Dietly.',
};

export default function PoliticaCookiesPage() {
  return (
    <div className='mx-auto max-w-3xl px-6 py-16 text-zinc-300'>
      <h1 className='mb-2 text-3xl font-bold text-white'>Política de Cookies</h1>
      <p className='mb-10 text-sm text-zinc-500'>Última actualización: marzo 2026</p>

      <section className='mb-10'>
        <h2 className='mb-3 text-xl font-semibold text-white'>¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los
          visitas. Permiten que el sitio recuerde tus preferencias y acciones durante un período de tiempo.
        </p>
      </section>

      <section className='mb-10'>
        <h2 className='mb-4 text-xl font-semibold text-white'>Cookies que usamos</h2>

        <div className='mb-6 rounded-xl border border-zinc-800 p-5'>
          <h3 className='mb-1 font-semibold text-white'>1. Cookies esenciales</h3>
          <p className='mb-3 text-sm text-zinc-400'>
            Necesarias para el funcionamiento básico del servicio. No requieren tu consentimiento.
          </p>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-zinc-700 text-left text-zinc-400'>
                <th className='pb-2 pr-4'>Cookie</th>
                <th className='pb-2 pr-4'>Proveedor</th>
                <th className='pb-2 pr-4'>Finalidad</th>
                <th className='pb-2'>Duración</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800'>
              <tr>
                <td className='py-2 pr-4 font-mono text-xs text-zinc-300'>sb-*</td>
                <td className='py-2 pr-4'>Supabase</td>
                <td className='py-2 pr-4'>Sesión de autenticación del nutricionista</td>
                <td className='py-2'>Sesión / 1 semana</td>
              </tr>
              <tr>
                <td className='py-2 pr-4 font-mono text-xs text-zinc-300'>dietly_cookie_consent</td>
                <td className='py-2 pr-4'>Dietly</td>
                <td className='py-2 pr-4'>Guarda tu preferencia de cookies (localStorage)</td>
                <td className='py-2'>Indefinido</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className='rounded-xl border border-zinc-800 p-5'>
          <h3 className='mb-1 font-semibold text-white'>2. Cookies analíticas</h3>
          <p className='mb-3 text-sm text-zinc-400'>
            Nos ayudan a entender cómo se usa Dietly para mejorarlo. Solo se activan con tu consentimiento
            explícito.
          </p>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-zinc-700 text-left text-zinc-400'>
                <th className='pb-2 pr-4'>Cookie</th>
                <th className='pb-2 pr-4'>Proveedor</th>
                <th className='pb-2 pr-4'>Finalidad</th>
                <th className='pb-2'>Duración</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-800'>
              <tr>
                <td className='py-2 pr-4 font-mono text-xs text-zinc-300'>va_*</td>
                <td className='py-2 pr-4'>Vercel Analytics</td>
                <td className='py-2 pr-4'>
                  Páginas visitadas, tiempo en página, país de acceso (datos anonimizados)
                </td>
                <td className='py-2'>90 días</td>
              </tr>
            </tbody>
          </table>
          <p className='mt-3 text-xs text-zinc-500'>
            Vercel Analytics no usa identificadores de usuario ni fingerprinting. Los datos se agregan y
            anonomizan.{' '}
            <a
              href='https://vercel.com/docs/analytics/privacy-policy'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 hover:text-zinc-300'
            >
              Ver política de Vercel
            </a>
            .
          </p>
        </div>
      </section>

      <section className='mb-10'>
        <h2 className='mb-3 text-xl font-semibold text-white'>Gestión de preferencias</h2>
        <p className='mb-3'>
          Puedes cambiar tus preferencias en cualquier momento haciendo clic en{' '}
          <span className='text-white'>&ldquo;Preferencias de cookies&rdquo;</span> en el pie de página.
        </p>
        <p>
          También puedes desactivar las cookies directamente en la configuración de tu navegador, aunque esto
          puede afectar al funcionamiento del servicio.
        </p>
      </section>

      <section className='mb-10'>
        <h2 className='mb-3 text-xl font-semibold text-white'>Base legal</h2>
        <p>
          El uso de cookies esenciales se basa en el <strong className='text-white'>interés legítimo</strong>{' '}
          (Art. 6.1.f RGPD) y en la necesidad contractual para prestar el servicio. Las cookies analíticas se
          basan en tu <strong className='text-white'>consentimiento explícito</strong> (Art. 6.1.a RGPD), que
          puedes retirar en cualquier momento.
        </p>
      </section>

      <section className='mb-10'>
        <h2 className='mb-3 text-xl font-semibold text-white'>Más información</h2>
        <p>
          Para más información sobre cómo tratamos tus datos, consulta nuestra{' '}
          <Link href='/legal/privacidad' className='text-white underline underline-offset-2 hover:text-green-400'>
            Política de Privacidad
          </Link>
          . Si tienes preguntas, escríbenos a{' '}
          <a href='mailto:hola@dietly.es' className='text-white underline underline-offset-2 hover:text-green-400'>
            hola@dietly.es
          </a>
          .
        </p>
      </section>
    </div>
  );
}
