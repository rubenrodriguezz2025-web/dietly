// Cómo funciona Dietly en 3 pasos
import { H2, SectionLabel } from './primitives';

const steps = [
  {
    n: '01',
    title: 'Define los márgenes',
    body: 'Kcal, macros, alergias, preferencias, restricciones. Dietly parte de lo que tú decides.',
  },
  {
    n: '02',
    title: 'Genera el borrador',
    body: 'La IA propone un plan de 7 días en ~2 minutos. No lo entrega: lo propone.',
  },
  {
    n: '03',
    title: 'Revisa, ajusta, firma',
    body: 'Editas cualquier plato. Apruebas. El paciente recibe el plan con tu marca.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Cómo funciona</SectionLabel>
        <H2 className="mt-4">Tres pasos. Tu criterio en los tres.</H2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-7"
            >
              <div className="font-display text-3xl italic text-emerald-500">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-xl text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm italic text-zinc-500">
          Todos los planes se entregan bajo supervisión profesional.
        </p>
      </div>
    </section>
  );
}
