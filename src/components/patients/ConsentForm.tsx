'use client';

import { useState } from 'react';

/**
 * Versión del texto de consentimiento. Incrementar cuando cambie el contenido
 * del aviso — permite auditar qué texto leyó el nutricionista en cada registro.
 */
export const CONSENT_TEXT_VERSION = 'v3-2026-04-02';

/**
 * Sección de consentimiento informado para el tratamiento de datos de salud
 * del paciente mediante IA, conforme al RGPD Art. 9(2)(a).
 *
 * Renderiza los puntos de información obligatorios y el checkbox de aceptación.
 * Debe estar dentro de un <form> — escribe los campos `ai_consent` y
 * `ai_consent_version` en el FormData del formulario padre.
 */
export function ConsentForm({ disabled }: { disabled?: boolean }) {
  const [checked, setChecked] = useState(false);

  return (
    <section className='flex flex-col gap-4 rounded-xl border border-amber-700/40 bg-amber-950/10 p-5'>
      {/* Encabezado */}
      <div className='flex items-start gap-3'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='mt-0.5 flex-shrink-0 text-amber-500'
          aria-hidden='true'
        >
          <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
        </svg>
        <div>
          <p className='text-sm font-semibold text-zinc-200'>
            Consentimiento para tratamiento de datos de salud
          </p>
          <p className='mt-0.5 text-xs text-zinc-500'>
            RGPD Art. 9(2)(a) — Categoría especial de datos · Versión {CONSENT_TEXT_VERSION}
          </p>
        </div>
      </div>

      {/* Puntos de información */}
      <ul className='flex flex-col gap-3'>
        <li className='flex items-start gap-2.5'>
          <span className='mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400'>
            1
          </span>
          <p className='text-sm leading-relaxed text-zinc-400'>
            Los datos de salud del paciente (peso, edad, patologías, alergias e intolerancias)
            serán procesados de forma <strong className='text-zinc-300'>pseudonimizada</strong>{' '}
            mediante herramientas digitales de asistencia para generar automáticamente un{' '}
            <strong className='text-zinc-300'>borrador</strong> de plan nutricional personalizado.
          </p>
        </li>

        <li className='flex items-start gap-2.5'>
          <span className='mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400'>
            2
          </span>
          <p className='text-sm leading-relaxed text-zinc-400'>
            El borrador generado por la IA será{' '}
            <strong className='text-zinc-300'>
              revisado y aprobado por el nutricionista responsable
            </strong>{' '}
            antes de ser entregado al paciente. La responsabilidad clínica recae
            en el profesional, no en el sistema de IA.
          </p>
        </li>

        <li className='flex items-start gap-2.5'>
          <span className='mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400'>
            3
          </span>
          <p className='text-sm leading-relaxed text-zinc-400'>
            El paciente puede{' '}
            <strong className='text-zinc-300'>revocar este consentimiento en cualquier momento</strong>{' '}
            comunicándoselo a su nutricionista. La revocación impedirá la generación de nuevos planes
            con IA, sin afectar a los ya entregados.
          </p>
        </li>
      </ul>

      {/* Separador */}
      <div className='border-t border-zinc-800' />

      {/* Checkbox de aceptación */}
      <label className='flex cursor-pointer items-start gap-3'>
        {/* Campo oculto para la versión del texto */}
        <input type='hidden' name='ai_consent_version' value={CONSENT_TEXT_VERSION} />

        <input
          type='checkbox'
          name='ai_consent'
          value='granted'
          required
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          disabled={disabled}
          className='mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-zinc-600 bg-zinc-800 accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'
          aria-describedby='consent-description'
        />
        <span id='consent-description' className='text-sm leading-relaxed text-zinc-300'>
          Confirmo que tengo el consentimiento del paciente para tratar sus datos de salud.
          <span className='ml-1 text-red-400' aria-hidden='true'>*</span>
        </span>
      </label>
    </section>
  );
}
