'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  hasSubscription: boolean;
};

export function SubscriptionManage({ hasSubscription }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleManage() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al abrir el portal. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  if (!hasSubscription) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-zinc-200">Suscripción</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Aún no tienes un plan activo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/onboarding/plan')}
          className="flex-shrink-0 rounded-lg bg-[#1a7a45] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1e8a4e]"
        >
          Activar suscripción
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-zinc-200">Suscripción y facturación</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Cambia de plan, actualiza tu tarjeta o descarga facturas.
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <button
          type="button"
          disabled={loading}
          onClick={handleManage}
          className="flex-shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Abriendo portal…
            </span>
          ) : (
            'Gestionar suscripción y facturación'
          )}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
