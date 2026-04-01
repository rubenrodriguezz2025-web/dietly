export default function AdminBetaLoading() {
  return (
    <div className='flex flex-col gap-8'>
      {/* Header */}
      <div>
        <div className='skeleton h-3 w-12' />
        <div className='skeleton mt-2 h-7 w-36' />
        <div className='skeleton mt-2 h-4 w-80' />
      </div>

      {/* Counter */}
      <div className='flex items-center gap-3 rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-4'>
        <div className='skeleton h-9 w-10' />
        <div className='skeleton h-4 w-44' />
      </div>

      {/* Add form */}
      <div className='rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-5'>
        <div className='skeleton mb-4 h-3 w-40' />
        <div className='flex gap-3'>
          <div className='skeleton h-10 w-full rounded-lg' />
          <div className='skeleton h-10 w-full rounded-lg' />
          <div className='skeleton h-10 w-28 flex-shrink-0 rounded-lg' />
        </div>
      </div>

      {/* Whitelist table */}
      <div className='rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-5'>
        <div className='skeleton mb-4 h-3 w-24' />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-4 border-b border-zinc-800/50 py-3'
          >
            <div className='skeleton h-4 w-48' />
            <div className='skeleton h-4 w-32' />
            <div className='skeleton h-4 w-24' />
            <div className='skeleton ml-auto h-6 w-16 rounded' />
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className='rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-5'>
        <div className='skeleton mb-5 h-3 w-44' />
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='flex flex-col gap-1.5'>
              <div className='skeleton h-3 w-20' />
              <div className='skeleton h-7 w-14' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
