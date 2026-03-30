'use client';

import { useState, useTransition } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NutritionPlan, Patient, PatientProgress } from '@/types/dietly';
import { calcTargets } from '@/utils/calc-targets';
import { cn } from '@/utils/cn';

import { sendFollowupQuestionnaire } from './followup-patient-actions';
import { PatientCuestionarioTab } from './PatientCuestionarioTab';
import { PatientFichaTab } from './PatientFichaTab';
import { PatientProgresoTab } from './PatientProgresoTab';
import { PatientSeguimientosTab } from './PatientSeguimientosTab';

// ── Constantes de las preguntas del cuestionario (solo usadas en el Sheet) ────

const INTAKE_QUESTIONS: { q: string; type: 'Hora' | 'Selección' | 'Texto libre' }[] = [
  { q: '¿A qué hora sueles desayunar, comer y cenar?', type: 'Hora' },
  { q: '¿Cuántas veces al día prefieres comer?', type: 'Selección' },
  { q: '¿Hay alimentos que no te gusten o que evites?', type: 'Texto libre' },
  { q: '¿Tienes alguna alergia o intolerancia alimentaria?', type: 'Texto libre' },
  { q: '¿Con qué frecuencia comes fuera de casa?', type: 'Selección' },
  { q: '¿Cuánto tiempo dedicas a cocinar habitualmente?', type: 'Selección' },
  { q: '¿Realizas actividad física? ¿Con qué frecuencia?', type: 'Selección' },
  { q: '¿Sigues algún tipo de dieta especial (vegana, sin gluten, etc.)?', type: 'Texto libre' },
  { q: '¿Tienes alguna condición médica relevante que debamos tener en cuenta?', type: 'Texto libre' },
  { q: '¿Hay algo más que quieras contarle a tu nutricionista?', type: 'Texto libre' },
];

const TYPE_BADGE: Record<string, string> = {
  'Hora':        'bg-sky-950 text-sky-400',
  'Selección':   'bg-violet-950 text-violet-400',
  'Texto libre': 'bg-zinc-800 text-zinc-400',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

type Props = {
  patient: Patient;
  plans: NutritionPlan[] | null;
  progress: PatientProgress[];
  intakeForm: { answers: Record<string, string>; completed_at: string; filled_by?: string } | null;
  intakeUrl: string | null;
  followupForms?: FollowupFormData[];
  nextReminder?: NextReminderData;
  overdueReminder?: { id: string; remind_at: string } | null;
};

// ── Orquestador ───────────────────────────────────────────────────────────────

export function PatientTabs({
  patient,
  plans,
  progress,
  intakeForm,
  intakeUrl,
  followupForms = [],
  nextReminder,
  overdueReminder,
}: Props) {
  const [activeTab, setActiveTab] = useState('ficha');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [intakeSheetOpen, setIntakeSheetOpen] = useState(false);
  const [followupSheetOpen, setFollowupSheetOpen] = useState(false);
  const [sendingFollowup, startFollowupTransition] = useTransition();
  const [followupSendError, setFollowupSendError] = useState<string | null>(null);
  const [followupSent, setFollowupSent] = useState(false);

  const patientTargets = (() => {
    try { return calcTargets(patient); } catch { return null; }
  })();

  const age = patient.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(patient.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  function handleSendFollowup() {
    if (!patient.email) return;
    setFollowupSendError(null);
    startFollowupTransition(async () => {
      const result = await sendFollowupQuestionnaire(
        patient.id,
        patient.email as string,
        patient.name,
      );
      if (result.error) {
        setFollowupSendError(result.error);
      } else {
        setFollowupSent(true);
        setFollowupSheetOpen(false);
      }
    });
  }

  const triggerClass = cn(
    'relative rounded-none border-b-2 border-transparent px-4 py-3',
    'text-sm font-medium text-zinc-500 shadow-none transition-colors duration-150',
    'hover:text-zinc-300',
    'data-[state=active]:border-[#1a7a45] data-[state=active]:bg-transparent data-[state=active]:text-zinc-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-inset',
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* ── Tab bar ── */}
      <TabsList className='h-auto w-full justify-start gap-0 rounded-none border-b border-zinc-800/70 bg-transparent p-0'>
        <TabsTrigger value='ficha' className={triggerClass}>
          Ficha
        </TabsTrigger>
        <TabsTrigger value='progreso' className={triggerClass}>
          Progreso
        </TabsTrigger>
        <TabsTrigger value='cuestionario' className={triggerClass}>
          Cuestionario
        </TabsTrigger>
        <TabsTrigger value='seguimientos' className={cn(triggerClass, 'relative')}>
          Seguimientos
          {overdueReminder && (
            <span className='ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500' />
          )}
          {!overdueReminder && nextReminder && (
            <span className='ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500' />
          )}
        </TabsTrigger>
      </TabsList>

      {/* ── Ficha ── */}
      <TabsContent value='ficha' className='mt-6'>
        <PatientFichaTab
          patient={patient}
          plans={plans}
          intakeForm={intakeForm}
          intakeUrl={intakeUrl}
          patientTargets={patientTargets}
          age={age}
          onGoToCuestionario={() => setActiveTab('cuestionario')}
          onOpenQuestionsPreview={() => setSheetOpen(true)}
        />
      </TabsContent>

      {/* ── Progreso ── */}
      <TabsContent value='progreso' className='mt-6'>
        <PatientProgresoTab
          progress={progress}
          patientId={patient.id}
          patientName={patient.name}
        />
      </TabsContent>

      {/* ── Cuestionario ── */}
      <TabsContent value='cuestionario' className='mt-6'>
        <PatientCuestionarioTab
          patient={patient}
          intakeForm={intakeForm}
          intakeUrl={intakeUrl}
          intakeSheetOpen={intakeSheetOpen}
          onIntakeSheetOpenChange={setIntakeSheetOpen}
        />
      </TabsContent>

      {/* ── Seguimientos ── */}
      <TabsContent value='seguimientos' className='mt-6'>
        <PatientSeguimientosTab
          patient={patient}
          followupForms={followupForms}
          nextReminder={nextReminder ?? null}
          overdueReminder={overdueReminder ?? null}
          followupSent={followupSent}
          sendingFollowup={sendingFollowup}
          followupSendError={followupSendError}
          followupSheetOpen={followupSheetOpen}
          onFollowupSheetOpenChange={setFollowupSheetOpen}
          onSendFollowup={handleSendFollowup}
        />
      </TabsContent>

      {/* ── Sheet: preview preguntas del cuestionario de inicio ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex w-full flex-col border-zinc-800 bg-zinc-950 sm:max-w-md'>
          <SheetHeader className='border-b border-zinc-800 pb-4'>
            <SheetTitle className='text-zinc-100'>Preguntas del cuestionario</SheetTitle>
            <SheetDescription className='text-zinc-500'>
              10 preguntas que recibirá el paciente para completar su perfil nutricional.
            </SheetDescription>
          </SheetHeader>

          <ol className='flex flex-1 flex-col gap-4 overflow-y-auto py-5'>
            {INTAKE_QUESTIONS.map(({ q, type }, i) => (
              <li key={i} className='flex gap-3'>
                <span className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold tabular-nums text-zinc-500'>
                  {i + 1}
                </span>
                <div className='flex flex-1 flex-col gap-1.5'>
                  <p className='text-[13px] leading-snug text-zinc-200'>{q}</p>
                  <span
                    className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[type]}`}
                  >
                    {type}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          {intakeUrl && (
            <div className='border-t border-zinc-800 pt-4'>
              <button
                type='button'
                onClick={() => {
                  setSheetOpen(false);
                  setActiveTab('cuestionario');
                }}
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a7a45] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#155f38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:bg-[#0f4a2c]'
              >
                Enviar cuestionario al paciente
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
          )}
        </SheetContent>
      </Sheet>
    </Tabs>
  );
}
