import type { Metadata } from 'next';

import { FAQSection } from '@/features/marketing/components/FAQSection';
import { FinalCtaSection } from '@/features/marketing/components/FinalCtaSection';
import { ForWhoSection } from '@/features/marketing/components/ForWhoSection';
import { HeroSection } from '@/features/marketing/components/HeroSection';
import { HowItWorksSection } from '@/features/marketing/components/HowItWorksSection';
import { ProblemSection } from '@/features/marketing/components/ProblemSection';
import { ProofSection } from '@/features/marketing/components/ProofSection';
import { WorkflowBar } from '@/features/marketing/components/WorkflowBar';
import { PricingSection } from '@/features/pricing/components/pricing-section';

import '@/features/marketing/styles/landing.css';

export const metadata: Metadata = {
  title: 'Dietly — Planes nutricionales con IA, bajo tu criterio profesional',
  description:
    'Software para nutricionistas colegiados en España. Genera el borrador del plan nutricional en 2 minutos, revísalo, ajústalo y fírmalo con tu marca. Empieza con 2 pacientes gratis.',
};

export default function LandingPage() {
  return (
    <div className="relative">
      <div className="landing-grain" aria-hidden="true" />
      <HeroSection />
      <WorkflowBar />
      <ProblemSection />
      <HowItWorksSection />
      <ForWhoSection />
      <ProofSection />
      <PricingSection />
      <FAQSection />
      <FinalCtaSection />
    </div>
  );
}
