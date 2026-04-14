// FAQ con <details> nativo, sin JS
import { H2, SectionLabel } from './primitives';

const faqs = [
  {
    q: '¿Mis pacientes ven que el plan lo hizo una IA?',
    a: 'No. El plan se entrega en PDF con tu marca, tu logo, tu firma y tu nombre. Dietly es la herramienta que usas internamente, como usarías Excel. El paciente ve tu criterio profesional.',
  },
  {
    q: '¿Cumple RGPD para datos de salud?',
    a: 'Sí. Dietly actúa como encargado del tratamiento; tú sigues siendo responsable. Datos en Supabase región Paris (UE). PII pseudonimizada antes de enviarse a la IA. Sub-encargados declarados en los términos. Contrato de Art. 28 disponible.',
  },
  {
    q: '¿Puedo modificar cualquier plato generado?',
    a: 'Sí. El editor te permite cambiar platos, intercambiar comidas entre días, ajustar gramajes, añadir notas. El plan nunca se envía sin tu aprobación explícita (estado draft → approved).',
  },
  {
    q: '¿Qué pasa si la IA se equivoca en macros?',
    a: 'Dietly pasa cada plan por un validador clínico con 19 comprobaciones (calorías fuera de rango, macros inconsistentes, alergias respetadas, etc.). Cualquier warning se muestra antes de que puedas aprobar. Y tú firmas: la última palabra es siempre tuya.',
  },
];

export function FAQSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <SectionLabel>Preguntas frecuentes</SectionLabel>
        <H2 className="mt-4">Preguntas que nos hacen antes de empezar.</H2>

        <div className="landing-faq mt-12 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 open:border-emerald-900/60"
            >
              <summary className="flex items-center justify-between gap-6 font-semibold text-white">
                {f.q}
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
