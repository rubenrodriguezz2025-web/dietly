import Link from 'next/link';
import { IoCheckmark } from 'react-icons/io5';

const PLANS = [
  {
    name: 'Básico',
    price: 46,
    highlight: false,
    features: [
      'Hasta 30 pacientes activos',
      'Planes nutricionales con IA',
      'PDF profesional con tu marca',
      'PWA para el paciente',
      'Lista de la compra automática',
      'Soporte por email',
    ],
  },
  {
    name: 'Profesional',
    price: 89,
    highlight: true,
    features: [
      'Pacientes ilimitados',
      'Todo lo del plan Básico',
      'Logo propio en el PDF',
      'Firma digital en el PDF',
      'Recetario personal',
      'Soporte prioritario',
    ],
  },
] as const;

export function DietlyPricingFallback() {
  return (
    <div className='flex w-full flex-col items-center justify-center gap-4 lg:flex-row lg:gap-8'>
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={`flex w-full max-w-md flex-1 flex-col rounded-xl border p-6 lg:p-8 ${
            plan.highlight
              ? 'border-[#1a7a45]/60 bg-gradient-to-b from-[#0d1f12] to-black shadow-lg shadow-[#1a7a45]/10'
              : 'border-zinc-800 bg-black'
          }`}
        >
          {plan.highlight && (
            <span className='mb-4 w-fit rounded-full bg-[#1a7a45]/20 px-3 py-1 text-xs font-semibold text-[#22c55e]'>
              Más popular
            </span>
          )}

          <h3 className='text-xl font-bold text-white'>{plan.name}</h3>

          <div className='mt-3 flex items-baseline gap-1'>
            <span className='text-4xl font-bold text-white'>{plan.price}&euro;</span>
            <span className='text-zinc-400'>/mes</span>
          </div>
          <p className='mt-1 text-xs text-zinc-500'>IVA incluido</p>

          <ul className='mt-6 flex flex-1 flex-col gap-3'>
            {plan.features.map((feat) => (
              <li key={feat} className='flex items-start gap-2.5'>
                <IoCheckmark className='mt-0.5 h-4 w-4 flex-shrink-0 text-[#22c55e]' />
                <span className='text-sm text-zinc-300'>{feat}</span>
              </li>
            ))}
          </ul>

          <div className='mt-8'>
            <Link
              href='/signup'
              className={`block w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-colors ${
                plan.highlight
                  ? 'bg-[#1a7a45] text-white hover:bg-[#22c55e] hover:text-black'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
              }`}
            >
              Empezar 14 dias gratis
            </Link>
            <p className='mt-2 text-center text-xs text-zinc-500'>Cancela antes del día 14 sin coste</p>
          </div>
        </div>
      ))}
    </div>
  );
}
