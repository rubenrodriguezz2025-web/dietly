// Hero principal de la landing
import { DashboardMockup } from './DashboardMockup';
import { CtaButton } from './primitives';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-20 sm:pt-32">
      <div className="mx-auto max-w-5xl text-center">
        <div className="fade-in-up fade-delay-1 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-400">
          Para nutricionistas colegiados en España
        </div>

        <h1 className="fade-in-up fade-delay-2 mt-8 text-balance font-display text-4xl italic leading-[1.08] text-white md:text-5xl lg:text-6xl xl:text-7xl">
          Tú decides cómo preparar los platos cada semana, dentro de los márgenes que marcas.
        </h1>

        <p className="fade-in-up fade-delay-3 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Dietly genera el borrador del plan nutricional en 2 minutos. Tú lo revisas, lo ajustas y lo firmas con tu marca.
        </p>

        <div className="fade-in-up fade-delay-4 mt-10 flex flex-col items-center gap-3">
          <CtaButton href="/signup">Empieza con 2 pacientes gratis</CtaButton>
          <p className="text-sm text-zinc-500">Sin tarjeta · Cancela cuando quieras</p>
        </div>
      </div>

      <div className="fade-in-up fade-delay-5 mx-auto mt-20 max-w-5xl">
        <DashboardMockup className="w-full rounded-xl shadow-2xl shadow-emerald-950/40" />
      </div>
    </section>
  );
}
