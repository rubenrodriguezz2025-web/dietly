'use client';

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

export function BotonDescargar({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <button
        type='button'
        onClick={() => window.print()}
        aria-label='Guardar plan como PDF'
        className='flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-70 active:opacity-50'
        style={{
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          background: 'transparent',
        }}
      >
        <DownloadIcon size={13} />
        <span>Guardar PDF</span>
      </button>
    );
  }

  return (
    <button
      type='button'
      onClick={() => window.print()}
      aria-label='Guardar plan como PDF'
      className='mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors'
      style={{
        background: 'var(--card)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
      }}
    >
      <DownloadIcon />
      Guardar como PDF
    </button>
  );
}
