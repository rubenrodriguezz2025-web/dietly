'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Patient } from '@/types/dietly';

import { DataField, Section } from './patient-shared';

type FollowupFormData = {
  id: string;
  created_at: string;
  completed_at: string | null;
  answers: Record<string, string> | null;
};

type NextReminderData = {
  id: string;
  remind_at: string;
  status: string;
} | null;

const FOLLOWUP_QUESTIONS_PREVIEW = [
  '¿Has podido seguir el plan esta semana? (escala 0-10)',
  '¿Qué comidas o días te han resultado más difíciles?',
  '¿Cómo te has sentido en general?',
  '¿Has notado cambios en tu peso o cómo te queda la ropa?',
  '¿Has realizado actividad física?',
  '¿Hay alguna comida o receta que quieras cambiar?',
  '¿Ha cambiado algo en tu rutina u horarios?',
  '¿Tienes alguna duda o algo que quieras comentarle a tu nutricionista?',
];

const FOLLOWUP_ANSWERS_LABELS: Record<string, string> = {
  adherencia: '¿Has podido seguir el plan?',
  dificultades: 'Comidas o días difíciles',
  bienestar: 'Bienestar general',
  cambios_fisicos: 'Cambios físicos',
  actividad: 'Actividad física',
  cambios_recetas: 'Cambios en recetas',
  cambios_rutina: 'Cambios en rutina',
  dudas: 'Dudas y comentarios',
};

export type PatientSeguimientosTabProps = {
  patient: Patient;
  followupForms: FollowupFormData[];
  nextReminder: NextReminderData;
  overdueReminder: { id: string; remind_at: string } | null;
  followupSent: boolean;
  sendingFollowup: boolean;
  followupSendError: string | null;
  followupSheetOpen: boolean;
  onFollowupSheetOpenChange: (open: boolean) => void;
  onSendFollowup: () => void;
};

export function PatientSeguimientosTab({
  patient,
  followupForms,
  nextReminder,
  overdueReminder,
  followupSent,
  sendingFollowup,
  followupSendError,
  followupSheetOpen,
  onFollowupSheetOpenChange,
  onSendFollowup,
}: PatientSeguimientosTabProps) {
  return (
    <>
      <div className='flex flex-col gap-6'>
        {/* Estado del recordatorio */}
        {overdueReminder && (
          <div className='flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='15'
              height='15'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='flex-shrink-0 text-red-400'
              aria-hidden='true'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            <p className='text-sm text-red-400'>
              Revisión vencida el{' '}
              <span className='font-semibold'>
                {new Date(overdueReminder.remind_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </p>
          </div>
        )}

        {nextReminder && !overdueReminder && (
          <div className='flex items-center gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='15'
              height='15'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='flex-shrink-0 text-amber-400'
              aria-hidden='true'
            >
              <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
              <line x1='16' y1='2' x2='16' y2='6' />
              <line x1='8' y1='2' x2='8' y2='6' />
              <line x1='3' y1='10' x2='21' y2='10' />
            </svg>
            <p className='text-sm text-amber-400'>
              Próxima revisión programada:{' '}
              <span className='font-semibold'>
                {new Date(nextReminder.remind_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          </div>
        )}

        {/* Enviar cuestionario de seguimiento */}
        <Section title='Cuestionario de seguimiento'>
          {followupSent ? (
            <div className='flex items-center gap-2 text-sm text-emerald-400'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
              Cuestionario enviado correctamente
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              <p className='text-sm text-zinc-500'>
                Envía al paciente un cuestionario de 8 preguntas para evaluar cómo ha seguido el
                plan y detectar posibles ajustes.
              </p>
              {!patient.email && (
                <p className='text-xs text-amber-500'>
                  Este paciente no tiene email registrado. Añádelo en la ficha para poder enviar el cuestionario.
                </p>
              )}
              {followupSendError && (
                <p className='text-sm text-red-400'>{followupSendError}</p>
              )}
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  disabled={!patient.email || sendingFollowup}
                  onClick={onSendFollowup}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-[#1a7a45]/60 bg-[#1a7a45]/20 px-3 py-1.5 text-[12px] font-semibold text-emerald-400 transition-colors hover:border-[#1a7a45] hover:bg-[#1a7a45]/30 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45]'
                >
                  {sendingFollowup ? (
                    <>
                      <span className='h-3 w-3 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-400' />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar cuestionario de seguimiento
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='12'
                        height='12'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        aria-hidden='true'
                      >
                        <line x1='5' y1='12' x2='19' y2='12' />
                        <polyline points='12 5 19 12 12 19' />
                      </svg>
                    </>
                  )}
                </button>
                <button
                  type='button'
                  onClick={() => onFollowupSheetOpenChange(true)}
                  className='text-[12px] text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:underline'
                >
                  Ver preguntas →
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Historial de cuestionarios */}
        {followupForms.length > 0 && (
          <Section title='Historial de seguimientos'>
            <div className='flex flex-col gap-3'>
              {followupForms.map((form) => (
                <div
                  key={form.id}
                  className='rounded-xl border border-zinc-800 bg-zinc-900 p-4'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex flex-col gap-0.5'>
                      <p className='text-sm font-medium text-zinc-200'>
                        Cuestionario del{' '}
                        {new Date(form.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      {form.completed_at ? (
                        <p className='text-xs text-emerald-500'>
                          Completado el{' '}
                          {new Date(form.completed_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      ) : (
                        <p className='text-xs text-zinc-600'>Pendiente de respuesta</p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${form.completed_at ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}
                    >
                      {form.completed_at ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>

                  {form.completed_at && form.answers && (
                    <div className='mt-3 border-t border-zinc-800 pt-3'>
                      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                        {Object.entries(form.answers).map(([key, value]) =>
                          value !== null && value !== '' ? (
                            <DataField
                              key={key}
                              label={FOLLOWUP_ANSWERS_LABELS[key] ?? key.replace(/_/g, ' ')}
                              value={String(value)}
                            />
                          ) : null,
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {followupForms.length === 0 && !followupSent && (
          <div className='rounded-xl border border-dashed border-zinc-800 py-10 text-center'>
            <p className='text-sm text-zinc-600'>
              Aún no se ha enviado ningún cuestionario de seguimiento a este paciente.
            </p>
          </div>
        )}
      </div>

      {/* Sheet: preview preguntas del cuestionario de seguimiento */}
      <Sheet open={followupSheetOpen} onOpenChange={onFollowupSheetOpenChange}>
        <SheetContent className='flex w-full flex-col border-zinc-800 bg-zinc-950 sm:max-w-md'>
          <SheetHeader className='border-b border-zinc-800 pb-4'>
            <SheetTitle className='text-zinc-100'>Preguntas del cuestionario de seguimiento</SheetTitle>
            <SheetDescription className='text-zinc-500'>
              8 preguntas para evaluar cómo ha seguido el plan el paciente.
            </SheetDescription>
          </SheetHeader>

          <ol className='flex flex-1 flex-col gap-4 overflow-y-auto py-5'>
            {FOLLOWUP_QUESTIONS_PREVIEW.map((q, i) => (
              <li key={i} className='flex gap-3'>
                <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold tabular-nums text-zinc-500'>
                  {i + 1}
                </span>
                <p className='text-[13px] leading-snug text-zinc-200'>{q}</p>
              </li>
            ))}
          </ol>

          <div className='border-t border-zinc-800 pt-4'>
            <button
              type='button'
              disabled={!patient.email || sendingFollowup}
              onClick={() => {
                onFollowupSheetOpenChange(false);
                onSendFollowup();
              }}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a7a45] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#155f38] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
            >
              Enviar cuestionario →
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='13'
                height='13'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <line x1='5' y1='12' x2='19' y2='12' />
                <polyline points='12 5 19 12 12 19' />
              </svg>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
