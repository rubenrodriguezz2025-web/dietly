import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Política de privacidad de Dietly. RGPD, encargado del tratamiento, sub-encargados declarados.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://dietly.es/legal/privacidad' },
};

export default function PoliticaPrivacidad() {
  return (
    <div className='mx-auto max-w-3xl py-10 pb-20'>
      <div className='mb-8'>
        <Link
          href='/'
          className='text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300'
        >
          ← Volver al inicio
        </Link>
      </div>

      <h1 className='mb-2 font-alt text-3xl font-bold text-zinc-100 lg:text-4xl'>
        Política de Privacidad
      </h1>
      <p className='text-sm text-zinc-500'>
        Última actualización: marzo de 2026
      </p>

      <div className='mt-10 flex flex-col gap-10 text-sm leading-relaxed text-zinc-400'>
        <LegalSection title='1. Responsable del tratamiento'>
          <p>
            El responsable del tratamiento de los datos personales recogidos a través de
            <strong className='text-zinc-200'> dietly.es</strong> es{' '}
            <strong className='text-zinc-200'>Dietly</strong> («nosotros», «nos» o «Dietly»).
          </p>
          <p className='mt-3'>
            Contacto de privacidad:{' '}
            <a href='mailto:privacidad@dietly.es' className='text-green-400 hover:underline'>
              privacidad@dietly.es
            </a>
          </p>
        </LegalSection>

        <LegalSection title='2. Dietly como encargado del tratamiento'>
          <p>
            Dietly actúa como <strong className='text-zinc-200'>encargado del tratamiento</strong>{' '}
            respecto a los datos de los pacientes que los nutricionistas introducen en la plataforma.
            El nutricionista es el <strong className='text-zinc-200'>responsable del tratamiento</strong>{' '}
            de esos datos, ya que es quien determina la finalidad y medios para tratar la información
            clínica de sus pacientes, de acuerdo con el RGPD (Art. 28).
          </p>
          <p className='mt-3'>
            Los datos de pacientes se procesan exclusivamente para prestar el servicio al nutricionista
            y no se utilizan con ninguna otra finalidad comercial.
          </p>
        </LegalSection>

        <LegalSection title='3. Qué datos recogemos'>
          <p>Recogemos los siguientes datos según el contexto:</p>
          <ul className='mt-3 flex flex-col gap-2 pl-4'>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Datos de registro:</strong> nombre completo, dirección
              de correo electrónico y contraseña (almacenada con hash seguro).
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Datos de perfil profesional:</strong> nombre de clínica,
              especialidad, logotipo y colores corporativos.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Datos de facturación:</strong> gestionados directamente
              por Stripe. Dietly no almacena datos de tarjetas bancarias.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Datos de pacientes:</strong> nombre, datos biométricos,
              historial clínico y planes nutricionales. Estos datos son responsabilidad del nutricionista
              como se indica en la sección 2.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Datos de uso:</strong> logs de acceso, páginas visitadas
              e interacciones con el servicio, de forma anonimizada.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title='4. Finalidad del tratamiento'>
          <ul className='flex flex-col gap-2 pl-4'>
            <li className='list-disc'>Prestación del servicio Dietly y sus funcionalidades.</li>
            <li className='list-disc'>Gestión de la suscripción y facturación.</li>
            <li className='list-disc'>
              Comunicaciones relacionadas con el servicio (actualizaciones, alertas de seguridad).
            </li>
            <li className='list-disc'>
              Mejora del producto mediante análisis agregados y anonimizados.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title='5. Base legal del tratamiento'>
          <ul className='flex flex-col gap-2 pl-4'>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Ejecución del contrato</strong> (Art. 6.1.b RGPD):
              para prestarte el servicio.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Cumplimiento de obligaciones legales</strong>{' '}
              (Art. 6.1.c RGPD): facturación y obligaciones fiscales.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Consentimiento</strong> (Art. 6.1.a RGPD):
              para comunicaciones de marketing, si lo has otorgado expresamente.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title='6. Plazo de conservación'>
          <p>
            Conservamos tus datos mientras mantengas tu cuenta activa. Si cancelas, eliminaremos
            tus datos en un plazo de 30 días, salvo obligación legal de conservación (p. ej.,
            documentación fiscal, 5 años según la Ley 58/2003 General Tributaria).
          </p>
          <p className='mt-3'>
            Puedes solicitar la eliminación anticipada de tus datos escribiendo a{' '}
            <a href='mailto:privacidad@dietly.es' className='text-green-400 hover:underline'>
              privacidad@dietly.es
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title='7. Destinatarios y encargados del tratamiento'>
          <p>
            Trabajamos con los siguientes proveedores que acceden a datos personales en calidad
            de encargados del tratamiento:
          </p>
          <ul className='mt-3 flex flex-col gap-2 pl-4'>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Supabase Inc.</strong> — alojamiento de base de
              datos y autenticación. Datos cifrados en reposo y en tránsito.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Stripe Inc.</strong> — procesamiento de pagos.
              Sujeto a PCI DSS.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Resend Inc.</strong> — envío de correos
              electrónicos transaccionales.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Anthropic PBC</strong> — generación de contenido
              con IA. Los datos se transmiten de forma anonimizada y no se utilizan para
              entrenar modelos.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Vercel Inc.</strong> — infraestructura de hosting
              y despliegue.
            </li>
          </ul>
          <p className='mt-3'>
            No vendemos ni cedemos datos personales a terceros para finalidades propias.
          </p>
        </LegalSection>

        <LegalSection title='8. Tus derechos'>
          <p>
            De acuerdo con el RGPD y la LOPDGDD, tienes derecho a:
          </p>
          <ul className='mt-3 flex flex-col gap-2 pl-4'>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Acceso</strong> — conocer qué datos tratamos sobre ti.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Rectificación</strong> — corregir datos inexactos.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Supresión («derecho al olvido»)</strong> — eliminar
              tus datos cuando no sean necesarios (Art. 17 RGPD).
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Portabilidad</strong> — recibir tus datos en formato
              estructurado y legible por máquina (Art. 20 RGPD).
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>Oposición y limitación</strong> del tratamiento en
              determinadas circunstancias.
            </li>
          </ul>
          <p className='mt-3'>
            Para ejercer cualquiera de estos derechos, usa nuestro{' '}
            <a href='/derechos-datos' className='text-green-400 hover:underline'>
              formulario de derechos RGPD
            </a>{' '}
            o escríbenos a{' '}
            <a href='mailto:privacidad@dietly.es' className='text-green-400 hover:underline'>
              privacidad@dietly.es
            </a>{' '}
            con el asunto «Derechos RGPD». Responderemos en un plazo máximo de 30 días.
          </p>
          <p className='mt-3'>
            Si no quedas satisfecho con nuestra respuesta, puedes reclamar ante la{' '}
            <strong className='text-zinc-300'>
              Agencia Española de Protección de Datos (AEPD)
            </strong>{' '}
            en{' '}
            <a href='https://www.aepd.es' className='text-green-400 hover:underline' target='_blank' rel='noopener noreferrer'>
              www.aepd.es
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title='9. Cookies'>
          <p>
            Dietly usa únicamente cookies técnicas necesarias para el funcionamiento del servicio
            (sesión de usuario, preferencias). No utilizamos cookies de rastreo publicitario ni
            cookies de terceros para análisis de comportamiento sin tu consentimiento.
          </p>
        </LegalSection>

        <LegalSection title='10. Seguridad'>
          <p>
            Aplicamos medidas técnicas y organizativas adecuadas: cifrado en reposo y en tránsito
            (TLS 1.2+), autenticación segura, control de acceso basado en roles, y auditorías
            periódicas de seguridad. En caso de brecha de seguridad que afecte a tus derechos,
            notificaremos a la AEPD y a los afectados en los plazos que establece el RGPD.
          </p>
        </LegalSection>

        <LegalSection title='11. Cambios en esta política'>
          <p>
            Podemos actualizar esta política para reflejar cambios legales o en el servicio.
            Te notificaremos por email con al menos 15 días de antelación ante cambios sustanciales.
          </p>
        </LegalSection>

        <div className='mt-4 rounded-xl border border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 p-5 text-xs text-zinc-500'>
          ¿Tienes preguntas sobre privacidad?{' '}
          <a href='mailto:privacidad@dietly.es' className='text-zinc-400 hover:underline'>
            privacidad@dietly.es
          </a>
          {' · '}
          <Link href='/legal/terminos' className='text-zinc-400 hover:underline'>
            Términos y condiciones
          </Link>
        </div>
      </div>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className='mb-3 font-alt text-base font-semibold text-zinc-200'>{title}</h2>
      {children}
    </div>
  );
}
