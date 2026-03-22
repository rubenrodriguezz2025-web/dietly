// Skeleton loader para la ficha del paciente
export default function PatientLoading() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Header skeleton */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='skeleton h-14 w-14 rounded-full flex-shrink-0' />
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-7 w-40' />
            <div className='skeleton h-4 w-56' />
          </div>
        </div>
        <div className='flex flex-col items-end gap-2'>
          <div className='skeleton h-6 w-44 rounded-full' />
          <div className='skeleton h-9 w-36 rounded-lg' />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className='flex gap-0 border-b border-zinc-800/70'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='skeleton mx-2 mb-3 h-4 w-20 rounded' />
        ))}
      </div>

      {/* Content skeleton */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='flex flex-col gap-6 lg:col-span-2'>
          {[...Array(2)].map((_, i) => (
            <div key={i} className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
              <div className='skeleton mb-4 h-3 w-32' />
              <div className='grid grid-cols-3 gap-4'>
                {[...Array(6)].map((_, j) => (
                  <div key={j} className='flex flex-col gap-1.5'>
                    <div className='skeleton h-3 w-20' />
                    <div className='skeleton h-4 w-24' />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className='flex flex-col gap-3'>
          <div className='skeleton h-3 w-32' />
          {[...Array(3)].map((_, i) => (
            <div key={i} className='skeleton h-16 w-full rounded-xl' />
          ))}
        </div>
      </div>
    </div>
  );
}
