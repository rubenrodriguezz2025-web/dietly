// Sección de problema
import { H2, SectionLabel } from './primitives';

const pains = [
  {
    title: 'La plantilla es una traición al paciente',
    body: 'Copiar-pegar documentos genéricos rompe la confianza. Cada persona tiene márgenes distintos y tú lo sabes.',
  },
  {
    title: '1-3 horas por plan, multiplicado por 20 pacientes',
    body: 'El tiempo en manual es tiempo que no dedicas a consulta, seguimiento o a tu vida fuera de la mesa.',
  },
  {
    title: 'Herramientas dispersas, criterio fragmentado',
    body: 'Excel para macros, Canva para el PDF, Gmail para enviar. Cero control sobre el resultado final.',
  },
];

export function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>El problema</SectionLabel>
        <H2 className="mt-4 max-w-3xl">
          El problema real no es generar un plan. Es que ese plan sea tuyo.
        </H2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pains.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-7"
            >
              <h3 className="font-display text-xl text-white">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
