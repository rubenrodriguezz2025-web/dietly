'use client';

import { useState } from 'react';

const PREGUNTAS = [
  { key: 'adherencia', label: '¿Has podido seguir el plan esta semana?', type: 'scale' as const },
  { key: 'dificultades', label: '¿Qué comidas o días te han resultado más difíciles?', type: 'text' as const },
  { key: 'bienestar', label: '¿Cómo te has sentido en general?', type: 'text' as const },
  { key: 'cambios_fisicos', label: '¿Has notado cambios en tu peso o cómo te queda la ropa?', type: 'text' as const },
  { key: 'actividad', label: '¿Has realizado actividad física?', type: 'text' as const },
  { key: 'cambios_recetas', label: '¿Hay alguna comida o receta que quieras cambiar?', type: 'text' as const },
  { key: 'cambios_rutina', label: '¿Ha cambiado algo en tu rutina u horarios?', type: 'text' as const },
  { key: 'dudas', label: '¿Tienes alguna duda o algo que quieras comentarle a tu nutricionista?', type: 'text' as const },
] as const;

type RespuestasState = {
  adherencia: number | null;
  dificultades: string;
  bienestar: string;
  cambios_fisicos: string;
  actividad: string;
  cambios_recetas: string;
  cambios_rutina: string;
  dudas: string;
};

type Props = {
  token: string;
  patientName: string;
};

export function FollowupForm({ token, patientName: _ }: Props) {
  const [respuestas, setRespuestas] = useState<RespuestasState>({
    adherencia: null,
    dificultades: '',
    bienestar: '',
    cambios_fisicos: '',
    actividad: '',
    cambios_recetas: '',
    cambios_rutina: '',
    dudas: '',
  });
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preguntaActual, setPreguntaActual] = useState(0);

  function totalRespondidas() {
    let count = 0;
    if (respuestas.adherencia !== null) count++;
    const textKeys = ['dificultades', 'bienestar', 'cambios_fisicos', 'actividad', 'cambios_recetas', 'cambios_rutina', 'dudas'] as const;
    for (const k of textKeys) {
      if (respuestas[k].trim()) count++;
    }
    return count;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (respuestas.adherencia === null) {
      setError('Por favor, responde al menos la primera pregunta.');
      return;
    }
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/followup/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: respuestas }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'Error enviando el cuestionario. Inténtalo de nuevo.');
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
      <div className='mt-10 text-center'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='26'
            height='26'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-emerald-400'
            aria-hidden='true'
          >
            <polyline points='20 6 9 17 4 12' />
          </svg>
        </div>
        <h2 className='text-xl font-bold text-zinc-100'>¡Gracias por responder!</h2>
        <p className='mt-2 text-sm text-zinc-500'>
          Tu nutricionista recibirá tus respuestas y las tendrá en cuenta para ajustar tu plan.
        </p>
      </div>
    );
  }

  const totalPreguntas = PREGUNTAS.length;
  const progreso = totalRespondidas();

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      {/* Indicador de progreso */}
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-center justify-between'>
          <span className='text-xs text-zinc-600'>{progreso} de {totalPreguntas} preguntas</span>
          <span className='text-xs text-zinc-600'>{Math.round((progreso / totalPreguntas) * 100)}%</span>
        </div>
        <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='h-full rounded-full bg-[#1a7a45] transition-all duration-300'
            style={{ width: `${(progreso / totalPreguntas) * 100}%` }}
          />
        </div>
      </div>

      {/* Pregunta 1: Escala 0-10 */}
      <section
        className={`rounded-xl border p-5 transition-colors duration-150 ${preguntaActual === 0 ? 'border-[#1a7a45]/50 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/60'}`}
        onClick={() => setPreguntaActual(0)}
      >
        <p className='mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600'>
          Pregunta 1 de 8
        </p>
        <p className='mb-4 text-sm font-medium text-zinc-200'>{PREGUNTAS[0].label}</p>
        <div className='flex flex-wrap gap-1.5'>
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                setRespuestas((prev) => ({ ...prev, adherencia: i }));
              }}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                respuestas.adherencia === i
                  ? i <= 4
                    ? 'bg-red-900 text-red-300'
                    : i <= 6
                      ? 'bg-amber-900 text-amber-300'
                      : 'bg-emerald-900 text-emerald-300'
                  : 'border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-700'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        {respuestas.adherencia !== null && (
          <p className='mt-2 text-xs text-zinc-600'>
            {respuestas.adherencia <= 4
              ? 'Ha sido difícil — lo tendremos en cuenta'
              : respuestas.adherencia <= 6
                ? 'Hay margen de mejora'
                : '¡Muy bien!'}
          </p>
        )}
      </section>

      {/* Preguntas 2-8: Textos libres */}
      {PREGUNTAS.slice(1).map((pregunta, idx) => {
        const preguntaIdx = idx + 1;
        const key = pregunta.key as keyof Omit<RespuestasState, 'adherencia'>;
        return (
          <section
            key={pregunta.key}
            className={`rounded-xl border p-5 transition-colors duration-150 ${preguntaActual === preguntaIdx ? 'border-[#1a7a45]/50 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/60'}`}
            onClick={() => setPreguntaActual(preguntaIdx)}
          >
            <p className='mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600'>
              Pregunta {preguntaIdx + 1} de 8
            </p>
            <label
              htmlFor={pregunta.key}
              className='mb-3 block text-sm font-medium text-zinc-200'
            >
              {pregunta.label}
            </label>
            <textarea
              id={pregunta.key}
              name={pregunta.key}
              rows={3}
              placeholder='Escribe aquí tu respuesta...'
              value={respuestas[key]}
              onChange={(e) =>
                setRespuestas((prev) => ({ ...prev, [pregunta.key]: e.target.value }))
              }
              onClick={(e) => e.stopPropagation()}
              className='w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#1a7a45] focus:outline-none focus:ring-1 focus:ring-[#1a7a45]'
            />
          </section>
        );
      })}

      {error && (
        <p className='rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400'>
          {error}
        </p>
      )}

      <button
        type='submit'
        disabled={cargando || respuestas.adherencia === null}
        className='w-full rounded-xl bg-[#1a7a45] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#155f38] disabled:cursor-not-allowed disabled:opacity-50'
      >
        {cargando ? 'Enviando...' : 'Enviar respuestas'}
      </button>

      <p className='text-center text-xs text-zinc-600'>
        Tus respuestas son confidenciales y solo las verá tu nutricionista.
        Tratamiento de datos conforme al RGPD.
      </p>
    </form>
  );
}
