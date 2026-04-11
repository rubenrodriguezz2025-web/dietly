'use client';

import { useState } from 'react';
import { IoCheckmark, IoLockClosed, IoShieldCheckmark, IoSparkles } from 'react-icons/io5';

import * as Dialog from '@radix-ui/react-dialog';

/* ─────────────────────────── Types ─────────────────────────── */

type PaywallReason = 'SUBSCRIPTION_REQUIRED' | 'LIMIT_REACHED';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason: PaywallReason;
}

/* ─────────────────────────── Copy ──────────────────────────── */

const COPY: Record<PaywallReason, { title: string; subtitle: string }> = {
  SUBSCRIPTION_REQUIRED: {
    title: 'Estás a 1 paso de generar tu primer plan con IA',
    subtitle: 'Deja que la IA haga el borrador. Tú revisas, ajustas y entregas.',
  },
  LIMIT_REACHED: {
    title: 'Has alcanzado el límite de 2 pacientes en modo prueba',
    subtitle: 'Desbloquea pacientes ilimitados y generación de planes con IA.',
  },
};

/* ─────────────────────────── Plans ─────────────────────────── */

const PLANS = [
  {
    key: 'basico' as const,
    name: 'Básico',
    price: 46,
    highlight: false,
    features: [
      'Hasta 30 pacientes activos',
      'Planes nutricionales con IA',
      'PDF profesional con tu marca',
      'Lista de la compra automática',
    ],
  },
  {
    key: 'pro' as const,
    name: 'Profesional',
    price: 89,
    highlight: true,
    features: [
      'Pacientes ilimitados',
      'Todo lo del plan Básico',
      'Logo y firma en el PDF',
      'Soporte prioritario',
    ],
  },
];

/* ─────────────────────────── Component ─────────────────────── */

export function PaywallModal({ open, onClose, reason }: PaywallModalProps) {
  const [loading, setLoading] = useState<'basico' | 'pro' | null>(null);
  const [error, setError] = useState('');
  const copy = COPY[reason];

  async function handleSelectPlan(plan: 'basico' | 'pro') {
    setError('');
    setLoading(plan);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al iniciar el pago. Inténtalo de nuevo.');
        setLoading(null);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
      setLoading(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/50 focus:outline-none sm:p-8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-300">

          {/* Close button */}
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7a45]">
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </Dialog.Close>

          {/* Header */}
          <div className="mb-6 text-center sm:mb-8">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a7a45]/15">
              <IoSparkles className="h-5 w-5 text-[#22c55e]" />
            </div>
            <Dialog.Title className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {copy.title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-zinc-400">
              {copy.subtitle}
            </Dialog.Description>
          </div>

          {/* Plan cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                  plan.highlight
                    ? 'border-[#1a7a45]/50 bg-gradient-to-b from-[#0d1f12] to-zinc-950 shadow-lg shadow-[#1a7a45]/8'
                    : 'border-zinc-800 bg-zinc-900/50'
                }`}
              >
                {/* Badge recomendado */}
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-[#1a7a45] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Recomendado
                  </span>
                )}

                {/* Plan name + price */}
                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}&euro;</span>
                  <span className="text-sm text-zinc-500">/mes</span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-600">IVA incluido</p>

                {/* Features */}
                <ul className="mt-4 flex flex-1 flex-col gap-2">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <IoCheckmark className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#22c55e]" />
                      <span className="text-xs leading-relaxed text-zinc-300">{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => handleSelectPlan(plan.key)}
                  className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                    plan.highlight
                      ? 'bg-[#1a7a45] text-white hover:bg-[#1e8a4e] active:scale-[0.98]'
                      : 'border border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700 active:scale-[0.98]'
                  }`}
                >
                  {loading === plan.key ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Redirigiendo a Stripe…
                    </span>
                  ) : (
                    'Empezar prueba 14 días'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}

          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <IoShieldCheckmark className="h-3 w-3" />
              Cancela cuando quieras
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IoLockClosed className="h-3 w-3" />
              Pago seguro con Stripe
            </span>
            <span>Sin compromiso · 14 días gratis</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
