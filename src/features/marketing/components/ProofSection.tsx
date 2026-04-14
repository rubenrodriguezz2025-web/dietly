// Prueba honesta — sin testimonios inventados
import { CtaButton,H2, SectionLabel } from './primitives';

const proofs = [
  {
    headline: '~2 minutos',
    body: 'Tiempo real de generación de un plan completo de 7 días.',
  },
  {
    headline: 'Claude Sonnet 4.6 (Anthropic)',
    body: 'Modelo de IA. Declarado como sub-encargado del tratamiento.',
  },
  {
    headline: 'Supabase · región Paris',
    body: 'Tus datos de paciente nunca salen de la UE.',
  },
  {
    headline: 'Stripe',
    body: 'Pagos procesados por Stripe. Cancela desde su portal en un click.',
  },
  {
    headline: 'Hecho en Valencia, España',
    body: 'Proyecto independiente. Soporte directo en español.',
  },
];

export function ProofSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Lo verificable</SectionLabel>
        <H2 className="mt-4">Lo que sí podemos probar hoy.</H2>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Todavía no tenemos testimonios públicos. Lo tendremos. Mientras tanto, esto es verificable:
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {proofs.map((p) => (
            <div
              key={p.headline}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <div className="font-display text-2xl text-emerald-400">
                {p.headline}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-8 text-center">
          <p className="max-w-xl text-zinc-300">
            ¿Quieres ser uno de los primeros 10 clientes? Los primeros tienen acceso directo al equipo.
          </p>
          <CtaButton href="/signup">Empieza con 2 pacientes gratis</CtaButton>
        </div>
      </div>
    </section>
  );
}
