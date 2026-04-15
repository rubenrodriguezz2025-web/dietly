// Arquetipos a los que sirve Dietly
import { H2, SectionLabel } from './primitives';

export function ForWhoSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Para quién</SectionLabel>
        <H2 className="mt-4">¿Para quién es Dietly?</H2>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-7">
            <h3 className="font-display text-xl text-white">Consulta generalista</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Autónoma con web activa, 20-60 pacientes, sin ganas de industrializarte. Dietly te quita el 80% del tiempo manual sin perder el toque personal.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-7">
            <h3 className="font-display text-xl text-white">
              Nutrición deportiva con márgenes editables
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Una frase que leí en la web de un nutricionista deportivo andaluz resume cómo entendemos Dietly:{' '}
              <em className="text-zinc-300">
                «Tú decides cómo quieres preparar los platos cada semana, dentro de los márgenes establecidos.»
              </em>{' '}
              El profesional mantiene el criterio, la herramienta acelera el borrador.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-7">
            <h3 className="font-display text-xl text-white">
              Enfoque clínico / TCA / no-pesocentrista
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Cada persona es un universo. Dietly no impone calorías por defecto: tú decides qué métricas mostrar y cuáles ocultar al paciente.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
