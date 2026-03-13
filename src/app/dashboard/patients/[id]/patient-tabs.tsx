'use client';

import Link from 'next/link';

import { cn } from '@/utils/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  NutritionPlan,
  Patient,
  PatientProgress,
  PLAN_STATUS_LABELS,
  SEX_LABELS,
} from '@/types/dietly';

import { CopyButton } from './copy-button';
import { GenerateButton } from './generate-button';
import { ProgressTab } from './progress-tab';

// ── Reusable presentational helpers ──────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
      <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
        {title}
      </h2>
      {children}
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-zinc-600'>{label}</span>
      <span className='text-sm text-zinc-200'>
        {value ?? <span className='text-zinc-700'>—</span>}
      </span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-amber-950 text-amber-400',
  approved: 'bg-green-950 text-green-400',
  sent:     'bg-blue-950 text-blue-400',
};

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

// ── Tabs ─────────────────────────────────────────────────────────────────

type Props = {
  patient: Patient;
  plans: NutritionPlan[] | null;
  progress: PatientProgress[];
  intakeForm: { answers: Record<string, string>; completed_at: string } | null;
  intakeUrl: string | null;
};

export function PatientTabs({ patient, plans, progress, intakeForm, intakeUrl }: Props) {
  const age = patient.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(patient.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  const triggerClass = cn(
    'relative rounded-none border-b-2 border-transparent px-4 py-3',
    'text-sm font-medium text-zinc-500 shadow-none transition-colors duration-150',
    'hover:text-zinc-300',
    'data-[state=active]:border-[#1a7a45] data-[state=active]:bg-transparent data-[state=active]:text-zinc-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45] focus-visible:ring-inset',
  );

  return (
    <Tabs defaultValue='ficha'>
      {/* ── Tab bar ── */}
      <TabsList className='h-auto w-full gap-0 rounded-none border-b border-zinc-800/70 bg-transparent p-0 justify-start'>
        <TabsTrigger value='ficha' className={triggerClass}>
          Ficha
        </TabsTrigger>
        <TabsTrigger value='progreso' className={triggerClass}>
          Progreso
        </TabsTrigger>
        <TabsTrigger value='cuestionario' className={triggerClass}>
          Cuestionario
        </TabsTrigger>
      </TabsList>

      {/* ── Ficha ── */}
      <TabsContent value='ficha' className='mt-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Left: personal + goals + clinical notes */}
          <div className='flex flex-col gap-6 lg:col-span-2'>
            <Section title='Datos personales'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3'>
                <DataField label='Sexo' value={patient.sex ? SEX_LABELS[patient.sex] : null} />
                <DataField label='Edad' value={age ? `${age} años` : null} />
                <DataField
                  label='Fecha de nacimiento'
                  value={
                    patient.date_of_birth
                      ? new Date(patient.date_of_birth).toLocaleDateString('es-ES')
                      : null
                  }
                />
                <DataField
                  label='Peso'
                  value={patient.weight_kg ? `${patient.weight_kg} kg` : null}
                />
                <DataField
                  label='Altura'
                  value={patient.height_cm ? `${patient.height_cm} cm` : null}
                />
                <DataField
                  label='IMC'
                  value={
                    patient.weight_kg && patient.height_cm
                      ? `${(patient.weight_kg / Math.pow(patient.height_cm / 100, 2)).toFixed(1)}`
                      : null
                  }
                />
              </div>
            </Section>

            <Section title='Objetivos y actividad'>
              <div className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3'>
                <DataField
                  label='Objetivo'
                  value={patient.goal ? GOAL_LABELS[patient.goal] : null}
                />
                <DataField
                  label='Nivel de actividad'
                  value={
                    patient.activity_level ? ACTIVITY_LABELS[patient.activity_level] : null
                  }
                />
                <DataField label='TMB' value={patient.tmb ? `${patient.tmb} kcal` : null} />
                <DataField label='TDEE' value={patient.tdee ? `${patient.tdee} kcal` : null} />
              </div>
            </Section>

            {(patient.dietary_restrictions ||
              patient.allergies ||
              patient.intolerances ||
              patient.preferences ||
              patient.medical_notes) && (
              <Section title='Notas clínicas'>
                <div className='flex flex-col gap-4'>
                  {patient.dietary_restrictions && (
                    <DataField
                      label='Restricciones dietéticas'
                      value={patient.dietary_restrictions}
                    />
                  )}
                  {patient.allergies && (
                    <DataField label='Alergias' value={patient.allergies} />
                  )}
                  {patient.intolerances && (
                    <DataField label='Intolerancias' value={patient.intolerances} />
                  )}
                  {patient.preferences && (
                    <DataField label='Preferencias' value={patient.preferences} />
                  )}
                  {patient.medical_notes && (
                    <DataField label='Notas médicas' value={patient.medical_notes} />
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right: nutrition plans */}
          <div className='flex flex-col gap-4'>
            <h2 className='text-sm font-semibold uppercase tracking-wider text-zinc-500'>
              Planes nutricionales
            </h2>
            {!plans || plans.length === 0 ? (
              <div className='flex flex-col items-center rounded-xl border border-dashed border-zinc-800 py-10 text-center'>
                <p className='text-sm text-zinc-500'>Sin planes todavía.</p>
                <div className='mt-4'>
                  <GenerateButton patientId={patient.id} />
                </div>
              </div>
            ) : (
              <div className='flex flex-col gap-2'>
                {plans.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* ── Progreso ── */}
      <TabsContent value='progreso' className='mt-6'>
        <ProgressTab
          progress={progress}
          patientId={patient.id}
          patientName={patient.name}
        />
      </TabsContent>

      {/* ── Cuestionario ── */}
      <TabsContent value='cuestionario' className='mt-6'>
        <Section title='Cuestionario de salud (intake)'>
          {intakeForm ? (
            <div className='flex flex-col gap-4'>
              <p className='text-sm text-zinc-400'>
                Enviado el{' '}
                {new Date(intakeForm.completed_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
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
            <div className='flex flex-col gap-3'>
              <p className='text-sm text-zinc-500'>
                El paciente aún no ha rellenado el cuestionario.
              </p>
              {intakeUrl && (
                <div className='flex flex-col gap-2'>
                  <p className='text-xs text-zinc-600'>Envía este enlace al paciente:</p>
                  <div className='flex items-center gap-2'>
                    <code className='flex-1 truncate rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300'>
                      {intakeUrl}
                    </code>
                    <CopyButton text={intakeUrl} />
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
      </TabsContent>
    </Tabs>
  );
}

// ── Plan row ──────────────────────────────────────────────────────────────

function PlanRow({ plan }: { plan: NutritionPlan }) {
  return (
    <Link
      href={`/dashboard/plans/${plan.id}`}
      className='flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-600 hover:bg-zinc-900'
    >
      <div className='flex flex-col gap-1'>
        <span className='text-sm font-medium text-zinc-200'>
          Semana del{' '}
          {new Date(plan.week_start_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <span className='text-xs text-zinc-600'>
          {new Date(plan.created_at).toLocaleDateString('es-ES')}
        </span>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          STATUS_COLORS[plan.status] ?? 'bg-zinc-800 text-zinc-400'
        }`}
      >
        {PLAN_STATUS_LABELS[plan.status]}
      </span>
    </Link>
  );
}
