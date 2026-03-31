export default function DerechosDatosLoading() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='skeleton h-6 w-40' />
          <div className='skeleton mt-2 h-4 w-96' />
        </div>
        <div className='skeleton h-8 w-44 rounded-lg' />
      </div>

      {/* Pendientes section */}
      <section className='flex flex-col gap-3'>
        <div className='skeleton h-3 w-28' />

        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className='rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4'
          >
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <div className='skeleton h-5 w-20 rounded-full' />
                  <div className='skeleton h-5 w-16 rounded-full' />
                  <div className='skeleton h-4 w-28' />
                </div>
                <div className='skeleton h-4 w-36' />
                <div className='skeleton h-3 w-48' />
              </div>
              <div className='skeleton h-4 w-20' />
            </div>
            <div className='mt-3 border-t border-zinc-800/60 pt-3'>
              <div className='flex gap-2'>
                <div className='skeleton h-8 w-24 rounded-lg' />
                <div className='skeleton h-8 w-24 rounded-lg' />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Info legal */}
      <div className='rounded-xl border border-zinc-800/40 bg-zinc-900/20 px-4 py-3'>
        <div className='skeleton h-3 w-full' />
        <div className='skeleton mt-1.5 h-3 w-5/6' />
        <div className='skeleton mt-1.5 h-3 w-3/4' />
      </div>
    </div>
  );
}
