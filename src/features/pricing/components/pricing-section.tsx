import Link from 'next/link';
import { IoCheckmark } from 'react-icons/io5';

import { DIETLY_PLANS } from '@/features/pricing/plans-config';

export function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className='relative rounded-lg bg-gradient-to-b from-[#0d1f12] via-[#0a1a0e] to-black py-8'>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-[140px]'>
        <HeadingLevel className='max-w-4xl bg-gradient-to-br from-white to-neutral-200 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-6xl'>
          Precios claros para cada etapa de tu consulta.
        </HeadingLevel>
        <p className='text-center text-xl'>
          Elige el plan que mejor se adapte a tu consulta. Cambia cuando quieras.
        </p>

        <div className='flex w-full flex-col items-center justify-center gap-4 lg:flex-row lg:gap-8'>
          {DIETLY_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex w-full max-w-md flex-1 flex-col rounded-xl border p-6 lg:p-8 ${
                plan.recommended
                  ? 'border-[#1a7a45]/60 bg-gradient-to-b from-[#0d1f12] to-black shadow-lg shadow-[#1a7a45]/10'
                  : 'border-zinc-800 bg-black'
              }`}
            >
              {plan.recommended && (
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
                    plan.recommended
                      ? 'bg-[#1a7a45] text-white hover:bg-[#22c55e] hover:text-black'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
                  }`}
                >
                  Empieza con 2 pacientes gratis
                </Link>
                <p className='mt-2 text-center text-xs text-zinc-500'>Sin tarjeta · Cancela cuando quieras</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
