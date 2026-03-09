'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { markOnboardingComplete } from './actions';

type Props = {
  logoUploaded: boolean;
  hasPatient: boolean;
  hasPlan: boolean;
  firstPatientId?: string;
};

export function OnboardingChecklist({ logoUploaded, hasPatient, hasPlan, firstPatientId }: Props) {
  const [phase, setPhase] = useState<'checklist' | 'celebration' | 'done'>('checklist');

  const steps = [
    {
      label: 'Cuenta creada',
      complete: true,
      cta: null as string | null,
      href: null as string | null,
    },
    {
      label: 'Sube tu logo',
      complete: logoUploaded,
      cta: 'Subir logo →',
      href: '/dashboard/ajustes',
    },
    {
      label: 'Añade tu primer paciente',
      complete: hasPatient,
      cta: 'Añadir paciente →',
      href: '/dashboard/patients/new',
    },
    {
      label: 'Genera tu primer plan',
      complete: hasPlan,
      cta: 'Generar plan →',
      href: firstPatientId ? `/dashboard/patients/${firstPatientId}` : '/dashboard/patients/new',
    },
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const allComplete = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const activeIndex = steps.findIndex((s) => !s.complete);

  useEffect(() => {
    if (allComplete && phase === 'checklist') {
      markOnboardingComplete();
      setPhase('celebration');
      const t = setTimeout(() => setPhase('done'), 3000);
      return () => clearTimeout(t);
    }
  }, [allComplete, phase]);

  if (phase === 'done') return null;

  if (phase === 'celebration') {
    return (
      <div className='flex items-center gap-3 rounded-xl border border-[#1a7a45]/40 bg-[#0d1f12] px-5 py-4'>
        <span className='text-2xl' aria-hidden>🎉</span>
        <p className='text-sm font-semibold text-[#22c55e]'>
          ¡Listo! Ya tienes tu primer plan generado
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-[#1a7a45]/30 bg-[#0d1f12] p-5'>
      {/* Cabecera */}
      <div className='mb-4 flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold text-zinc-100'>Empieza en 3 pasos</p>
          <p className='mt-0.5 text-xs text-zinc-500'>Tu primer plan en menos de 15 minutos</p>
        </div>
        <span className='flex-shrink-0 text-xs font-medium text-[#22c55e]'>{completedCount}/4</span>
      </div>

      {/* Barra de progreso */}
      <div className='mb-5 h-1.5 overflow-hidden rounded-full bg-zinc-800'>
        <div
          className='h-full rounded-full bg-[#1a7a45] transition-all duration-500'
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pasos */}
      <ol className='flex flex-col gap-3'>
        {steps.map((step, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={step.label} className='flex items-center gap-3'>
              {/* Indicador */}
              {step.complete ? (
                <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1a7a45]'>
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='white'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='h-3.5 w-3.5'
                    aria-hidden
                  >
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                </span>
              ) : (
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive
                      ? 'border-[#1a7a45] bg-[#0d2918] text-[#22c55e]'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-600'
                  }`}
                >
                  {i + 1}
                </span>
              )}

              {/* Texto + CTA */}
              <div className='flex min-w-0 flex-1 items-center justify-between gap-3'>
                <span
                  className={`text-sm ${
                    step.complete
                      ? 'text-zinc-600 line-through'
                      : isActive
                        ? 'font-medium text-zinc-100'
                        : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </span>
                {isActive && step.cta && step.href && (
                  <Link
                    href={step.href}
                    className='flex-shrink-0 rounded-lg bg-[#1a7a45] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black'
                  >
                    {step.cta}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
