'use client';

// Helpers presentacionales compartidos entre las pestañas del paciente.
// Se mantienen aquí para evitar importaciones circulares.

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
      <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
        {title}
      </h2>
      {children}
    </div>
  );
}

export function DataField({
  label,
  value,
  tooltip,
  estimated,
}: {
  label: string;
  value: string | number | null;
  tooltip?: string;
  estimated?: boolean;
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-xs text-zinc-600'>{label}</span>
      <span className='flex items-center gap-1.5 text-sm text-zinc-200'>
        {value != null ? (
          <>
            {value}
            {estimated && (
              <span
                className='rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] leading-none text-zinc-500'
                title='Valor estimado con Mifflin-St Jeor a partir de los datos del paciente'
              >
                ~est.
              </span>
            )}
          </>
        ) : tooltip ? (
          <span className='group relative cursor-help'>
            <span className='text-zinc-700'>—</span>
            <span className='pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden w-max max-w-[200px] rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[11px] leading-snug text-zinc-300 shadow-lg group-hover:block'>
              {tooltip}
            </span>
          </span>
        ) : (
          <span className='text-zinc-700'>—</span>
        )}
      </span>
    </div>
  );
}
