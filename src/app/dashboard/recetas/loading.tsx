export default function RecetasLoading() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='skeleton h-7 w-36' />
          <div className='skeleton mt-2 h-4 w-64' />
        </div>
        <div className='skeleton h-9 w-32 rounded-lg' />
      </div>

      {/* Search + filters */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='skeleton h-10 w-64 rounded-xl' />
        <div className='flex gap-2'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='skeleton h-7 w-20 rounded-full' />
          ))}
        </div>
      </div>

      {/* Recipe cards grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4'
          >
            <div className='flex items-center justify-between'>
              <div className='skeleton h-5 w-40' />
              <div className='skeleton h-5 w-16 rounded-full' />
            </div>
            <div className='skeleton h-3 w-full' />
            <div className='skeleton h-3 w-3/4' />
            <div className='mt-1 flex gap-3'>
              <div className='skeleton h-4 w-16' />
              <div className='skeleton h-4 w-16' />
              <div className='skeleton h-4 w-16' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
