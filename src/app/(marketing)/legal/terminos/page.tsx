import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones · Dietly',
  description: 'Condiciones de uso del servicio Dietly para nutricionistas y dietistas.',
};

export default function TerminosCondiciones() {
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
        Términos y Condiciones
      </h1>
      <p className='text-sm text-zinc-500'>
        Última actualización: marzo de 2026
      </p>

      <div className='mt-10 flex flex-col gap-10 text-sm leading-relaxed text-zinc-400'>
        <LegalSection title='1. Definiciones'>
          <ul className='flex flex-col gap-2 pl-4'>
            <li className='list-disc'>
              <strong className='text-zinc-300'>«Dietly»</strong>: el servicio de software como
              servicio (SaaS) accesible en dietly.es.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>«Usuario» o «Profesional»</strong>: nutricionista
              o dietista-nutricionista titulado que usa Dietly para gestionar su consulta.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>«Paciente»</strong>: persona cuyos datos son
              introducidos en Dietly por el Profesional.
            </li>
            <li className='list-disc'>
              <strong className='text-zinc-300'>«Plan nutricional»</strong>: borrador generado
              por IA que el Profesional revisa, aprueba y entrega a su paciente.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title='2. Naturaleza del servicio y marco legal'>
          <p>
            Dietly es una <strong className='text-zinc-200'>herramienta de asistencia profesional</strong>{' '}
            diseñada para nutricionistas y dietistas-nutricionistas titulados conforme a la{' '}
            <strong className='text-zinc-200'>Ley 44/2003, de 21 de noviembre</strong>, de
            Ordenación de las Profesiones Sanitarias.
          </p>
          <p className='mt-3'>
            Dietly genera borradores de planes nutricionales mediante inteligencia artificial.
            <strong className='text-zinc-200'>
              {' '}Estos borradores no son diagnósticos ni prescripciones médicas
            </strong>{' '}
            y deben ser revisados, validados y aprobados por un profesional titulado antes de
            ser entregados a ningún paciente. La responsabilidad del plan nutricional final
            recae exclusivamente en el Profesional.
          </p>
          <p className='mt-3'>
            El acceso a Dietly está reservado a profesionales con titulación habilitante en
            dietética y nutrición. El uso por personas no tituladas queda expresamente prohibido.
          </p>
        </LegalSection>

        <LegalSection title='3. Responsabilidades del usuario'>
          <div className='mb-4 rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4'>
            <p>
              El acceso a Dietly está reservado exclusivamente a{' '}
              <strong className='text-zinc-200'>
                dietistas-nutricionistas colegiados habilitados legalmente para ejercer en España
              </strong>
              . El usuario declara y garantiza tener la titulación y colegiación requeridas.
              Dietly no asume responsabilidad por el uso del servicio por parte de personas
              no habilitadas.
            </p>
          </div>
          <ul className='flex flex-col gap-2 pl-4'>
            <li className='list-disc'>
              Ser titular de la titulación profesional habilitante para ejercer la nutrición
              clínica en España (Ley 44/2003).
            </li>
            <li className='list-disc'>
              Revisar y aprobar con criterio profesional cada plan antes de entregarlo a un paciente.
              El estado de aprobación («approved») es el punto de no retorno legal.
            </li>
            <li className='list-disc'>
              Obtener el consentimiento informado RGPD de sus pacientes antes de introducir sus
              datos en Dietly. Dietly proporciona una plantilla orientativa descargable.
            </li>
            <li className='list-disc'>
              Mantener la confidencialidad de sus credenciales de acceso.
            </li>
            <li className='list-disc'>
              No usar Dietly para generar contenido ilegal, fraudulento o que pueda causar daño.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title='4. Planes, precios y facturación'>
          <p>
            Dietly ofrece los siguientes planes de suscripción mensual:
          </p>
          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='rounded-xl border border-zinc-800 bg-zinc-900/50 p-4'>
              <p className='font-semibold text-zinc-200'>Plan Básico</p>
              <p className='mt-1 text-2xl font-bold text-white'>46€<span className='text-sm font-normal text-zinc-500'>/mes</span></p>
              <ul className='mt-2 flex flex-col gap-1 text-xs text-zinc-500'>
                <li>Hasta 15 pacientes activos</li>
                <li>Generación de planes con IA</li>
                <li>PDF con logo de Dietly</li>
              </ul>
            </div>
            <div className='rounded-xl border border-green-900 bg-green-950/20 p-4'>
              <p className='font-semibold text-zinc-200'>Plan Profesional</p>
              <p className='mt-1 text-2xl font-bold text-white'>89€<span className='text-sm font-normal text-zinc-500'>/mes</span></p>
              <ul className='mt-2 flex flex-col gap-1 text-xs text-zinc-500'>
                <li>Pacientes ilimitados</li>
                <li>PDF con branding personalizado</li>
                <li>Todas las funcionalidades</li>
              </ul>
            </div>
          </div>
          <p className='mt-4'>
            Los precios incluyen IVA al 21% según la normativa fiscal española aplicable a
            servicios de software SaaS. La suscripción se renueva automáticamente cada mes.
          </p>
          <p className='mt-3'>
            Todos los planes incluyen un{' '}
            <strong className='text-zinc-200'>período de prueba gratuita de 14 días</strong>{' '}
            sin necesidad de tarjeta de crédito. Al finalizar el período de prueba, se solicitará
            un método de pago para continuar usando el servicio.
          </p>
        </LegalSection>

        <LegalSection title='5. Cancelación y reembolsos'>
          <p>
            Puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario
            («Gestionar suscripción»). La cancelación es efectiva al final del período de
            facturación en curso; no hay reembolsos proporcionales por días no utilizados.
          </p>
          <p className='mt-3'>
            En caso de error en la facturación por causas atribuibles a Dietly, emitiremos
            el reembolso correspondiente en un plazo de 10 días hábiles.
          </p>
        </LegalSection>

        <LegalSection title='6. Propiedad intelectual'>
          <p>
            Dietly y todos sus componentes (software, diseño, marca, documentación) son propiedad
            de Dietly y están protegidos por las leyes de propiedad intelectual aplicables.
          </p>
          <p className='mt-3'>
            Los planes nutricionales generados por la IA y aprobados por el Profesional son
            propiedad del Profesional. Dietly no reclama ningún derecho sobre el contenido
            profesional producido a través de la plataforma.
          </p>
          <p className='mt-3'>
            Los datos introducidos por el Profesional (fichas de pacientes, notas clínicas)
            son propiedad del Profesional en todo momento.
          </p>
        </LegalSection>

        <LegalSection title='7. Limitación de responsabilidad'>
          <p>
            Dietly proporciona el servicio «tal como está» y no garantiza que el servicio esté
            disponible de forma ininterrumpida. Nos comprometemos a una disponibilidad objetivo
            del 99,5% mensual, excluyendo mantenimientos programados notificados con 24 horas
            de antelación.
          </p>
          <p className='mt-3'>
            Dietly no será responsable de ningún daño derivado de:
          </p>
          <ul className='mt-2 flex flex-col gap-1 pl-4'>
            <li className='list-disc'>
              Decisiones clínicas tomadas por el Profesional basándose en los borradores generados.
            </li>
            <li className='list-disc'>
              Pérdida de datos debida a causas externas a nuestra infraestructura.
            </li>
            <li className='list-disc'>
              Interrupción del servicio de terceros (Supabase, Stripe, Anthropic, Vercel).
            </li>
          </ul>
          <p className='mt-3'>
            En todo caso, la responsabilidad máxima de Dietly quedará limitada al importe
            abonado por el Usuario en los últimos 3 meses.
          </p>
        </LegalSection>

        <LegalSection title='8. Protección de datos'>
          <p>
            El tratamiento de datos personales se rige por nuestra{' '}
            <Link href='/legal/privacidad' className='text-green-400 hover:underline'>
              Política de Privacidad
            </Link>
            , que forma parte integrante de estos Términos. Dietly actúa como encargado del
            tratamiento respecto a los datos de los pacientes introducidos por el Profesional,
            conforme al Art. 28 del RGPD.
          </p>
        </LegalSection>

        <LegalSection title='9. Cláusula de encargado del tratamiento (Art. 28.3 RGPD)' id='9-clausula-de-encargado'>
          <p>
            En virtud del Art. 28.3 del Reglamento (UE) 2016/679 (RGPD), Dietly, como encargado
            del tratamiento, se compromete expresamente a:
          </p>
          <ol className='mt-4 flex flex-col gap-3 pl-4'>
            <li>
              <span className='font-semibold text-zinc-300'>a) Instrucciones documentadas.</span>{' '}
              Tratar los datos personales únicamente siguiendo las instrucciones documentadas del
              Profesional (responsable del tratamiento), inclusive en lo que se refiere a las
              transferencias de datos a terceros países, salvo que exista obligación legal en
              contrario.
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>b) Confidencialidad del personal.</span>{' '}
              Garantizar que las personas autorizadas para tratar los datos personales se han
              comprometido a guardar confidencialidad o están sujetas a una obligación de
              confidencialidad de naturaleza estatutaria.
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>c) Medidas de seguridad (Art. 32 RGPD).</span>{' '}
              Tomar todas las medidas técnicas y organizativas de seguridad requeridas conforme
              al Art. 32 del RGPD, incluyendo cifrado en reposo (Supabase), cifrado en tránsito
              (TLS 1.2+), control de acceso por roles y auditoría de operaciones.
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>d) Sub-encargados.</span>{' '}
              No recurrir a otro encargado del tratamiento sin autorización previa y por escrito
              del responsable. En la actualidad, Dietly utiliza los siguientes sub-encargados,
              aprobados mediante la aceptación de estos Términos:
              <ul className='mt-2 flex flex-col gap-1.5 pl-4 text-zinc-500'>
                <li className='list-disc'>
                  <span className='text-zinc-400'>Supabase Inc.</span> — almacenamiento de base de datos
                  y autenticación (servidores en la UE, París / AWS eu-west-3).
                </li>
                <li className='list-disc'>
                  <span className='text-zinc-400'>Anthropic PBC</span> — generación de planes con IA
                  (EE. UU.; transferencia amparada en cláusulas contractuales tipo de la UE — SCCs).
                </li>
                <li className='list-disc'>
                  <span className='text-zinc-400'>Stripe Payments Europe, Ltd.</span> — procesamiento
                  de pagos (Irlanda, UE).
                </li>
                <li className='list-disc'>
                  <span className='text-zinc-400'>Vercel Inc.</span> — hosting e infraestructura
                  (EE. UU.; transferencia amparada en SCCs).
                </li>
                <li className='list-disc'>
                  <span className='text-zinc-400'>Resend Inc.</span> — envío de correo electrónico
                  transaccional (EE. UU.; transferencia amparada en SCCs).
                </li>
              </ul>
              <p className='mt-2'>
                Cualquier cambio de sub-encargado será notificado al Profesional con al menos
                30 días de antelación, permitiéndole oponerse. Si Dietly incorpora un nuevo
                sub-encargado sin objeción del Profesional, se considerará autorizado.
              </p>
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>e) Derechos ARCO.</span>{' '}
              Asistir al Profesional, mediante medidas técnicas y organizativas apropiadas, para
              que pueda cumplir con su obligación de responder a las solicitudes de ejercicio
              de derechos de los interesados (acceso, rectificación, supresión, portabilidad,
              limitación, oposición).
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>f) Notificación de brechas y EIPD (Arts. 32–36 RGPD).</span>{' '}
              Ayudar al Profesional a garantizar el cumplimiento de las obligaciones de seguridad,
              notificación de violaciones de seguridad a la autoridad de control y al interesado,
              evaluaciones de impacto relativas a la protección de datos (EIPD) y consulta previa,
              teniendo en cuenta la naturaleza del tratamiento y la información a disposición
              de Dietly.
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>g) Devolución o destrucción de datos.</span>{' '}
              A elección del Profesional, suprimir o devolver todos los datos personales una
              vez finalice la prestación del servicio (cancelación de la cuenta), suprimiendo
              las copias existentes salvo que el Derecho de la Unión o de los Estados miembros
              exija la conservación.
            </li>
            <li>
              <span className='font-semibold text-zinc-300'>h) Auditorías e inspecciones.</span>{' '}
              Poner a disposición del Profesional toda la información necesaria para demostrar el
              cumplimiento de las obligaciones establecidas en el Art. 28 RGPD, permitiendo y
              contribuyendo a la realización de auditorías, incluidas inspecciones. Cualquier
              solicitud de auditoría debe dirigirse a{' '}
              <a href='mailto:hola@dietly.es' className='text-green-400 hover:underline'>
                hola@dietly.es
              </a>
              .
            </li>
          </ol>
          <p className='mt-4 rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-3 text-xs text-zinc-500'>
            Esta cláusula constituye el contrato entre responsable (Profesional) y encargado
            (Dietly) exigido por el Art. 28.3 RGPD y sustituye cualquier acuerdo previo de
            encargo del tratamiento. La aceptación de estos Términos implica la firma de la
            presente cláusula.
          </p>
        </LegalSection>

        <LegalSection title='10. Modificación de los términos'>
          <p>
            Nos reservamos el derecho de modificar estos Términos. En caso de cambios
            sustanciales, notificaremos al Usuario con al menos 30 días de antelación por
            correo electrónico. El uso continuado del servicio tras esa fecha implica la
            aceptación de los nuevos términos.
          </p>
        </LegalSection>

        <LegalSection title='11. Ley aplicable y jurisdicción'>
          <p>
            Estos Términos se rigen por el Derecho español. Para cualquier controversia, las
            partes se someten a los Juzgados y Tribunales de España, con renuncia expresa a
            cualquier otro fuero que pudiera corresponderles.
          </p>
        </LegalSection>

        <div className='rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-xs text-zinc-500'>
          ¿Tienes preguntas legales?{' '}
          <a href='mailto:hola@dietly.es' className='text-zinc-400 hover:underline'>
            hola@dietly.es
          </a>
          {' · '}
          <Link href='/legal/privacidad' className='text-zinc-400 hover:underline'>
            Política de privacidad
          </Link>
          {' · '}
          <a href='#9-clausula-de-encargado' className='text-zinc-400 hover:underline'>
            Cláusula Art. 28.3 RGPD
          </a>
        </div>
      </div>
    </div>
  );
}

function LegalSection({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id}>
      <h2 className='mb-3 font-alt text-base font-semibold text-zinc-200'>{title}</h2>
      {children}
    </div>
  );
}
