'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type EstadoSuscripcion = 'none' | 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid' | string | null;

const STORAGE_KEY = 'dietly_banner_upgrade_closed';

type Props = {
  estado: EstadoSuscripcion;
  diasRestantesTrialDia?: number | null;
};

export function BannerUpgrade({ estado, diasRestantesTrialDia }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState<'basico' | 'pro' | null>(null);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      setCerrado(true);
    }
  }, []);

  function cerrarBanner() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setCerrado(true);
  }

  if (estado === 'active') return null;

  async function irACheckout(plan: 'basico' | 'pro') {
    setCargando(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        router.push(data.url);
      }
    } finally {
      setCargando(null);
    }
  }

  // ── Banner: prueba activa ────────────────────────────────────────────────────
  if (estado === 'trialing') {
    return (
      <div className='rounded-xl border border-emerald-800 bg-emerald-950/50 px-5 py-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold text-emerald-300'>
              Prueba gratuita activa
              {diasRestantesTrialDia != null && diasRestantesTrialDia > 0
                ? ` · ${diasRestantesTrialDia} días restantes`
                : ''}
            </p>
            <p className='mt-0.5 text-xs text-emerald-600'>
              Activa tu plan antes de que termine para no perder el acceso.
            </p>
          </div>
          <div className='flex gap-2'>
            <BtnPlan
              label='Plan Básico — 46€/mes'
              cargando={cargando === 'basico'}
              onClick={() => irACheckout('basico')}
              variante='secundario'
            />
            <BtnPlan
              label='Plan Pro — 89€/mes'
              cargando={cargando === 'pro'}
              onClick={() => irACheckout('pro')}
              variante='primario'
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Banner: pago fallido ─────────────────────────────────────────────────────
  if (estado === 'past_due' || estado === 'unpaid') {
    return (
      <div className='rounded-xl border border-red-800 bg-red-950/50 px-5 py-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold text-red-300'>Problema con tu pago</p>
            <p className='mt-0.5 text-xs text-red-600'>
              Tu suscripción tiene un pago pendiente. Actualiza tu método de pago para
              continuar.
            </p>
          </div>
          <button
            type='button'
            onClick={async () => {
              const res = await fetch('/api/stripe/portal', { method: 'POST' });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
            className='rounded-lg border border-red-700 bg-red-900 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-800'
          >
            Actualizar pago
          </button>
        </div>
      </div>
    );
  }

  // ── Banner: sin suscripción o cancelada ──────────────────────────────────────
  if (cerrado) return null;

  return (
    <div className='overflow-hidden rounded-xl border border-zinc-700 bg-white dark:bg-zinc-900'>
      <div className='relative border-b border-zinc-800 px-5 py-4'>
        <p className='text-sm font-semibold text-zinc-100'>
          Empieza gratis — 14 días de prueba
        </p>
        <p className='mt-0.5 text-xs text-zinc-500'>
          Genera planes nutricionales completos en 2 minutos. Cancela cuando quieras.
        </p>
        <button
          type='button'
          onClick={cerrarBanner}
          aria-label='Cerrar banner'
          className='absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300'
        >
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-4 w-4' aria-hidden>
            <line x1='18' y1='6' x2='6' y2='18' />
            <line x1='6' y1='6' x2='18' y2='18' />
          </svg>
        </button>
      </div>
      <div className='grid grid-cols-1 divide-y divide-zinc-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0'>
        <div className='px-5 py-4'>
          <p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Plan Básico
          </p>
          <p className='mt-1 text-2xl font-bold text-zinc-100'>
            46€<span className='text-sm font-normal text-zinc-500'>/mes</span>
          </p>
          <p className='mt-1 text-xs text-zinc-600'>Hasta 30 pacientes activos</p>
          <BtnPlan
            label='Empezar gratis 14 días'
            cargando={cargando === 'basico'}
            onClick={() => irACheckout('basico')}
            variante='secundario'
            fullWidth
            className='mt-3'
          />
        </div>
        <div className='px-5 py-4'>
          <div className='flex items-center gap-2'>
            <p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              Plan Pro
            </p>
            <span className='rounded-full bg-emerald-900 px-2 py-0.5 text-[10px] font-semibold text-emerald-400'>
              Recomendado
            </span>
          </div>
          <p className='mt-1 text-2xl font-bold text-zinc-100'>
            89€<span className='text-sm font-normal text-zinc-500'>/mes</span>
          </p>
          <p className='mt-1 text-xs text-zinc-600'>Pacientes ilimitados + soporte prioritario</p>
          <BtnPlan
            label='Empezar gratis 14 días'
            cargando={cargando === 'pro'}
            onClick={() => irACheckout('pro')}
            variante='primario'
            fullWidth
            className='mt-3'
          />
        </div>
      </div>
    </div>
  );
}

// ── Botón de plan ─────────────────────────────────────────────────────────────

function BtnPlan({
  label,
  cargando,
  onClick,
  variante,
  fullWidth,
  className = '',
}: {
  label: string;
  cargando: boolean;
  onClick: () => void;
  variante: 'primario' | 'secundario';
  fullWidth?: boolean;
  className?: string;
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${fullWidth ? 'w-full' : ''} ${className}`;
  const estilo =
    variante === 'primario'
      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
      : 'border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700';

  return (
    <button className={`${base} ${estilo}`} onClick={onClick} disabled={cargando}>
      {cargando ? (
        <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
      ) : null}
      {label}
    </button>
  );
}
