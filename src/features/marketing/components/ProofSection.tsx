// Prueba honesta — sin testimonios inventados
import { CtaButton,H2, SectionLabel } from './primitives';

const proofs = [
  {
    headline: '~2 minutos',
    body: 'Tiempo real de generación de un plan completo de 7 días.',
  },
  {
    headline: 'IA especializada en dietética europea',
    body: 'Modelo entrenado con contexto nutricional y normativa sanitaria europea. PII pseudonimizada antes de cualquier procesamiento.',
  },
  {
    headline: 'Datos siempre en la UE',
    body: 'Servidores en Europa. Tus datos nunca salen del territorio comunitario. Sin excepciones.',
  },
  {
    headline: 'Pagos seguros con estándares bancarios',
    body: 'Cifrado de nivel financiero. Nosotros nunca almacenamos datos de tu tarjeta.',
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
        <SectionLabel>Garantías técnicas</SectionLabel>
        <H2 className="mt-4">Lo que sí podemos asegurarte desde el día uno.</H2>

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
            Acceso prioritario a soporte directo durante la fase de adopción temprana.
          </p>
          <CtaButton href="/signup">Empieza con 2 pacientes gratis</CtaButton>
        </div>
      </div>
    </section>
  );
}
