import type { Metadata } from 'next';

import { PricingSection } from '@/features/pricing/components/pricing-section';

export const metadata: Metadata = {
  title: 'Precios — Planes Básico y Profesional',
  description:
    'Empieza gratis con 2 pacientes. Plan Básico desde 46€/mes, Profesional 89€/mes. Sin tarjeta para empezar. IVA incluido.',
  alternates: { canonical: 'https://dietly.es/pricing' },
  openGraph: { url: 'https://dietly.es/pricing' },
};

export default function PricingPage() {
  return <PricingSection isPricingPage />;
}
