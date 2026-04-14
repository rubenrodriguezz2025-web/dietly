import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { createCheckoutAction } from '../actions/create-checkout-action';

import { DietlyPricingFallback } from './dietly-pricing-fallback';

export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const products = await getProducts();

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  // Si no hay productos Stripe en DB, mostrar pricing estático de Dietly
  const showStaticPricing = products.length === 0;

  return (
    <section className='relative rounded-lg bg-gradient-to-b from-[#0d1f12] via-[#0a1a0e] to-black py-8'>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-[140px]'>
        <HeadingLevel className='max-w-4xl bg-gradient-to-br from-white to-neutral-200 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-6xl'>
          Precios claros para cada etapa de tu consulta.
        </HeadingLevel>
        <p className='text-center text-xl'>
          Elige el plan que mejor se adapte a tu consulta. Cambia cuando quieras.
        </p>

        {showStaticPricing ? (
          <DietlyPricingFallback />
        ) : (
          <div className='flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:gap-8'>
            {products.map((product) => {
              return <PricingCard key={product.id} product={product} createCheckoutAction={createCheckoutAction} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
