import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  NutritionPlan,
  Patient,
  PLAN_STATUS_LABELS,
  SEX_LABELS,
} from '@/types/dietly';

import { GenerateButton } from './generate-button';

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: patient } = (await (supabase as any)
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()) as { data: Patient | null };

  if (!patient) notFound();

  const { data: plans } = (await (supabase as any)
    .from('nutrition_plans')
    .select('id, status, week_start_date, created_at')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })) as { data: NutritionPlan[] | null };

  const age = patient.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-medium text-zinc-300'>
            {patient.name
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <h1 className='text-2xl font-bold text-zinc-100'>{patient.name}</h1>
            {patient.email && <p className='mt-0.5 text-sm text-zinc-500'>{patient.email}</p>}
          </div>
        </div>
        <GenerateButton patientId={id} />
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Ficha del paciente */}
        <div className='flex flex-col gap-6 lg:col-span-2'>
          {/* Datos personales */}
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

          {/* Objetivos y actividad */}
          <Section title='Objetivos y actividad'>
            <div className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3'>
              <DataField
                label='Objetivo'
                value={patient.goal ? GOAL_LABELS[patient.goal] : null}
              />
              <DataField
                label='Nivel de actividad'
                value={patient.activity_level ? ACTIVITY_LABELS[patient.activity_level] : null}
              />
              <DataField label='TMB' value={patient.tmb ? `${patient.tmb} kcal` : null} />
              <DataField label='TDEE' value={patient.tdee ? `${patient.tdee} kcal` : null} />
            </div>
          </Section>

          {/* Restricciones y notas */}
          {(patient.dietary_restrictions ||
            patient.allergies ||
            patient.intolerances ||
            patient.preferences ||
            patient.medical_notes) && (
            <Section title='Notas clínicas'>
              <div className='flex flex-col gap-4'>
                {patient.dietary_restrictions && (
                  <DataField label='Restricciones dietéticas' value={patient.dietary_restrictions} />
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

        {/* Planes nutricionales */}
        <div className='flex flex-col gap-4'>
          <h2 className='text-sm font-semibold uppercase tracking-wider text-zinc-500'>
            Planes nutricionales
          </h2>
          {!plans || plans.length === 0 ? (
            <div className='flex flex-col items-center rounded-xl border border-dashed border-zinc-800 py-10 text-center'>
              <p className='text-sm text-zinc-500'>Sin planes todavía.</p>
              <div className='mt-4'>
                <GenerateButton patientId={id} />
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
    </div>
  );
}

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
      <span className='text-sm text-zinc-200'>{value ?? <span className='text-zinc-700'>—</span>}</span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-950 text-amber-400',
  approved: 'bg-green-950 text-green-400',
  sent: 'bg-blue-950 text-blue-400',
};

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
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[plan.status] ?? 'bg-zinc-800 text-zinc-400'}`}
      >
        {PLAN_STATUS_LABELS[plan.status]}
      </span>
    </Link>
  );
}
