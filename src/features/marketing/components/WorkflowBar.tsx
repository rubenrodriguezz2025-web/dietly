// Barra que contrasta el flujo antiguo con Dietly
import { IconArrowRight } from './icons';

export function WorkflowBar() {
  return (
    <section className="border-y border-zinc-800 bg-[#0a0f0a] px-6 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 text-sm sm:flex-row sm:gap-6">
        <span className="text-zinc-500">Excel + ChatGPT + Canva + Gmail</span>
        <IconArrowRight className="h-4 w-4 text-zinc-600" />
        <span className="rounded-md border border-emerald-900/50 bg-emerald-950/40 px-3 py-1 font-semibold text-emerald-400">
          Dietly
        </span>
      </div>
    </section>
  );
}
