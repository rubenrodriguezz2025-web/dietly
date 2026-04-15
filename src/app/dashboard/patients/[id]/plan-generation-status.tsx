'use client';

/**
 * PlanGenerationStatus
 *
 * Muestra el progreso en tiempo real de la generación del plan nutricional
 * y los estados de error con mensajes específicos según el tipo de fallo.
 */

import type { AnthropicErrorCode } from '@/libs/ai/resilience';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface GeneratingProps {
  variant:    'generating';
  currentDay: number;
}

interface ErrorProps {
  variant:    'error';
  message:    string;
  errorCode?: AnthropicErrorCode | string;
  onRetry:    () => void;
}

type PlanGenerationStatusProps = GeneratingProps | ErrorProps;

// ── Componente principal ──────────────────────────────────────────────────────

export function PlanGenerationStatus(props: PlanGenerationStatusProps) {
  if (props.variant === 'generating') {
    return <GeneratingStatus currentDay={props.currentDay} />;
  }
  return (
    <ErrorStatus
      message={props.message}
      errorCode={props.errorCode}
      onRetry={props.onRetry}
    />
  );
}

// ── Estado: generando ─────────────────────────────────────────────────────────

function GeneratingStatus({ currentDay }: { currentDay: number }) {
  const label =
    currentDay === 0
      ? 'Iniciando...'
      : currentDay <= 7
        ? `Generando ${DAY_NAMES[currentDay - 1]}... (${currentDay}/7)`
        : 'Generando lista de la compra...';

  return (
    <div className='flex flex-col items-end gap-2'>
      <div className='flex items-center gap-2'>
        <div className='h-3 w-3 animate-spin rounded-full border border-zinc-400 border-t-transparent' />
        <span className='text-sm text-zinc-400'>{label}</span>
      </div>
      {/* Barra de progreso por días */}
      <div className='flex gap-1' role='progressbar' aria-valuenow={currentDay} aria-valuemax={7}>
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${
              i < currentDay ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Estado: error ─────────────────────────────────────────────────────────────

function ErrorStatus({
  message,
  errorCode,
  onRetry,
}: {
  message:    string;
  errorCode?: AnthropicErrorCode | string;
  onRetry:    () => void;
}) {
  const isServiceUnavailable = errorCode === 'service_unavailable';

  return (
    <div className='flex flex-col items-end gap-2'>
      {isServiceUnavailable ? (
        <ServiceUnavailableBanner onRetry={onRetry} />
      ) : (
        <GenericErrorBanner message={message} onRetry={onRetry} />
      )}
    </div>
  );
}

function ServiceUnavailableBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex w-72 flex-col gap-3 rounded-lg border border-amber-600/30 bg-amber-950/20 p-3.5'>
      <div className='flex items-start gap-2.5'>
        {/* Icono de reloj */}
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
          className='mt-0.5 flex-shrink-0 text-amber-500'
          aria-hidden='true'
        >
          <circle cx='12' cy='12' r='10' />
          <polyline points='12 6 12 12 16 14' />
        </svg>
        <div className='flex flex-col gap-1'>
          <p className='text-xs font-medium text-amber-300'>
            Servicio temporalmente no disponible
          </p>
          <p className='text-[11px] leading-relaxed text-amber-200/60'>
            El servicio de generación está temporalmente no disponible.
            Inténtelo en unos minutos.
          </p>
        </div>
      </div>
      <button
        type='button'
        onClick={onRetry}
        className='w-full rounded-md border border-amber-600/40 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:border-amber-500/60 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500'
      >
        Reintentar en unos minutos
      </button>
    </div>
  );
}

function GenericErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <>
      <div className='flex max-w-xs flex-col items-end gap-1 text-right'>
        <p className='text-xs text-red-400'>{message}</p>
        <p className='text-xs text-zinc-500'>
          Si el problema persiste, escribe a{' '}
          <a
            href='mailto:hola@dietly.es'
            className='text-zinc-400 underline hover:text-zinc-200'
          >
            hola@dietly.es
          </a>
        </p>
      </div>
      <button
        type='button'
        onClick={onRetry}
        className='rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500'
      >
        Reintentar
      </button>
    </>
  );
}
