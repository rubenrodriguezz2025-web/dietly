'use client';

import { useRef, useState, useTransition } from 'react';

import { saveIntakeFromDashboard } from './intake-actions';

// ── Estilos dark para el formulario del dashboard ─────────────────────────────

const labelClass = 'block text-sm font-medium text-zinc-300 mb-1.5';
const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a45]/50 focus:border-[#1a7a45]/60 transition-colors';
const textareaClass = `${inputClass} resize-none`;
const selectClass = `${inputClass} cursor-pointer`;

// ── Sección visual ────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
      <h3 className='mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500'>
        {title}
      </h3>
      <div className='flex flex-col gap-4'>{children}</div>
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

type IntakeAnswers = Record<string, string>;

type Props = {
  patientId: string;
  initialAnswers?: IntakeAnswers | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function DashboardIntakeForm({ patientId, initialAnswers, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);

    const answers: IntakeAnswers = {
      comidas_al_dia:         String(data.get('comidas_al_dia') ?? ''),
      hora_desayuno:          String(data.get('hora_desayuno') ?? ''),
      hora_almuerzo:          String(data.get('hora_almuerzo') ?? ''),
      hora_merienda:          String(data.get('hora_merienda') ?? ''),
      hora_cena:              String(data.get('hora_cena') ?? ''),
      alergias_intolerancias: String(data.get('alergias_intolerancias') ?? ''),
      alimentos_no_gustados:  String(data.get('alimentos_no_gustados') ?? ''),
      come_fuera:             String(data.get('come_fuera') ?? ''),
      cocina_en_casa:         String(data.get('cocina_en_casa') ?? ''),
      actividad_fisica:       String(data.get('actividad_fisica') ?? ''),
      objetivo_personal:      String(data.get('objetivo_personal') ?? ''),
      dieta_especial:         String(data.get('dieta_especial') ?? ''),
      condicion_medica:       String(data.get('condicion_medica') ?? ''),
      observaciones:          String(data.get('observaciones') ?? ''),
    };

    startTransition(async () => {
      const result = await saveIntakeFromDashboard(patientId, answers);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  const iv = initialAnswers ?? {};

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='flex flex-col gap-4'>

      {/* ── Horarios ─────────────────────────────────────────────────────── */}
      <FormSection title='Horarios habituales'>
        <div>
          <label className={labelClass}>¿Cuántas comidas hace al día?</label>
          <select name='comidas_al_dia' className={selectClass} defaultValue={iv.comidas_al_dia ?? '4'} required>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} comida{n !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className={labelClass}>Hora desayuno</label>
            <input name='hora_desayuno' type='time' className={inputClass} defaultValue={iv.hora_desayuno ?? '08:00'} />
          </div>
          <div>
            <label className={labelClass}>Hora almuerzo</label>
            <input name='hora_almuerzo' type='time' className={inputClass} defaultValue={iv.hora_almuerzo ?? '14:00'} />
          </div>
          <div>
            <label className={labelClass}>Hora merienda</label>
            <input name='hora_merienda' type='time' className={inputClass} defaultValue={iv.hora_merienda ?? '17:00'} />
          </div>
          <div>
            <label className={labelClass}>Hora cena</label>
            <input name='hora_cena' type='time' className={inputClass} defaultValue={iv.hora_cena ?? '21:00'} />
          </div>
        </div>
      </FormSection>

      {/* ── Alimentos ────────────────────────────────────────────────────── */}
      <FormSection title='Alimentos y restricciones'>
        <div>
          <label className={labelClass}>Alergias e intolerancias alimentarias</label>
          <textarea
            name='alergias_intolerancias'
            rows={2}
            defaultValue={iv.alergias_intolerancias ?? ''}
            placeholder='Ej: intolerancia a la lactosa, alergia a los frutos secos…'
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass}>Alimentos que no le gustan o evita</label>
          <textarea
            name='alimentos_no_gustados'
            rows={2}
            defaultValue={iv.alimentos_no_gustados ?? ''}
            placeholder='Ej: no le gusta el hígado, evita el pescado azul…'
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass}>¿Sigue alguna dieta especial actualmente?</label>
          <textarea
            name='dieta_especial'
            rows={2}
            defaultValue={iv.dieta_especial ?? ''}
            placeholder='Ej: vegetariano, sin gluten, keto…'
            className={textareaClass}
          />
        </div>
      </FormSection>

      {/* ── Hábitos ──────────────────────────────────────────────────────── */}
      <FormSection title='Hábitos cotidianos'>
        <div>
          <label className={labelClass}>¿Come fuera de casa habitualmente?</label>
          <select name='come_fuera' className={selectClass} defaultValue={iv.come_fuera ?? ''}>
            <option value=''>Seleccionar</option>
            <option value='no'>No, casi siempre en casa</option>
            <option value='si_poco'>Sí, 1-2 veces a la semana</option>
            <option value='si_bastante'>Sí, 3-4 veces a la semana</option>
            <option value='si_mucho'>Sí, casi todos los días</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>¿Cocina habitualmente en casa?</label>
          <select name='cocina_en_casa' className={selectClass} defaultValue={iv.cocina_en_casa ?? ''}>
            <option value=''>Seleccionar</option>
            <option value='si_siempre'>Sí, casi siempre</option>
            <option value='si_a_veces'>Sí, a veces</option>
            <option value='poco'>Poco, cocina cosas sencillas</option>
            <option value='no'>No cocina</option>
          </select>
        </div>
      </FormSection>

      {/* ── Actividad y objetivos ─────────────────────────────────────────── */}
      <FormSection title='Actividad y objetivos'>
        <div>
          <label className={labelClass}>Nivel de actividad física</label>
          <select name='actividad_fisica' className={selectClass} defaultValue={iv.actividad_fisica ?? ''}>
            <option value=''>Seleccionar</option>
            <option value='sedentario'>Sedentario (trabajo de oficina, sin ejercicio)</option>
            <option value='ligero'>Ligero (camino, algo de ejercicio 1-2 días)</option>
            <option value='moderado'>Moderado (ejercicio regular 3-4 días)</option>
            <option value='activo'>Activo (entreno fuerte 5-6 días)</option>
            <option value='muy_activo'>Muy activo (deporte profesional o trabajo físico)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Objetivo principal</label>
          <select name='objetivo_personal' className={selectClass} defaultValue={iv.objetivo_personal ?? ''}>
            <option value=''>Seleccionar</option>
            <option value='perder_peso'>Perder peso</option>
            <option value='mantener'>Mantener el peso</option>
            <option value='ganar_musculo'>Ganar músculo</option>
            <option value='mejorar_salud'>Mejorar la salud en general</option>
            <option value='rendimiento'>Mejorar rendimiento deportivo</option>
          </select>
        </div>
      </FormSection>

      {/* ── Salud ────────────────────────────────────────────────────────── */}
      <FormSection title='Salud y observaciones'>
        <div>
          <label className={labelClass}>¿Tiene alguna condición médica relevante?</label>
          <textarea
            name='condicion_medica'
            rows={2}
            defaultValue={iv.condicion_medica ?? ''}
            placeholder='Ej: diabetes tipo 2, hipertensión, hipotiroidismo…'
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass}>Observaciones adicionales</label>
          <textarea
            name='observaciones'
            rows={2}
            defaultValue={iv.observaciones ?? ''}
            placeholder='Cualquier información relevante para el plan nutricional…'
            className={textareaClass}
          />
        </div>
      </FormSection>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p className='rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-400'>
          {error}
        </p>
      )}

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className='flex items-center justify-end gap-3 border-t border-zinc-800 pt-4'>
        <button
          type='button'
          onClick={onCancel}
          disabled={isPending}
          className='rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-60'
        >
          Cancelar
        </button>
        <button
          type='submit'
          disabled={isPending}
          className='flex items-center gap-2 rounded-xl bg-[#1a7a45] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1a7a45]/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isPending ? (
            <>
              <span className='h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white' />
              Guardando…
            </>
          ) : (
            <>
              <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
                <polyline points='17 21 17 13 7 13 7 21' />
                <polyline points='7 3 7 8 15 8' />
              </svg>
              Guardar cuestionario
            </>
          )}
        </button>
      </div>
    </form>
  );
}
