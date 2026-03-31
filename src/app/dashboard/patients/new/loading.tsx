export default function NewPatientLoading() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div>
        <div className='skeleton h-7 w-44' />
        <div className='skeleton mt-2 h-4 w-80' />
      </div>

      {/* Form skeleton */}
      <div className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          {/* Nombre */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-16' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Email */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-14' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Teléfono */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-20' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Fecha nacimiento */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-36' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Sexo */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-12' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Objetivo */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-20' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Peso */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-16' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Altura */}
          <div className='flex flex-col gap-2'>
            <div className='skeleton h-3.5 w-16' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
          {/* Nivel actividad — full width */}
          <div className='flex flex-col gap-2 sm:col-span-2'>
            <div className='skeleton h-3.5 w-32' />
            <div className='skeleton h-10 w-full rounded-lg' />
          </div>
        </div>

        {/* Notas */}
        <div className='mt-6 flex flex-col gap-2'>
          <div className='skeleton h-3.5 w-24' />
          <div className='skeleton h-24 w-full rounded-lg' />
        </div>

        {/* Submit button */}
        <div className='mt-6 flex justify-end'>
          <div className='skeleton h-10 w-36 rounded-lg' />
        </div>
      </div>
    </div>
  );
}
