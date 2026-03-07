import Link from 'next/link';

import { PricingSection } from '@/features/pricing/components/pricing-section';

import { CookieBanner } from './(marketing)/_components/cookie-banner';

// ── Animaciones CSS (Server Component — sin 'use client') ─────────────────────

const ANIMATIONS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glowRing {
    0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,.3); }
    50%       { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: .4; }
  }
  .fade-up  { opacity: 0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) forwards; }
  .glow-btn { animation: glowRing 2.5s ease-in-out infinite; }
  .blink    { animation: blink 2s ease-in-out infinite; }
  .d1 { animation-delay: .08s; }
  .d2 { animation-delay: .18s; }
  .d3 { animation-delay: .30s; }
  .d4 { animation-delay: .44s; }
  .d5 { animation-delay: .58s; }
`;

// ── Página ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: ANIMATIONS }} />

      <div className='flex flex-col gap-6 lg:gap-8'>
        <HeroSection />
        <PainSection />
        <HowItWorksSection />
        <FeaturesSection />
        <LegalTrustBar />
        <PricingSection />
        <FinalCTASection />
      </div>

      <CookieBanner />
    </>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className='relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 px-6 py-20 lg:px-20 lg:py-36'>
      {/* Blob de fondo verde */}
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-0 h-[480px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-950/50 blur-3xl'
      />

      <div className='relative z-10 mx-auto max-w-3xl text-center'>
        {/* Badge */}
        <div className='fade-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-green-900 bg-green-950/60 px-4 py-1.5 text-sm font-medium text-green-400'>
          <span className='blink h-1.5 w-1.5 rounded-full bg-green-400' />
          Para nutricionistas y dietistas en España
        </div>

        {/* Titular */}
        <h1 className='fade-up d1'>
          Genera planes nutricionales completos en 2&nbsp;minutos
        </h1>

        {/* Subtítulo */}
        <p className='fade-up d2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 lg:text-xl'>
          Dietly usa IA para generar el borrador. Tú lo revisas con tu criterio
          profesional, ajustas lo que necesites y lo entregas con tu marca.
          <span className='block mt-1 text-base text-zinc-500'>
            Sin copiar y pegar. Sin plantillas genéricas. Sin perder horas.
          </span>
        </p>

        {/* CTAs */}
        <div className='fade-up d3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href='/signup'
            className='glow-btn w-full rounded-xl bg-green-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-500 sm:w-auto'
          >
            Empieza gratis — 14 días de prueba
          </Link>
          <a
            href='#como-funciona'
            className='w-full rounded-xl border border-zinc-800 px-7 py-3.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 sm:w-auto'
          >
            Ver cómo funciona →
          </a>
        </div>

        {/* Social proof */}
        <p className='fade-up d4 mt-5 text-sm text-zinc-600'>
          <span className='font-medium text-zinc-500'>50 plazas de acceso anticipado</span>
          {' · '}Sin tarjeta de crédito
          {' · '}Cancela cuando quieras
        </p>
      </div>

      {/* Barra de métricas */}
      <div className='fade-up d5 relative z-10 mx-auto mt-16 max-w-xl overflow-hidden rounded-2xl border border-zinc-800'>
        <div className='grid grid-cols-3 divide-x divide-zinc-800'>
          {[
            { num: '2 min', label: 'por plan completo' },
            { num: '7 días', label: 'con macros por comida' },
            { num: '100%', label: 'revisado por ti' },
          ].map((s) => (
            <div key={s.num} className='bg-zinc-900 px-4 py-5 text-center'>
              <p className='font-alt text-2xl font-bold text-white'>{s.num}</p>
              <p className='mt-0.5 text-xs text-zinc-500'>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Dolor ──────────────────────────────────────────────────────────────────────

const PAINS = [
  {
    title: '1-3 horas por plan nutricional',
    desc: 'Cada semana el mismo proceso manual: calcular macros, buscar recetas compatibles con las restricciones del paciente, formatear el documento, imprimir o enviar.',
  },
  {
    title: 'Plantillas que nunca encajan del todo',
    desc: 'Adaptar el plan de otro paciente nunca captura bien las particularidades de cada persona. El resultado es genérico y el paciente lo nota.',
  },
  {
    title: 'Pacientes que no siguen el plan',
    desc: 'Un PDF enviado por WhatsApp no es una experiencia profesional. Sin macros visibles por comida, sin navegación fácil en móvil.',
  },
];

function PainSection() {
  return (
    <section className='rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-6 py-14 lg:px-16 lg:py-20'>
      <div className='mx-auto max-w-4xl'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-600'>
          El problema
        </p>
        <h2 className='font-alt text-2xl font-bold text-zinc-100 lg:text-3xl'>
          ¿Sigues tardando más de 1 hora en cada plan?
        </h2>
        <p className='mt-3 max-w-xl text-sm text-zinc-500'>
          El método manual que usan la mayoría de nutricionistas tiene un coste invisible que
          se acumula semana tras semana.
        </p>

        <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className='flex gap-4 rounded-xl border border-red-900/40 bg-red-950/20 p-5'
            >
              <span className='mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-950 text-xs font-bold text-red-400'>
                ✕
              </span>
              <div>
                <p className='text-sm font-semibold text-zinc-200'>{pain.title}</p>
                <p className='mt-1.5 text-xs leading-relaxed text-zinc-500'>{pain.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Cómo funciona ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '1',
    tiempo: '2 min',
    title: 'Crea la ficha del paciente',
    desc: 'Introduce sus datos biométricos, objetivo, nivel de actividad, alergias y preferencias. O envíale el cuestionario de intake para que lo rellene él desde su móvil.',
  },
  {
    n: '2',
    tiempo: '2 min',
    title: 'La IA genera el borrador',
    desc: 'Claude genera 7 días completos: cada comida con nombre, ingredientes en gramos, preparación paso a paso, macros y lista de la compra. Sin comidas en blanco.',
  },
  {
    n: '3',
    tiempo: 'Tu criterio',
    title: 'Revisas, ajustas y entregas',
    desc: 'Edita cualquier comida con tu criterio clínico. Aprueba el plan y envíalo como PDF con tu logo y colores. Tu paciente lo ve en el móvil como una app — sin descargas, sin login.',
  },
];

function HowItWorksSection() {
  return (
    <section
      id='como-funciona'
      className='rounded-2xl border border-zinc-900 bg-zinc-950 px-6 py-14 lg:px-16 lg:py-20'
    >
      <div className='mx-auto max-w-4xl'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-600'>
          Cómo funciona
        </p>
        <h2 className='font-alt text-2xl font-bold text-zinc-100 lg:text-3xl'>
          De los datos del paciente al plan entregado en 5 minutos
        </h2>

        <div className='mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3'>
          {STEPS.map((step) => (
            <div key={step.n} className='flex flex-col gap-4'>
              <div className='flex items-center gap-3'>
                <span className='flex h-9 w-9 items-center justify-center rounded-full border border-green-800 bg-green-950 font-alt text-sm font-bold text-green-400'>
                  {step.n}
                </span>
                <span className='rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-zinc-500'>
                  {step.tiempo}
                </span>
              </div>
              <h3 className='font-semibold text-zinc-100'>{step.title}</h3>
              <p className='text-sm leading-relaxed text-zinc-500'>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Nota profesional */}
        <div className='mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4'>
          <p className='text-xs leading-relaxed text-zinc-500'>
            <span className='font-semibold text-zinc-400'>Nota importante: </span>
            Dietly genera el borrador. El plan solo puede entregarse al paciente una vez que
            el nutricionista lo revisa y aprueba con su criterio profesional. El botón de envío
            está desactivado hasta entonces — no es solo UX, es la cobertura legal del producto.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Funcionalidades ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '⚡',
    bg: 'bg-amber-950 text-amber-300',
    title: 'Planes en 2 minutos',
    desc: 'Claude AI genera 7 días completos con comidas, ingredientes en gramos, macros por comida y lista de la compra. Sin comidas en blanco, garantizado.',
  },
  {
    icon: '📄',
    bg: 'bg-blue-950 text-blue-300',
    title: 'PDF con tu marca',
    desc: 'Tu logotipo, colores corporativos y nombre de clínica en cada PDF. Plan Profesional incluye branding 100% personalizado.',
  },
  {
    icon: '📱',
    bg: 'bg-violet-950 text-violet-300',
    title: 'App del paciente',
    desc: 'El paciente abre un enlace y ve su plan en el móvil como una app. Plan por días, macros visibles, lista de compra. Sin descargas, sin login.',
  },
  {
    icon: '📅',
    bg: 'bg-sky-950 text-sky-300',
    title: 'Agenda integrada',
    desc: 'Citas presenciales y videollamadas vinculadas a cada paciente. Sin Google Calendar externo, todo en el mismo sitio.',
  },
  {
    icon: '📝',
    bg: 'bg-teal-950 text-teal-300',
    title: 'Cuestionario intake',
    desc: 'Envía un link al paciente antes de la primera consulta. Rellena sus datos y llega preparado. Tú ahorras tiempo de consulta.',
  },
  {
    icon: '🛡️',
    bg: 'bg-green-950 text-green-300',
    title: 'Cumplimiento legal',
    desc: 'RGPD, Ley 44/2003 y Ley 41/2002. Dietly actúa como encargado del tratamiento. T&Cs con cobertura completa para tu consulta.',
  },
];

function FeaturesSection() {
  return (
    <section className='px-0 py-2'>
      <div className='mx-auto max-w-5xl text-center'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-600'>
          Funcionalidades
        </p>
        <h2 className='font-alt text-2xl font-bold text-zinc-100 lg:text-3xl'>
          Todo lo que necesitas para tu consulta
        </h2>
        <p className='mx-auto mt-3 max-w-lg text-sm text-zinc-500'>
          No es solo generación de planes. Es el flujo de trabajo completo del nutricionista moderno.
        </p>

        <div className='mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className='rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900'
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${f.bg}`}
              >
                {f.icon}
              </span>
              <h3 className='mt-4 text-sm font-semibold text-zinc-100'>{f.title}</h3>
              <p className='mt-1.5 text-xs leading-relaxed text-zinc-500'>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Barra de confianza legal ───────────────────────────────────────────────────

const TRUST = [
  { icon: '🔒', text: 'Datos cifrados en reposo · Supabase (RGPD)' },
  { icon: '⚖️', text: 'Ley 44/2003 — herramienta para profesionales titulados' },
  { icon: '📋', text: 'T&Cs con cláusula de encargado del tratamiento' },
];

function LegalTrustBar() {
  return (
    <section className='rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-6 py-5'>
      <div className='flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10'>
        {TRUST.map((item) => (
          <div key={item.icon} className='flex items-center gap-2'>
            <span className='text-base'>{item.icon}</span>
            <span className='text-xs text-zinc-500'>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── CTA final ──────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className='relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 px-6 py-16 text-center lg:px-16 lg:py-24'>
      {/* Blob */}
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-950/35 blur-3xl'
      />

      <div className='relative z-10 mx-auto max-w-xl'>
        <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600'>
          ¿Todo claro?
        </p>
        <h2 className='font-alt text-2xl font-bold text-zinc-100 lg:text-4xl'>
          Empieza a ahorrar horas esta semana
        </h2>
        <p className='mt-4 text-sm leading-relaxed text-zinc-400'>
          14 días de prueba gratuita. Sin tarjeta de crédito. Sin permanencia.
          Cancela cuando quieras desde tu panel de usuario.
        </p>
        <div className='mt-8'>
          <Link
            href='/signup'
            className='glow-btn inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-500'
          >
            Crear cuenta gratis →
          </Link>
        </div>
        <p className='mt-4 text-xs text-zinc-700'>
          ¿Ya tienes cuenta?{' '}
          <Link href='/login' className='text-zinc-500 transition-colors hover:text-zinc-400'>
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  );
}
