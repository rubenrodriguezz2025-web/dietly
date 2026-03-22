// Skeleton loader para la página del plan nutricional
export default function PlanLoading() {
  return (
    <div className='flex flex-col gap-8'>
      {/* Header skeleton */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex flex-col gap-2'>
          <div className='skeleton h-4 w-48' />
          <div className='flex items-center gap-3'>
            <div className='skeleton h-8 w-44' />
            <div className='skeleton h-5 w-16 rounded-full' />
          </div>
          <div className='skeleton h-8 w-72 rounded-lg' />
        </div>
        <div className='flex gap-2'>
          <div className='skeleton h-9 w-36 rounded-lg' />
          <div className='skeleton h-9 w-36 rounded-lg' />
        </div>
      </div>

      {/* Stepper skeleton */}
      <div className='flex items-center gap-4'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='flex flex-1 items-center'>
            <div className='flex flex-col items-center gap-1.5'>
              <div className='skeleton h-7 w-7 rounded-full' />
              <div className='skeleton h-3 w-20 rounded' />
            </div>
            {i < 2 && <div className='skeleton mb-5 h-px flex-1' />}
          </div>
        ))}
      </div>

      {/* Weekly summary skeleton */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
        <div className='skeleton mb-4 h-3 w-28' />
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='flex flex-col gap-1'>
              <div className='skeleton h-3 w-24' />
              <div className='skeleton h-5 w-20' />
            </div>
          ))}
        </div>
      </div>

      {/* Day tabs skeleton */}
      <div className='flex gap-2 overflow-x-auto'>
        {[...Array(7)].map((_, i) => (
          <div key={i} className='skeleton h-9 w-14 flex-shrink-0 rounded-full' />
        ))}
      </div>

      {/* Day content skeleton */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
          <div className='skeleton mb-4 h-5 w-24' />
          {[...Array(4)].map((_, j) => (
            <div key={j} className='mb-4 rounded-lg border border-zinc-800/60 p-4'>
              <div className='skeleton mb-3 h-4 w-40' />
              <div className='grid grid-cols-3 gap-3'>
                {[...Array(3)].map((_, k) => (
                  <div key={k} className='skeleton h-3 w-full rounded' />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
