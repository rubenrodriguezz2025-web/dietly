// CTA final
import { CtaButton, H2 } from './primitives';

export function FinalCtaSection() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-3xl text-center">
        <H2>Empieza con 2 pacientes gratis.</H2>
        <p className="mt-6 text-lg text-zinc-400">
          Sin tarjeta. Sin prueba limitada. Si no te convence, no pagas.
        </p>

        <div className="mt-10 flex justify-center">
          <CtaButton href="/signup">Empieza con 2 pacientes gratis</CtaButton>
        </div>

        <p className="mt-16 text-xs text-zinc-600">
          Dietly · Valencia · RGPD · Sub-encargados declarados · Soporte en español
        </p>
      </div>
    </section>
  );
}
