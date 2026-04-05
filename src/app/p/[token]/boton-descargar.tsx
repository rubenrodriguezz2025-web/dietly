'use client';

import { useState } from 'react';

const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' />
    <polyline points='7 10 12 15 17 10' />
    <line x1='12' y1='15' x2='12' y2='3' />
  </svg>
);

const SpinnerIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    className='animate-spin'
    aria-hidden='true'
  >
    <path d='M21 12a9 9 0 1 1-6.219-8.56' />
  </svg>
);

type Props = {
  variant?: 'full' | 'compact';
  planId?: string;
  patientToken?: string;
  hmac?: string;
  expires?: string;
};

export function BotonDescargar({ variant = 'full', planId, patientToken, hmac, expires }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDownload = planId && patientToken && hmac && expires;

  async function handleDownload() {
    if (!canDownload) {
      // Fallback a print si no hay datos para API
      window.print();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/plans/${planId}/pwa-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientToken, hmac, expires }),
      });

      if (res.status === 429) {
        setError('Demasiadas descargas hoy. Inténtalo mañana.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Error al generar el PDF.');
        return;
      }

      // Extraer nombre del archivo del header Content-Disposition
      const disposition = res.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? 'plan-nutricional.pdf';

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Crear enlace de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'compact') {
    return (
      <button
        type='button'
        onClick={handleDownload}
        disabled={loading}
        aria-label='Descargar plan como PDF'
        className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-70 active:opacity-50 disabled:opacity-50'
        style={{
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          background: 'transparent',
        }}
      >
        {loading ? <SpinnerIcon size={13} /> : <DownloadIcon size={13} />}
        <span>{loading ? 'Generando...' : 'Descargar PDF'}</span>
      </button>
    );
  }

  return (
    <div className='mt-8 flex flex-col gap-2'>
      <button
        type='button'
        onClick={handleDownload}
        disabled={loading}
        aria-label='Descargar plan como PDF'
        className='flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60'
        style={{
          background: 'var(--card)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
        }}
      >
        {loading ? <SpinnerIcon /> : <DownloadIcon />}
        {loading ? 'Generando PDF...' : 'Descargar PDF'}
      </button>
      {error && (
        <p className='text-center text-xs' style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}
