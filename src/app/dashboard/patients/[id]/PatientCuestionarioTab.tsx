'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Patient } from '@/types/dietly';

import { CopyButton } from './copy-button';
import { DashboardIntakeForm } from './dashboard-intake-form';
import { DataField, Section } from './patient-shared';

const INTAKE_LABELS: Record<string, string> = {
  comidas_al_dia:         'Comidas al día',
  hora_desayuno:          'Hora desayuno',
  hora_almuerzo:          'Hora almuerzo',
  hora_merienda:          'Hora merienda',
  hora_cena:              'Hora cena',
  alergias_intolerancias: 'Alergias e intolerancias',
  alimentos_no_gustados:  'Alimentos que no le gustan',
  come_fuera:             '¿Come fuera de casa?',
  frecuencia_fuera:       'Frecuencia comer fuera',
  cocina_en_casa:         '¿Cocina en casa?',
  actividad_fisica:       'Actividad física',
  objetivo_personal:      'Objetivo personal',
  dieta_especial:         'Dieta especial',
  condicion_medica:       'Condición médica',
  observaciones:          'Observaciones',
};

export type PatientCuestionarioTabProps = {
  patient: Patient;
  intakeForm: { answers: Record<string, string>; completed_at: string; filled_by?: string } | null;
  intakeUrl: string | null;
  intakeSheetOpen: boolean;
  onIntakeSheetOpenChange: (open: boolean) => void;
  onSendToPatient: () => void;
};

export function PatientCuestionarioTab({
  patient,
  intakeForm,
  intakeUrl,
  intakeSheetOpen,
  onIntakeSheetOpenChange,
  onSendToPatient,
}: PatientCuestionarioTabProps) {
  return (
    <>
      <Section title='Cuestionario de salud (intake)'>
        {intakeForm ? (
          /* ── Cuestionario completado ── */
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <span className='flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400'>
                  <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
                  {intakeForm.filled_by === 'nutritionist'
                    ? 'Completado en consulta'
                    : 'Completado por el paciente'}
                </span>
                <span className='text-xs text-zinc-600'>
                  {new Date(intakeForm.completed_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <button
                type='button'
                onClick={() => onIntakeSheetOpenChange(true)}
                className='flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200'
              >
                <svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                  <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                </svg>
                Editar respuestas
              </button>
            </div>

            <div className='grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3'>
              {Object.entries(intakeForm.answers).map(([key, value]) =>
                value ? (
                  <DataField
                    key={key}
                    label={INTAKE_LABELS[key] ?? key.replace(/_/g, ' ')}
                    value={String(value)}
                  />
                ) : null,
              )}
            </div>
          </div>
        ) : (
          /* ── Cuestionario pendiente ── */
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-3 sm:flex-row'>
              {/* Rellenar ahora */}
              <button
                type='button'
                onClick={() => onIntakeSheetOpenChange(true)}
                className='group flex flex-1 flex-col items-center gap-2.5 rounded-xl border border-[#1a7a45]/40 bg-[#0a1f12] px-5 py-5 text-center transition-all duration-200 hover:border-[#1a7a45]/70 hover:bg-[#0d2716] active:scale-[0.99]'
              >
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#1a7a45]/20 text-emerald-400 transition-colors group-hover:bg-[#1a7a45]/30'>
                  <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                    <circle cx='9' cy='7' r='4' />
                    <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
                    <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                  </svg>
                </div>
                <div>
                  <p className='text-sm font-semibold text-zinc-100'>Rellenar ahora</p>
                  <p className='mt-0.5 text-xs text-zinc-500'>Rellénalo tú en consulta</p>
                </div>
              </button>

              {/* Enviar al paciente */}
              {intakeUrl && (
                <button
                  type='button'
                  onClick={onSendToPatient}
                  className='group flex flex-1 flex-col items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-5 text-center transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.99]'
                >
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-zinc-300'>
                    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                      <line x1='22' y1='2' x2='11' y2='13' />
                      <polygon points='22 2 15 22 11 13 2 9 22 2' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-zinc-300'>Enviar al paciente</p>
                    <p className='mt-0.5 text-xs text-zinc-600'>Link para rellenarlo desde casa</p>
                  </div>
                </button>
              )}
            </div>

            <p className='text-center text-xs text-zinc-600'>
              Rellénalo tú en consulta o envíaselo al paciente para que lo complete antes de la cita.
            </p>

            {intakeUrl && (
              <div className='flex flex-col gap-2'>
                <p className='text-xs text-zinc-600'>Enlace para el paciente:</p>
                <div className='flex items-center gap-2'>
                  <code className='flex-1 truncate rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400'>
                    {intakeUrl}
                  </code>
                  <CopyButton text={intakeUrl} />
                </div>
                <p className='text-[11px] text-zinc-700'>
                  El link incluye la cláusula de consentimiento IA que el paciente debe aceptar.
                </p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Sheet formulario de intake (nutricionista) */}
      <Sheet open={intakeSheetOpen} onOpenChange={onIntakeSheetOpenChange}>
        <SheetContent
          side='right'
          className='flex w-full flex-col gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 sm:max-w-xl'
        >
          <SheetHeader className='border-b border-zinc-800 px-6 py-5'>
            <SheetTitle className='text-zinc-100'>
              {intakeForm ? 'Editar cuestionario' : 'Rellenar cuestionario'}
            </SheetTitle>
            <SheetDescription className='text-zinc-500'>
              {intakeForm
                ? 'Actualiza las respuestas del paciente.'
                : `Rellena el cuestionario de salud de ${patient.name} en consulta.`}
            </SheetDescription>
          </SheetHeader>
          <div className='flex-1 overflow-y-auto px-6 py-5'>
            <DashboardIntakeForm
              patientId={patient.id}
              initialAnswers={intakeForm?.answers ?? null}
              onSuccess={() => onIntakeSheetOpenChange(false)}
              onCancel={() => onIntakeSheetOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
