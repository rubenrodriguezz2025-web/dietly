'use client';

import Link from 'next/link';

export default function ConsentimientoPage() {
  return (
    <div className='mx-auto max-w-2xl py-10 pb-20'>
      {/* Navegación — solo visible en pantalla */}
      <div className='mb-8 flex items-center justify-between print:hidden'>
        <Link
          href='/'
          className='text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300'
        >
          ← Volver al inicio
        </Link>
        <button
          onClick={() => window.print()}
          className='rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Documento imprimible */}
      <div className='rounded-2xl border border-zinc-800 bg-white p-10 text-zinc-900 print:rounded-none print:border-none print:p-0 dark:bg-zinc-950 dark:text-zinc-100'>
        {/* Cabecera */}
        <div className='mb-8 border-b border-zinc-200 pb-6 text-center print:border-zinc-400 dark:border-zinc-700'>
          <p className='text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400'>
            Documento de consentimiento informado
          </p>
          <h1 className='mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
            Autorización para el tratamiento de datos de salud
          </h1>
          <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
            Art. 9(2)(a) del Reglamento (UE) 2016/679 (RGPD)
          </p>
        </div>

        {/* Datos identificativos */}
        <section className='mb-8'>
          <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
            Datos del paciente
          </h2>
          <div className='flex flex-col gap-4'>
            <Field label='Nombre completo del paciente' />
            <Field label='DNI / NIE' />
            <Field label='Fecha de nacimiento' short />
          </div>
        </section>

        <section className='mb-8'>
          <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
            Datos del profesional
          </h2>
          <div className='flex flex-col gap-4'>
            <Field label='Nombre y apellidos del nutricionista' />
            <Field label='Número de colegiado' short />
            <Field label='Centro / Clínica (si aplica)' />
          </div>
        </section>

        {/* Cuerpo del consentimiento */}
        <section className='mb-8'>
          <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
            Objeto del consentimiento
          </h2>
          <div className='flex flex-col gap-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300'>
            <p>
              Mediante la firma del presente documento, el paciente identificado arriba autoriza
              expresamente al profesional a tratar sus datos personales de categoría especial
              (datos de salud) con la finalidad de elaborar, gestionar y hacer seguimiento de su
              plan nutricional personalizado.
            </p>
            <p>
              El tratamiento incluye el registro de información antropométrica (peso, talla,
              composición corporal), historial clínico relevante, restricciones alimentarias,
              alergias, intolerancias y objetivos de salud, así como el uso de herramientas
              digitales de asistencia para la elaboración del borrador del plan, que será
              revisado, adaptado y aprobado por el profesional antes de su entrega.
            </p>
            <p>
              Los datos serán tratados con confidencialidad estricta, no serán cedidos a
              terceros salvo obligación legal, y se aplicarán las medidas técnicas y
              organizativas adecuadas para garantizar su seguridad (Art. 32 RGPD).
            </p>
          </div>
        </section>

        <section className='mb-8'>
          <h2 className='mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
            Derechos del interesado
          </h2>
          <div className='text-sm leading-relaxed text-zinc-700 dark:text-zinc-300'>
            <p className='mb-3'>
              El paciente puede ejercer en cualquier momento sus derechos de acceso,
              rectificación, supresión, limitación del tratamiento, portabilidad y oposición,
              dirigiéndose al profesional responsable. Asimismo, tiene derecho a revocar este
              consentimiento sin que ello afecte a la licitud del tratamiento previo a dicha
              revocación.
            </p>
            <p>
              En caso de conflicto no resuelto, puede presentar reclamación ante la Agencia
              Española de Protección de Datos (aepd.es).
            </p>
          </div>
        </section>

        {/* Declaración */}
        <section className='mb-10 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-700 print:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
          <p>
            <strong className='text-zinc-900 dark:text-zinc-100'>El paciente declara</strong>{' '}
            haber leído y comprendido la información anterior, y{' '}
            <strong className='text-zinc-900 dark:text-zinc-100'>
              PRESTA SU CONSENTIMIENTO LIBRE, INFORMADO, ESPECÍFICO E INEQUÍVOCO
            </strong>{' '}
            para que sus datos de salud sean tratados con la finalidad descrita.
          </p>
        </section>

        {/* Firmas */}
        <section>
          <div className='grid grid-cols-2 gap-8'>
            <SignatureBox label='Firma del paciente' />
            <SignatureBox label='Firma del profesional' />
          </div>
          <div className='mt-6 flex justify-center'>
            <div className='text-center'>
              <p className='mb-1 text-xs text-zinc-500 dark:text-zinc-400'>
                Lugar y fecha
              </p>
              <div className='mt-1 h-px w-64 border-b border-dashed border-zinc-400' />
              <p className='mt-1 text-xs text-zinc-400'>
                a ____ de _________________ de ________
              </p>
            </div>
          </div>
        </section>

        {/* Pie */}
        <div className='mt-10 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-400 print:border-zinc-400 dark:border-zinc-700'>
          <p>Conservar este documento durante el período de tratamiento y 5 años después de su finalización (Art. 17 RGPD).</p>
        </div>
      </div>

      {/* Nota informativa — solo pantalla */}
      <div className='mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 text-xs leading-relaxed text-zinc-500 print:hidden'>
        <strong className='text-zinc-400'>¿Cómo usar esta plantilla?</strong>
        <ol className='mt-2 flex flex-col gap-1 pl-4'>
          <li className='list-decimal'>Haz clic en «Imprimir / Guardar PDF» para generar el documento.</li>
          <li className='list-decimal'>Imprime una copia para cada paciente antes de la primera consulta.</li>
          <li className='list-decimal'>El paciente y el profesional firman el documento.</li>
          <li className='list-decimal'>Guarda el original firmado en tu archivo durante al menos 5 años.</li>
        </ol>
        <p className='mt-3'>
          Este documento cubre el consentimiento exigido por el Art. 9(2)(a) RGPD para el
          tratamiento de datos de salud. No sustituye al contrato de servicios profesionales.
        </p>
      </div>
    </div>
  );
}

function Field({ label, short = false }: { label: string; short?: boolean }) {
  return (
    <div className={short ? 'max-w-xs' : 'w-full'}>
      <label className='mb-1 block text-xs text-zinc-500 dark:text-zinc-400'>{label}</label>
      <div className='h-8 w-full border-b border-dashed border-zinc-400 dark:border-zinc-600' />
    </div>
  );
}

function SignatureBox({ label }: { label: string }) {
  return (
    <div className='text-center'>
      <p className='mb-2 text-xs text-zinc-500 dark:text-zinc-400'>{label}</p>
      <div className='mx-auto h-20 w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600' />
      <div className='mt-2 h-px border-b border-dashed border-zinc-400' />
      <p className='mt-1 text-xs text-zinc-400'>Nombre y DNI / Sello</p>
    </div>
  );
}
