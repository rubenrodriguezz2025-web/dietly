import Link from 'next/link';

import { PricingSection } from '@/features/pricing/components/pricing-section';

import { CookieBanner } from './(marketing)/_components/cookie-banner';

// ── Sistema de diseño ─────────────────────────────────────────────────────────
//
//  Fondo base:   #0a0f0a   (negro verdoso)
//  Superficie:   #0d140d   (fondo elevado)
//  Borde:        #1a2e1a   (borde sutil)
//  Acento 1:     #1a7a45   (verde primario)
//  Acento 2:     #22c55e   (verde brillante / highlight)
//
// ── Estilos globales (Server Component — sin 'use client') ────────────────────

const CSS = `
  /* — Animaciones — */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glowRing {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.25); }
    50%       { box-shadow: 0 0 0 14px rgba(34,197,94,0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .35; }
  }
  .fade-up  { opacity: 0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) forwards; }
  .glow-btn { animation: glowRing 2.6s ease-in-out infinite; }
  .pulse    { animation: pulse 2s ease-in-out infinite; }
  .d1 { animation-delay: .08s; }
  .d2 { animation-delay: .18s; }
  .d3 { animation-delay: .30s; }
  .d4 { animation-delay: .44s; }
  .d5 { animation-delay: .58s; }

  /* — Unificación sección de precios — */
  #precios > section {
    background-color: #0a0f0a !important;
    border: 1px solid #1a2e1a !important;
    border-radius: 1rem !important;
  }
  #precios .bg-black {
    background-color: #0d140d !important;
  }
  #precios .border-zinc-800 {
    border-color: #1a2e1a !important;
  }
  /* Ocultar imagen de fondo del boilerplate */
  #precios img.absolute {
    display: none !important;
  }
  /* Hover en tarjetas de funcionalidades */
  .feature-card:hover {
    border-color: rgba(26,122,69,.45) !important;
    background: #0d1f12 !important;
  }

  /* Sustituir gradiente arcoíris del borde animado por verde */
  #precios .animate-spin-slow {
    background-image: linear-gradient(
      135deg,
      #051a0c 0%,
      #1a7a45 35%,
      #22c55e 50%,
      #1a7a45 65%,
      #051a0c 100%
    ) !important;
  }
`;

// ── Página ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className='flex flex-col gap-6 lg:gap-8'>
        <HeroSection />
        <PainSection />
        <HowItWorksSection />
        <FeaturesSection />
        <LegalTrustBar />
        <div id='precios'>
          <PricingSection />
        </div>
        <FinalCTASection />
      </div>

      <CookieBanner />
    </>
  );
}

// ── Primitivos reutilizables ───────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-[#1a7a45]'>
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className='font-alt text-2xl font-bold text-zinc-100 lg:text-3xl'>{children}</h2>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className='relative overflow-hidden rounded-2xl border border-[#1a2e1a] bg-[#0a0f0a] px-6 py-20 lg:px-20 lg:py-36'>
      {/* Blob de fondo */}
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'
        style={{ background: 'radial-gradient(ellipse, rgba(26,122,69,.18) 0%, transparent 70%)' }}
      />

      <div className='relative z-10 mx-auto max-w-3xl text-center'>
        {/* Badge */}
        <div className='fade-up mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#1a7a45]/35 bg-[#0d1f12] px-4 py-1.5 text-sm font-medium text-[#22c55e]'>
          <span className='pulse h-1.5 w-1.5 rounded-full bg-[#22c55e]' />
          Para nutricionistas y dietistas en España
        </div>

        {/* Titular */}
        <h1 className='fade-up d1'>
          Genera planes nutricionales completos en 2&nbsp;minutos
        </h1>

        {/* Subtítulo */}
        <p className='fade-up d2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 lg:text-xl'>
          Dietly usa IA para generar el borrador. Tú lo revisas con tu criterio profesional,
          ajustas lo que necesites y lo entregas con tu marca.
          <span className='mt-1 block text-base text-zinc-500'>
            Sin copiar y pegar. Sin plantillas genéricas. Sin perder horas.
          </span>
        </p>

        {/* CTAs */}
        <div className='fade-up d3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Link
            href='/signup'
            className='glow-btn w-full rounded-xl bg-[#1a7a45] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black sm:w-auto'
          >
            Empieza gratis — 14 días de prueba
          </Link>
          <a
            href='#como-funciona'
            className='w-full rounded-xl border border-[#1a2e1a] px-7 py-3.5 text-sm font-medium text-zinc-400 transition-colors hover:border-[#1a7a45]/60 hover:text-zinc-200 sm:w-auto'
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
      <div className='fade-up d5 relative z-10 mx-auto mt-16 max-w-xl overflow-hidden rounded-2xl border border-[#1a2e1a]'>
        <div className='grid grid-cols-3 divide-x divide-[#1a2e1a]'>
          {[
            { num: '2 min', label: 'por plan completo' },
            { num: '7 días', label: 'con macros por comida' },
            { num: '100%', label: 'revisado por ti' },
          ].map((s) => (
            <div key={s.num} className='bg-[#0d140d] px-4 py-5 text-center'>
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
    <section className='rounded-2xl border border-[#1a2e1a] bg-[#0d140d] px-6 py-14 lg:px-16 lg:py-20'>
      <div className='mx-auto max-w-4xl'>
        <SectionLabel>El problema</SectionLabel>
        <SectionHeading>¿Sigues tardando más de 1 hora en cada plan?</SectionHeading>
        <p className='mt-3 max-w-xl text-sm text-zinc-500'>
          El método manual que usan la mayoría de nutricionistas tiene un coste invisible que
          se acumula semana tras semana.
        </p>

        <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className='flex gap-4 rounded-xl border border-[#1a2e1a] bg-[#0a0f0a] p-5'
            >
              <span className='mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#111811] text-xs font-bold text-zinc-600'>
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
    desc: 'Edita cualquier comida con tu criterio clínico. Aprueba el plan y envíalo como PDF con tu logo. Tu paciente lo ve en el móvil como una app — sin descargas, sin login.',
  },
];

function HowItWorksSection() {
  return (
    <section
      id='como-funciona'
      className='rounded-2xl border border-[#1a2e1a] bg-[#0a0f0a] px-6 py-14 lg:px-16 lg:py-20'
    >
      <div className='mx-auto max-w-4xl'>
        <SectionLabel>Cómo funciona</SectionLabel>
        <SectionHeading>De los datos del paciente al plan entregado en 5 minutos</SectionHeading>

        <div className='mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3'>
          {STEPS.map((step) => (
            <div key={step.n} className='flex flex-col gap-4'>
              <div className='flex items-center gap-3'>
                <span
                  className='flex h-9 w-9 items-center justify-center rounded-full font-alt text-sm font-bold text-[#22c55e]'
                  style={{ border: '1px solid #1a7a45', background: '#0d1f12' }}
                >
                  {step.n}
                </span>
                <span
                  className='rounded-full px-2.5 py-0.5 text-xs font-medium text-zinc-500'
                  style={{ border: '1px solid #1a2e1a', background: '#0d140d' }}
                >
                  {step.tiempo}
                </span>
              </div>
              <h3 className='font-semibold text-zinc-100'>{step.title}</h3>
              <p className='text-sm leading-relaxed text-zinc-500'>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Nota profesional */}
        <div
          className='mt-10 rounded-xl px-5 py-4'
          style={{ border: '1px solid #1a2e1a', background: '#0d140d' }}
        >
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
    title: 'Planes en 2 minutos',
    desc: 'Claude AI genera 7 días completos con comidas, ingredientes en gramos, macros por comida y lista de la compra. Sin comidas en blanco, garantizado.',
  },
  {
    icon: '📄',
    title: 'PDF con tu marca',
    desc: 'Tu logotipo, colores corporativos y nombre de clínica en cada PDF. Plan Profesional incluye branding 100% personalizado.',
  },
  {
    icon: '📱',
    title: 'App del paciente',
    desc: 'El paciente abre un enlace y ve su plan en el móvil como una app. Plan por días, macros visibles, lista de compra. Sin descargas, sin login.',
  },
  {
    icon: '📅',
    title: 'Agenda integrada',
    desc: 'Citas presenciales y videollamadas vinculadas a cada paciente. Sin Google Calendar externo, todo en el mismo sitio.',
  },
  {
    icon: '📝',
    title: 'Cuestionario intake',
    desc: 'Envía un link al paciente antes de la primera consulta. Rellena sus datos y llega preparado. Tú ahorras tiempo de consulta.',
  },
  {
    icon: '🛡️',
    title: 'Cumplimiento legal',
    desc: 'RGPD, Ley 44/2003 y Ley 41/2002. Dietly actúa como encargado del tratamiento. T&Cs con cobertura completa para tu consulta.',
  },
];

function FeaturesSection() {
  return (
    <section className='rounded-2xl border border-[#1a2e1a] bg-[#0d140d] px-6 py-14 lg:px-16 lg:py-20'>
      <div className='mx-auto max-w-5xl text-center'>
        <SectionLabel>Funcionalidades</SectionLabel>
        <SectionHeading>Todo lo que necesitas para tu consulta</SectionHeading>
        <p className='mx-auto mt-3 max-w-lg text-sm text-zinc-500'>
          No es solo generación de planes. Es el flujo de trabajo completo del nutricionista moderno.
        </p>

        <div className='mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className='feature-card rounded-xl p-5 transition-colors'
              style={{
                border: '1px solid #1a2e1a',
                background: '#0a0f0a',
              }}
            >
              <span
                className='flex h-10 w-10 items-center justify-center rounded-xl text-lg'
                style={{ background: '#0d1f12' }}
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
    <section
      className='rounded-xl px-6 py-5'
      style={{ border: '1px solid #1a2e1a', background: 'rgba(13,20,13,.6)' }}
    >
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
    <section
      className='relative overflow-hidden rounded-2xl px-6 py-16 text-center lg:px-16 lg:py-24'
      style={{ border: '1px solid #1a2e1a', background: '#0a0f0a' }}
    >
      {/* Blob */}
      <div
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'
        style={{ background: 'radial-gradient(ellipse, rgba(26,122,69,.15) 0%, transparent 70%)' }}
      />

      <div className='relative z-10 mx-auto max-w-xl'>
        <SectionLabel>¿Todo claro?</SectionLabel>
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
            className='glow-btn inline-flex items-center gap-2 rounded-xl bg-[#1a7a45] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black'
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
