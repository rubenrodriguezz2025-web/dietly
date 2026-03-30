export function PatientDetailSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Header: avatar + nombre + botón generar */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='skeleton h-14 w-14 flex-shrink-0 rounded-full' />
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-7 w-48' />
            <div className='skeleton h-4 w-32' />
          </div>
        </div>
        <div className='flex flex-col items-end gap-2'>
          <div className='skeleton h-6 w-40 rounded-full' />
          <div className='skeleton h-9 w-44 rounded-lg' />
        </div>
      </div>

      {/* Tabs: Ficha | Cuestionario | Progreso | Seguimientos */}
      <div className='flex gap-1 border-b border-zinc-800'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='skeleton h-9 w-28 rounded-t-lg' />
        ))}
      </div>

      {/* Contenido de tab: sección de datos del paciente */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='flex flex-col gap-1.5'>
            <div className='skeleton h-3 w-24' />
            <div className='skeleton h-9 w-full rounded-lg' />
          </div>
        ))}
      </div>

      {/* Lista de planes */}
      <div className='flex flex-col gap-3'>
        <div className='skeleton h-4 w-32' />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className='flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4'
          >
            <div className='flex flex-col gap-1.5'>
              <div className='skeleton h-4 w-36' />
              <div className='skeleton h-3 w-24' />
            </div>
            <div className='skeleton h-6 w-20 rounded-full' />
          </div>
        ))}
      </div>
    </div>
  );
}
