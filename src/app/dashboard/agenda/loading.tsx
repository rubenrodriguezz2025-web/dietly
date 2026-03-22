// Skeleton loader para la agenda
export default function AgendaLoading() {
  return (
    <div className='flex flex-col gap-8'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='skeleton h-8 w-40' />
          <div className='skeleton mt-1 h-4 w-24' />
        </div>
        <div className='flex gap-2'>
          <div className='skeleton h-9 w-24 rounded-lg' />
          <div className='skeleton h-9 w-24 rounded-lg' />
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='flex flex-col gap-4 lg:col-span-2'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='rounded-xl border border-zinc-800 bg-zinc-950 p-4'>
              <div className='skeleton mb-3 h-4 w-24' />
              {[...Array(2)].map((_, j) => (
                <div key={j} className='mb-2 flex items-center gap-3 rounded-lg p-2'>
                  <div className='skeleton h-8 w-8 rounded-lg flex-shrink-0' />
                  <div className='flex flex-col gap-1.5 flex-1'>
                    <div className='skeleton h-4 w-32' />
                    <div className='skeleton h-3 w-48' />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-5'>
          <div className='skeleton mb-4 h-3 w-20' />
          <div className='flex flex-col gap-3'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='skeleton h-9 w-full rounded-lg' />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
