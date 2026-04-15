'use client';

import { useState } from 'react';
import { IoCheckmark, IoLockClosed,IoShieldCheckmark } from 'react-icons/io5';

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
      'PWA para el paciente',
      'Lista de la compra automática',
      'Soporte por email',
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
      'Logo propio en el PDF',
      'Firma digital en el PDF',
      'Recetario personal',
      'Soporte prioritario',
    ],
  },
];

export function PlanSelectionClient() {
  const [loading, setLoading] = useState<'basico' | 'pro' | null>(null);
  const [error, setError] = useState('');

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Elige tu plan para empezar
        </h1>
        <p className="mt-3 text-sm text-zinc-400 sm:text-base">
          Sin permanencia. Puedes cancelar tu suscripción en cualquier momento desde tu panel.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-5 lg:flex-row lg:items-stretch lg:gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex w-full max-w-md flex-1 flex-col rounded-xl border p-6 transition-all lg:p-8 ${
              plan.highlight
                ? 'border-[#1a7a45]/60 bg-gradient-to-b from-[#0d1f12] to-black shadow-lg shadow-[#1a7a45]/10'
                : 'border-zinc-800 bg-black'
            }`}
          >
            {plan.highlight && (
              <span className="mb-4 w-fit rounded-full bg-[#1a7a45]/20 px-3 py-1 text-xs font-semibold text-[#22c55e]">
                Recomendado
              </span>
            )}

            <h3 className="text-xl font-bold text-white">{plan.name}</h3>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{plan.price}&euro;</span>
              <span className="text-zinc-400">/mes</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">IVA incluido</p>

            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <IoCheckmark className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22c55e]" />
                  <span className="text-sm text-zinc-300">{feat}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => handleSelectPlan(plan.key)}
                className={`block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-colors disabled:opacity-60 ${
                  plan.highlight
                    ? 'bg-[#1a7a45] text-white hover:bg-[#1e8a4e]'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
                }`}
              >
                {loading === plan.key ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
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
                  'Suscribirme'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-6 text-center text-sm text-red-400">{error}</p>
      )}

      {/* Trust signals */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <IoShieldCheckmark className="h-3.5 w-3.5 text-zinc-500" />
          Cancela cuando quieras
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IoLockClosed className="h-3.5 w-3.5 text-zinc-500" />
          Pago seguro con Stripe
        </span>
      </div>
    </div>
  );
}
