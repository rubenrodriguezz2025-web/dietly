'use client';

import { useRef, useState } from 'react';

const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5';
const inputClass =
  'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
const textareaClass = `${inputClass} resize-none`;
const selectClass = `${inputClass} cursor-pointer`;

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

type AttachedFile = { path: string; name: string };

export function IntakeForm({ patientId, intakeToken }: { patientId: string; intakeToken: string }) {
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentido, setConsentido] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<AttachedFile[]>([]);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setErrorArchivo(null);

    if (archivosAdjuntos.length + files.length > MAX_FILES) {
      setErrorArchivo(`Máximo ${MAX_FILES} archivos en total.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSubiendoArchivo(true);
    const nuevos: AttachedFile[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorArchivo(`"${file.name}" supera los 10 MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      formData.append('intake_token', intakeToken);

      try {
        const res = await fetch('/api/intake/upload-file', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorArchivo(body.error ?? `Error al subir "${file.name}".`);
          continue;
        }
        const data = await res.json();
        nuevos.push({ path: data.path, name: data.name ?? file.name });
      } catch {
        setErrorArchivo(`Error de conexión al subir "${file.name}".`);
      }
    }

    if (nuevos.length > 0) {
      setArchivosAdjuntos((prev) => [...prev, ...nuevos]);
    }
    setSubiendoArchivo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeArchivo(path: string) {
    setArchivosAdjuntos((prev) => prev.filter((f) => f.path !== path));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const answers = {
      comidas_al_dia:         data.get('comidas_al_dia'),
      hora_desayuno:          data.get('hora_desayuno'),
      hora_almuerzo:          data.get('hora_almuerzo'),
      hora_merienda:          data.get('hora_merienda'),
      hora_cena:              data.get('hora_cena'),
      alergias_intolerancias: data.get('alergias_intolerancias'),
      alimentos_no_gustados:  data.get('alimentos_no_gustados'),
      come_fuera:             data.get('come_fuera'),
      frecuencia_fuera:       data.get('frecuencia_fuera'),
      cocina_en_casa:         data.get('cocina_en_casa'),
      actividad_fisica:       data.get('actividad_fisica'),
      objetivo_personal:      data.get('objetivo_personal'),
      dieta_especial:         data.get('dieta_especial'),
      condicion_medica:       data.get('condicion_medica'),
      observaciones:          data.get('observaciones'),
    };

    const consultation_goal = String(data.get('consultation_goal') ?? '').trim();
    const why_now = String(data.get('why_now') ?? '').trim();

    try {
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          intake_token: intakeToken,
          answers,
          consent: true,
          consultation_goal: consultation_goal || undefined,
          why_now: why_now || undefined,
          attached_files: archivosAdjuntos.length > 0 ? archivosAdjuntos.map((f) => f.path) : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Error al enviar el cuestionario. Inténtalo de nuevo.');
      } else {
        setEnviado(true);
      }
    } catch {
      setError('Error de conexión. Comprueba tu internet e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  if (enviado) {
    return (
      <div className='mt-8 text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100'>
          <svg className='h-6 w-6 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
          </svg>
        </div>
        <h2 className='text-lg font-bold text-zinc-900'>¡Gracias!</h2>
        <p className='mt-2 text-sm text-zinc-500'>
          Tu nutricionista recibirá tus respuestas antes de la consulta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      {/* Objetivo y contexto — feedback Esther Carazo */}
      <section className='rounded-2xl border-2 border-emerald-200 bg-white p-5'>
        <h2 className='mb-1 text-sm font-bold uppercase tracking-wider text-emerald-700'>
          Cuéntanos sobre ti
        </h2>
        <p className='mb-4 text-xs text-zinc-500'>
          Cuanto más sepa tu nutricionista, mejor preparada estará la primera consulta.
        </p>
        <div className='flex flex-col gap-4'>
          <div>
            <label className={labelClass}>
              ¿Cuál es tu objetivo principal con esta consulta?
            </label>
            <textarea
              name='consultation_goal'
              rows={4}
              maxLength={5000}
              placeholder='Cuéntale a tu nutricionista qué esperas conseguir. Cuantos más detalles, mejor podrá preparar tu primera consulta.'
              className={textareaClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              ¿Por qué ahora? ¿Qué te ha motivado a buscar ayuda nutricional en este momento?
            </label>
            <textarea
              name='why_now'
              rows={3}
              maxLength={5000}
              placeholder='Puede ser un cambio de vida, un diagnóstico, una meta personal...'
              className={textareaClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              ¿Tienes analíticas o informes médicos recientes?
            </label>
            <p className='mb-2 text-xs text-zinc-500'>
              Sube analíticas de sangre, informes médicos o cualquier documento relevante.
              Tu nutricionista los revisará antes de la consulta.
            </p>
            <input
              ref={fileInputRef}
              type='file'
              accept={ACCEPTED_FILE_TYPES}
              multiple
              onChange={handleFilesChange}
              disabled={subiendoArchivo || archivosAdjuntos.length >= MAX_FILES}
              className='block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50'
            />
            <p className='mt-2 text-[11px] text-zinc-400'>
              PDF, imagen o Word · máx. 10 MB por archivo · máx. {MAX_FILES} archivos
            </p>
            {subiendoArchivo && (
              <p className='mt-2 text-xs text-emerald-700'>Subiendo archivo...</p>
            )}
            {errorArchivo && (
              <p className='mt-2 text-xs text-red-600'>{errorArchivo}</p>
            )}
            {archivosAdjuntos.length > 0 && (
              <ul className='mt-3 flex flex-col gap-1.5'>
                {archivosAdjuntos.map((f) => (
                  <li
                    key={f.path}
                    className='flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700'
                  >
                    <span className='truncate'>{f.name}</span>
                    <button
                      type='button'
                      onClick={() => removeArchivo(f.path)}
                      className='ml-2 text-zinc-400 hover:text-red-600'
                      aria-label={`Eliminar ${f.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Horarios */}
      <section className='rounded-2xl border border-zinc-200 bg-white p-5'>
        <h2 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500'>
          Horarios habituales
        </h2>
        <div className='flex flex-col gap-4'>
          <div>
            <label className={labelClass}>¿Cuántas comidas haces al día?</label>
            <select name='comidas_al_dia' className={selectClass} defaultValue='4' required>
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
              <input name='hora_desayuno' type='time' className={inputClass} defaultValue='08:00' />
            </div>
            <div>
              <label className={labelClass}>Hora almuerzo</label>
              <input name='hora_almuerzo' type='time' className={inputClass} defaultValue='14:00' />
            </div>
            <div>
              <label className={labelClass}>Hora merienda</label>
              <input name='hora_merienda' type='time' className={inputClass} defaultValue='17:00' />
            </div>
            <div>
              <label className={labelClass}>Hora cena</label>
              <input name='hora_cena' type='time' className={inputClass} defaultValue='21:00' />
            </div>
          </div>
        </div>
      </section>

      {/* Alimentos */}
      <section className='rounded-2xl border border-zinc-200 bg-white p-5'>
        <h2 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500'>
          Alimentos y restricciones
        </h2>
        <div className='flex flex-col gap-4'>
          <div>
            <label className={labelClass}>Alergias e intolerancias alimentarias</label>
            <textarea
              name='alergias_intolerancias'
              rows={3}
              placeholder='Ej: intolerancia a la lactosa, alergia a los frutos secos...'
              className={textareaClass}
            />
          </div>
          <div>
            <label className={labelClass}>Alimentos que no te gustan o evitas</label>
            <textarea
              name='alimentos_no_gustados'
              rows={3}
              placeholder='Ej: no me gusta el hígado, evito el pescado azul...'
              className={textareaClass}
            />
          </div>
          <div>
            <label className={labelClass}>¿Sigues alguna dieta especial actualmente?</label>
            <textarea
              name='dieta_especial'
              rows={2}
              placeholder='Ej: vegetariano, sin gluten, keto...'
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* Hábitos */}
      <section className='rounded-2xl border border-zinc-200 bg-white p-5'>
        <h2 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500'>
          Hábitos cotidianos
        </h2>
        <div className='flex flex-col gap-4'>
          <div>
            <label className={labelClass}>¿Comes fuera de casa habitualmente?</label>
            <select name='come_fuera' className={selectClass} defaultValue=''>
              <option value=''>Seleccionar</option>
              <option value='no'>No, casi siempre en casa</option>
              <option value='si_poco'>Sí, 1-2 veces a la semana</option>
              <option value='si_bastante'>Sí, 3-4 veces a la semana</option>
              <option value='si_mucho'>Sí, casi todos los días</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>¿Cocinas habitualmente en casa?</label>
            <select name='cocina_en_casa' className={selectClass} defaultValue=''>
              <option value=''>Seleccionar</option>
              <option value='si_siempre'>Sí, casi siempre</option>
              <option value='si_a_veces'>Sí, a veces</option>
              <option value='poco'>Poco, cocino cosas sencillas</option>
              <option value='no'>No, no cocino</option>
            </select>
          </div>
        </div>
      </section>

      {/* Actividad y objetivos */}
      <section className='rounded-2xl border border-zinc-200 bg-white p-5'>
        <h2 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500'>
          Actividad y objetivos
        </h2>
        <div className='flex flex-col gap-4'>
          <div>
            <label className={labelClass}>Nivel de actividad física</label>
            <select name='actividad_fisica' className={selectClass} defaultValue=''>
              <option value=''>Seleccionar</option>
              <option value='sedentario'>Sedentario (trabajo de oficina, sin ejercicio)</option>
              <option value='ligero'>Ligero (camino, algo de ejercicio 1-2 días)</option>
              <option value='moderado'>Moderado (ejercicio regular 3-4 días)</option>
              <option value='activo'>Activo (entreno fuerte 5-6 días)</option>
              <option value='muy_activo'>Muy activo (deporte profesional o trabajo físico)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>¿Cuál es tu objetivo principal?</label>
            <select name='objetivo_personal' className={selectClass} defaultValue=''>
              <option value=''>Seleccionar</option>
              <option value='perder_peso'>Perder peso</option>
              <option value='mantener'>Mantener mi peso</option>
              <option value='ganar_musculo'>Ganar músculo</option>
              <option value='mejorar_salud'>Mejorar mi salud en general</option>
              <option value='rendimiento'>Mejorar rendimiento deportivo</option>
            </select>
          </div>
        </div>
      </section>

      {/* Salud y observaciones */}
      <section className='rounded-2xl border border-zinc-200 bg-white p-5'>
        <h2 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500'>
          Salud y observaciones
        </h2>
        <div className='flex flex-col gap-4'>
          <div>
            <label className={labelClass}>¿Tienes alguna condición médica relevante?</label>
            <textarea
              name='condicion_medica'
              rows={3}
              placeholder='Ej: diabetes tipo 2, hipertensión, hipotiroidismo...'
              className={textareaClass}
            />
          </div>
          <div>
            <label className={labelClass}>Observaciones adicionales</label>
            <textarea
              name='observaciones'
              rows={3}
              placeholder='Cualquier otra cosa que quieras que sepa tu nutricionista...'
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* Bloque de consentimiento */}
      <section className='rounded-2xl border border-emerald-200 bg-emerald-50 p-5'>
        <h2 className='mb-3 text-sm font-bold uppercase tracking-wider text-emerald-800'>
          Información sobre el tratamiento de tus datos
        </h2>
        <p className='mb-4 text-sm leading-relaxed text-zinc-700'>
          Acepto que mi nutricionista utilice herramientas digitales de asistencia
          para elaborar mi plan nutricional, que será revisado y personalizado por
          el profesional antes de entregármelo.
        </p>
        <label className='flex cursor-pointer items-start gap-3'>
          <input
            type='checkbox'
            checked={consentido}
            onChange={(e) => setConsentido(e.target.checked)}
            className='mt-0.5 h-4 w-4 flex-shrink-0 rounded border-emerald-400 accent-emerald-600'
          />
          <span className='text-sm font-medium text-zinc-800'>
            Acepto y doy mi consentimiento
          </span>
        </label>
      </section>

      {error && (
        <p className='rounded-xl bg-red-50 p-4 text-sm text-red-600'>{error}</p>
      )}

      <button
        type='submit'
        disabled={cargando || !consentido}
        className='w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {cargando ? 'Enviando...' : 'Enviar cuestionario'}
      </button>

      <p className='text-center text-xs text-zinc-400'>
        Tus datos se guardan de forma segura y solo los verá tu nutricionista.
      </p>
    </form>
  );
}
