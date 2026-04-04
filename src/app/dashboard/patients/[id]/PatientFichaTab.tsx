'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  type NutritionPlan,
  type Patient,
  PLAN_STATUS_LABELS,
  SEX_LABELS,
} from '@/types/dietly';
import { calcTargets } from '@/utils/calc-targets';

import { GenerateButton } from './generate-button';
import { DataField, Section } from './patient-shared';
import { updatePatientField } from './update-actions';

// ── Inline editable field ─────────────────────────────────────────────────────

function InlineField({
  label,
  value,
  displayValue,
  type = 'text',
  options,
  patientId,
  field,
  suffix,
}: {
  label: string;
  value: string | number | null;
  displayValue?: string | null;
  type?: 'text' | 'number' | 'select' | 'textarea' | 'date';
  options?: { value: string; label: string }[];
  patientId: string;
  field: string;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    setDraft(value != null ? String(value) : '');
    setEditing(true);
    setSaveError(null);
  }

  function confirm() {
    const parsed: string | number | null =
      type === 'number' ? (draft ? Number(draft) : null) : draft.trim() || null;
    startSaving(async () => {
      const result = await updatePatientField(patientId, field, parsed);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function cancel() {
    setEditing(false);
    setSaveError(null);
  }

  const shown = displayValue ?? (value != null ? `${value}${suffix ? ` ${suffix}` : ''}` : null);

  if (editing) {
    return (
      <div className='flex flex-col gap-0.5'>
        <span className='text-xs text-zinc-600'>{label}</span>
        <div className='flex flex-col gap-1.5'>
          {type === 'textarea' ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              rows={3}
              className='resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30'
            />
          ) : type === 'select' && options ? (
            <select
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className='rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-emerald-600 focus:outline-none'
            >
              <option value=''>— Sin especificar —</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') cancel();
              }}
              className='rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30'
            />
          )}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={confirm}
              disabled={saving}
              className='flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-950/50 disabled:opacity-50'
            >
              {saving ? (
                <span className='h-2.5 w-2.5 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-400' />
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='10'
                  height='10'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='3'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                >
                  <polyline points='20 6 9 17 4 12' />
                </svg>
              )}
              Guardar
            </button>
            <button
              type='button'
              onClick={cancel}
              className='flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-400'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='10'
                height='10'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='3'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
              >
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
              Cancelar
            </button>
          </div>
          {saveError && <p className='text-[11px] text-red-400'>{saveError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className='group/inline flex flex-col gap-0.5'>
      <span className='text-xs text-zinc-600'>{label}</span>
      <div className='flex items-center gap-1.5'>
        <span className='text-sm text-zinc-200'>
          {shown ?? <span className='text-zinc-700'>—</span>}
        </span>
        <button
          type='button'
          onClick={startEdit}
          title={`Editar ${label.toLowerCase()}`}
          aria-label={`Editar ${label.toLowerCase()}`}
          className='rounded p-0.5 text-zinc-700 opacity-0 transition-all group-hover/inline:opacity-100 hover:text-zinc-300 focus-visible:opacity-100'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='11'
            height='11'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
            <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Cálculo client-side de TMB/TDEE ──────────────────────────────────────────

const ACTIVITY_MULT: Record<string, number> = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  extra_active:      1.9,
};

function computeTMBClientSide(patient: Patient): { tmb: number | null; missingFor: string | null } {
  if (!patient.weight_kg) return { tmb: null, missingFor: 'Falta el peso para calcular el TMB' };
  if (!patient.height_cm) return { tmb: null, missingFor: 'Falta la altura para calcular el TMB' };
  if (!patient.date_of_birth) return { tmb: null, missingFor: 'Falta la fecha de nacimiento para calcular el TMB' };

  const age = Math.floor(
    (Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const base = 10 * patient.weight_kg + 6.25 * patient.height_cm - 5 * age;
  const tmb = patient.sex === 'male' ? base + 5 : patient.sex === 'female' ? base - 161 : base - 78;
  return { tmb: Math.round(tmb), missingFor: null };
}

function computeTDEEClientSide(
  tmb: number | null,
  activityLevel: string | null
): { tdee: number | null; missingFor: string | null } {
  if (!tmb) return { tdee: null, missingFor: null };
  if (!activityLevel) return { tdee: null, missingFor: 'Falta el nivel de actividad para calcular el TDEE' };
  const mult = ACTIVITY_MULT[activityLevel] ?? null;
  if (!mult) return { tdee: null, missingFor: 'Nivel de actividad desconocido' };
  return { tdee: Math.round(tmb * mult), missingFor: null };
}

const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-amber-950 text-amber-400',
  approved: 'bg-green-950 text-green-400',
  sent:     'bg-blue-950 text-blue-400',
};

// ── Plan row ──────────────────────────────────────────────────────────────────

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

// ── PatientFichaTab ───────────────────────────────────────────────────────────

export type PatientFichaTabProps = {
  patient: Patient;
  plans: NutritionPlan[] | null;
  intakeForm: { answers: Record<string, string>; completed_at: string; filled_by?: string } | null;
  intakeUrl: string | null;
  patientTargets: ReturnType<typeof calcTargets> | null;
  age: number | null;
  onGoToCuestionario: () => void;
  onOpenQuestionsPreview: () => void;
  rejectedMeals?: string[];
};

export function PatientFichaTab({
  patient,
  plans,
  intakeForm,
  intakeUrl,
  patientTargets,
  age,
  onGoToCuestionario,
  onOpenQuestionsPreview,
  rejectedMeals = [],
}: PatientFichaTabProps) {
  return (
    <div className='flex flex-col gap-6'>

      {/* Estado del cuestionario — visible en ficha principal */}
      {intakeForm ? (
        <div className='flex items-center gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-2.5'>
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
            className='flex-shrink-0 text-emerald-500'
            aria-hidden='true'
          >
            <polyline points='20 6 9 17 4 12' />
          </svg>
          <p className='text-[13px] text-emerald-400'>
            Cuestionario completado —{' '}
            <span className='text-emerald-500/70'>
              el plan usará toda la información del paciente
            </span>
          </p>
        </div>
      ) : intakeUrl ? (
        <div className='rounded-xl border border-[#1a7a45]/40 bg-[#0a1f12] p-4'>
          <div className='flex gap-3'>
            <div className='mt-0.5 flex-shrink-0'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.75'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-[#1a7a45]'
                aria-hidden='true'
              >
                <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                <polyline points='14 2 14 8 20 8' />
                <line x1='16' y1='13' x2='8' y2='13' />
                <line x1='16' y1='17' x2='8' y2='17' />
                <polyline points='10 9 9 9 8 9' />
              </svg>
            </div>
            <div className='flex flex-col gap-2'>
              <p className='text-[13px] font-semibold text-zinc-200'>
                Personaliza el plan con más detalle
              </p>
              <p className='text-[13px] leading-relaxed text-zinc-400'>
                Envía un cuestionario al paciente para conocer sus horarios, preferencias
                y hábitos. El plan generado será mucho más preciso.
              </p>
              <div className='mt-1 flex flex-wrap items-center gap-2'>
                <button
                  type='button'
                  onClick={onGoToCuestionario}
                  className='flex items-center gap-1.5 rounded-lg border border-[#1a7a45]/60 bg-[#1a7a45]/20 px-3 py-1.5 text-[12px] font-semibold text-emerald-400 transition-colors hover:border-[#1a7a45] hover:bg-[#1a7a45]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45]'
                >
                  Enviar cuestionario
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
                </button>
                <button
                  type='button'
                  onClick={onOpenQuestionsPreview}
                  className='text-[12px] text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:underline'
                >
                  Ver preguntas del cuestionario →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grid datos + planes */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left: personal + goals + clinical notes */}
        <div className='flex flex-col gap-6 lg:col-span-2'>
          <Section title='Datos personales'>
            <div className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3'>
              <InlineField
                label='Nombre'
                value={patient.name}
                patientId={patient.id}
                field='name'
              />
              <InlineField
                label='Email'
                value={patient.email}
                patientId={patient.id}
                field='email'
              />
              <InlineField
                label='Teléfono'
                value={patient.phone ?? null}
                patientId={patient.id}
                field='phone'
              />
              <InlineField
                label='Sexo'
                value={patient.sex}
                displayValue={patient.sex ? SEX_LABELS[patient.sex] : null}
                type='select'
                options={[
                  { value: 'male', label: 'Hombre' },
                  { value: 'female', label: 'Mujer' },
                  { value: 'other', label: 'Otro' },
                ]}
                patientId={patient.id}
                field='sex'
              />
              <DataField label='Edad' value={age ? `${age} años` : null} />
              <InlineField
                label='Fecha de nacimiento'
                value={patient.date_of_birth}
                displayValue={
                  patient.date_of_birth
                    ? new Date(patient.date_of_birth).toLocaleDateString('es-ES')
                    : null
                }
                type='date'
                patientId={patient.id}
                field='date_of_birth'
              />
              <InlineField
                label='Peso'
                value={patient.weight_kg}
                suffix='kg'
                type='number'
                patientId={patient.id}
                field='weight_kg'
              />
              <InlineField
                label='Altura'
                value={patient.height_cm}
                suffix='cm'
                type='number'
                patientId={patient.id}
                field='height_cm'
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
            {(() => {
              const tmbDb = patient.tmb ?? null;
              const tdeeDb = patient.tdee ?? null;
              const { tmb: tmbCalc, missingFor: tmbMissing } = tmbDb
                ? { tmb: tmbDb, missingFor: null }
                : computeTMBClientSide(patient);
              const tmbEstimated = !tmbDb && tmbCalc !== null;

              const { tdee: tdeeCalc, missingFor: tdeeMissing } = tdeeDb
                ? { tdee: tdeeDb, missingFor: null }
                : computeTDEEClientSide(tmbCalc, patient.activity_level ?? null);
              const tdeeEstimated = !tdeeDb && tdeeCalc !== null;

              return (
                <div className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3'>
                  <InlineField
                    label='Objetivo'
                    value={patient.goal}
                    displayValue={patient.goal ? GOAL_LABELS[patient.goal] : null}
                    type='select'
                    options={Object.entries(GOAL_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                    patientId={patient.id}
                    field='goal'
                  />
                  <InlineField
                    label='Nivel de actividad'
                    value={patient.activity_level}
                    displayValue={
                      patient.activity_level ? ACTIVITY_LABELS[patient.activity_level] : null
                    }
                    type='select'
                    options={Object.entries(ACTIVITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                    patientId={patient.id}
                    field='activity_level'
                  />
                  <DataField
                    label='TMB'
                    value={tmbCalc !== null ? `${tmbCalc} kcal` : null}
                    estimated={tmbEstimated}
                    tooltip={tmbMissing ?? undefined}
                  />
                  <DataField
                    label='TDEE'
                    value={tdeeCalc !== null ? `${tdeeCalc} kcal` : null}
                    estimated={tdeeEstimated}
                    tooltip={tdeeMissing ?? undefined}
                  />
                </div>
              );
            })()}
          </Section>

          <Section title='Configuración del plan'>
            <SwapToggle
              patientId={patient.id}
              initialValue={patient.allow_meal_swaps}
            />
          </Section>

          <Section title='Notas clínicas'>
            <div className='flex flex-col gap-4'>
              <InlineField
                label='Restricciones dietéticas'
                value={patient.dietary_restrictions?.join(', ') ?? null}
                type='textarea'
                patientId={patient.id}
                field='dietary_restrictions'
              />
              <InlineField
                label='Alergias'
                value={patient.allergies}
                type='textarea'
                patientId={patient.id}
                field='allergies'
              />
              <InlineField
                label='Intolerancias'
                value={patient.intolerances}
                type='textarea'
                patientId={patient.id}
                field='intolerances'
              />
              <InlineField
                label='Preferencias alimentarias'
                value={patient.preferences}
                type='textarea'
                patientId={patient.id}
                field='preferences'
              />
              <InlineField
                label='Notas médicas'
                value={patient.medical_notes}
                type='textarea'
                patientId={patient.id}
                field='medical_notes'
              />
            </div>
          </Section>
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
                <GenerateButton
                  patientId={patient.id}
                  initialTargets={patientTargets}
                  patientWeight={patient.weight_kg ?? 70}
                  patientGoal={patient.goal ?? 'health'}
                  hasIntake={!!intakeForm}
                  onGoToIntake={intakeUrl ? onGoToCuestionario : undefined}
                  rejectedMeals={rejectedMeals}
                />
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

// ── Toggle intercambios ──────────────────────────────────────────────────────

function SwapToggle({ patientId, initialValue }: { patientId: string; initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, startSaving] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startSaving(async () => {
      const result = await updatePatientField(patientId, 'allow_meal_swaps', next as unknown as string | number | null);
      if (result.error) setEnabled(!next);
    });
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-col gap-0.5'>
        <span className='text-sm text-zinc-200'>Permitir intercambio de platos</span>
        <span className='text-xs text-zinc-500'>
          El paciente podrá cambiar platos desde su plan. Serás notificado de cada cambio.
        </span>
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={enabled}
        onClick={toggle}
        disabled={saving}
        className='relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50'
        style={{ background: enabled ? '#1a7a45' : '#3f3f46' }}
      >
        <span
          className='pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200'
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
