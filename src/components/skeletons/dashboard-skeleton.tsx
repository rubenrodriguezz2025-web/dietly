export function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex flex-col gap-2'>
          <div className='skeleton h-4 w-32' />
          <div className='skeleton h-8 w-48' />
        </div>
        <div className='skeleton h-9 w-36 rounded-lg' />
      </div>

      {/* Tarjetas KPI */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='rounded-xl border border-zinc-800 bg-zinc-950 p-4'>
            <div className='flex items-center gap-3'>
              <div className='skeleton h-9 w-9 rounded-lg' />
              <div className='flex flex-1 flex-col gap-1.5'>
                <div className='skeleton h-3 w-24' />
                <div className='skeleton h-7 w-12' />
              </div>
            </div>
          </div>
        ))}
      </div>

      <PatientListSkeleton />
    </div>
  );
}

export function PatientListSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='skeleton h-3 w-20' />
      <div className='skeleton h-10 w-full rounded-xl' />
      <div className='flex gap-2'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='skeleton h-7 w-24 rounded-full' />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className='flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4'
        >
          <div className='skeleton h-10 w-10 flex-shrink-0 rounded-full' />
          <div className='flex flex-1 flex-col gap-1.5'>
            <div className='skeleton h-4 w-36' />
            <div className='skeleton h-3 w-52' />
          </div>
          <div className='skeleton h-6 w-20 rounded-full' />
        </div>
      ))}
    </div>
  );
}
