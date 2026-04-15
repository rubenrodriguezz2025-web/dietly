import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Sistema de diseño — Dietly Landing
//
//  Fondo base:   #050a05   (negro verdoso — coherente con el dashboard)
//  Superficie:   #0a0f0a   (sección alternada)
//  Card:         #0d140d   (tarjeta elevada)
//  Borde sutil:  #1a2e1a
//  Verde primario: #1a7a45
//  Verde highlight: #22c55e
//  Texto:        zinc-100 / zinc-400 / zinc-500
//
//  Server Component — animaciones CSS puras, sin librerías externas
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(22px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(26,122,69,.3); }
    50%      { box-shadow: 0 0 0 12px rgba(26,122,69,0); }
  }
  @keyframes blink {
    0%,100% { opacity:1; } 50% { opacity:.3; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fu, .fu1,.fu2,.fu3,.fu4,.fu5 { animation: none !important; opacity:1 !important; }
    .glow-btn { animation: none !important; }
    .blink { animation: none !important; }
  }
  .fu  { opacity:0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) forwards; }
  .fu1 { opacity:0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) .08s forwards; }
  .fu2 { opacity:0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) .18s forwards; }
  .fu3 { opacity:0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) .30s forwards; }
  .fu4 { opacity:0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) .44s forwards; }
  .fu5 { opacity:0; animation: fadeUp .65s cubic-bezier(.16,1,.3,1) .60s forwards; }
  .glow-btn { animation: glowPulse 2.8s ease-in-out infinite; }
  .blink     { animation: blink 2.2s ease-in-out infinite; }

  /* Feature cards hover */
  .feat-card { transition: border-color .2s, background .2s; }
  .feat-card:hover { border-color: rgba(26,122,69,.5) !important; background: #0d1f12 !important; }

  /* Table row hover */
  .comp-row { transition: background .15s; }
  .comp-row:hover { background: rgba(26,122,69,.05); }

  /* Testimonial cards */
  .testi-card { transition: border-color .2s; }
  .testi-card:hover { border-color: rgba(26,122,69,.35) !important; }

  /* Check icon color */
  .check-green { color: #22c55e; }
  .cross-red   { color: #ef4444; }
  .warn-amber  { color: #f59e0b; }

  /* ── Fondo premium ─────────────────────────────────────────────────────── */

  /* Degradado vertical que recorre toda la landing */
  .landing-bg {
    background: linear-gradient(to bottom, #0a1f10 0%, #071408 40%, #050a05 70%, #050a05 100%);
  }

  /* Capa de ruido — grain sutil tipo impresión de calidad */
  .grain {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.038;
    background-image: url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.72%22 numOctaves=%224%22 stitchTiles=%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect width=%22300%22 height=%22300%22 filter=%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E");
    background-size: 200px 200px;
    background-repeat: repeat;
  }

  /* Separadores de sección — línea verde muy tenue */
  .sect-div {
    border-top: 1px solid rgba(26,122,69,0.10);
  }
`;

// ─── Primitivos ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a7a45]'>
      {children}
    </p>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-2xl font-bold leading-snug text-zinc-100 lg:text-3xl ${className}`}>
      {children}
    </h2>
  );
}

function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className='glow-btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a7a45] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]'
    >
      {children}
    </Link>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconSpreadsheet = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <rect x='3' y='3' width='18' height='18' rx='2'/>
    <path d='M3 9h18M3 15h18M9 3v18'/>
  </svg>
);

const IconDocument = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'/>
    <polyline points='14 2 14 8 20 8'/>
    <line x1='8' y1='13' x2='16' y2='13'/>
    <line x1='8' y1='17' x2='12' y2='17'/>
  </svg>
);

const IconDesign = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <circle cx='12' cy='12' r='3'/>
    <path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83'/>
  </svg>
);

const IconChat = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'/>
    <line x1='9' y1='10' x2='15' y2='10'/>
    <line x1='9' y1='14' x2='13' y2='14'/>
  </svg>
);

const IconArrow = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <line x1='5' y1='12' x2='19' y2='12'/>
    <polyline points='12 5 19 12 12 19'/>
  </svg>
);

const IconCheck = ({ className = 'check-green' }: { className?: string }) => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className={`h-5 w-5 ${className}`} aria-label='Sí' role='img'>
    <polyline points='20 6 9 17 4 12'/>
  </svg>
);

const IconX = ({ className = 'cross-red' }: { className?: string }) => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className={`h-5 w-5 ${className}`} aria-label='No' role='img'>
    <line x1='18' y1='6' x2='6' y2='18'/>
    <line x1='6' y1='6' x2='18' y2='18'/>
  </svg>
);

const IconWarn = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5 warn-amber' aria-label='Parcial' role='img'>
    <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'/>
    <line x1='12' y1='9' x2='12' y2='13'/>
    <line x1='12' y1='17' x2='12.01' y2='17'/>
  </svg>
);

// Feature icons
const IconPlan = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <path d='M9 11l3 3L22 4'/><path d='M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'/>
  </svg>
);
const IconEdit = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7'/><path d='M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'/>
  </svg>
);
const IconPdf = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10 9 9 9 8 9'/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <rect x='5' y='2' width='14' height='20' rx='2' ry='2'/><line x1='12' y1='18' x2='12.01' y2='18'/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/>
  </svg>
);
const IconShield = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5' aria-hidden='true'>
    <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/>
  </svg>
);

// ─── Dashboard Mockup (SVG ilustrativo) ───────────────────────────────────────

function DashboardMockup() {
  return (
    <div className='fu4 relative mx-auto mt-14 w-full max-w-3xl overflow-hidden rounded-2xl border border-[#1a2e1a] bg-[#0a0f0a] shadow-2xl shadow-black/60' role='img' aria-label='Vista previa del editor de planes de Dietly'>
      {/* Window bar */}
      <div className='flex items-center gap-2 border-b border-[#1a2e1a] bg-[#0d140d] px-4 py-3'>
        <span className='h-3 w-3 rounded-full bg-zinc-700'/>
        <span className='h-3 w-3 rounded-full bg-zinc-700'/>
        <span className='h-3 w-3 rounded-full bg-zinc-700'/>
        <span className='ml-3 flex-1 rounded bg-zinc-800/60 px-3 py-1 text-center text-xs text-zinc-600'>dietly.es/dashboard/plans</span>
      </div>

      {/* Content preview */}
      <div className='grid grid-cols-3 divide-x divide-[#1a2e1a]'>
        {/* Sidebar */}
        <div className='hidden border-r border-[#1a2e1a] bg-[#0d140d] p-4 sm:block'>
          <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600'>Paciente</p>
          <p className='text-sm font-semibold text-zinc-200'>María G.</p>
          <p className='mt-0.5 text-xs text-zinc-500'>Objetivo: pérdida de peso</p>
          <div className='mt-4 space-y-1'>
            {['1.800 kcal/día', '130g proteína', '65g grasa'].map(m => (
              <div key={m} className='rounded-lg border border-[#1a2e1a] bg-[#0a0f0a] px-2.5 py-1.5 text-xs text-zinc-400'>{m}</div>
            ))}
          </div>
          <div className='mt-4'>
            <div className='mb-1 flex items-center justify-between text-xs'>
              <span className='text-zinc-600'>Generando…</span>
              <span className='text-[#22c55e]'>3/7</span>
            </div>
            <div className='h-1.5 overflow-hidden rounded-full bg-zinc-800'>
              <div className='h-full w-[43%] rounded-full bg-[#1a7a45]'/>
            </div>
          </div>
        </div>

        {/* Main — plan editor */}
        <div className='col-span-3 p-4 sm:col-span-2'>
          <div className='mb-3 flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold text-zinc-100'>Plan semanal · Miércoles</p>
              <p className='text-xs text-zinc-600'>Bajo tu supervisión profesional</p>
            </div>
            <span className='rounded-full border border-amber-800/50 bg-amber-950/50 px-2.5 py-0.5 text-xs font-medium text-amber-400'>Borrador</span>
          </div>
          <div className='space-y-2'>
            {[
              { meal: 'Desayuno', name: 'Avena con fruta y nueces', kcal: '420 kcal', macros: '18P · 52C · 16G' },
              { meal: 'Almuerzo', name: 'Pollo con arroz integral y verduras', kcal: '620 kcal', macros: '48P · 62C · 18G' },
              { meal: 'Merienda', name: 'Yogur griego con semillas de chía', kcal: '190 kcal', macros: '14P · 20C · 6G' },
            ].map(({ meal, name, kcal, macros }) => (
              <div key={meal} className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>{meal}</p>
                    <p className='mt-0.5 text-sm text-zinc-200'>{name}</p>
                  </div>
                  <div className='flex-shrink-0 rounded-lg border border-[#1a2e1a] bg-[#0a0f0a] px-2.5 py-1.5 text-right'>
                    <p className='text-xs font-semibold text-zinc-300'>{kcal}</p>
                    <p className='text-xs text-zinc-600'>{macros}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-3 flex justify-end'>
            <div className='rounded-lg bg-[#1a7a45] px-4 py-2 text-xs font-semibold text-white'>
              Aprobar plan →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Secciones ────────────────────────────────────────────────────────────────

// 1. Hero

function HeroSection() {
  return (
    <section className='relative overflow-hidden pb-20 pt-10 lg:pb-28 lg:pt-16'>
      {/* Blob 1 — superior izquierda, luz verde filtrada */}
      <div
        aria-hidden
        className='pointer-events-none absolute'
        style={{
          top: '-120px',
          left: '-160px',
          width: '700px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(26,122,69,0.20) 0%, transparent 68%)',
          filter: 'blur(90px)',
        }}
      />
      {/* Blob 2 — superior derecha, verde más profundo */}
      <div
        aria-hidden
        className='pointer-events-none absolute'
        style={{
          top: '-80px',
          right: '-120px',
          width: '580px',
          height: '520px',
          background: 'radial-gradient(ellipse at center, rgba(13,51,32,0.28) 0%, transparent 65%)',
          filter: 'blur(110px)',
        }}
      />
      {/* Blob 3 — centro superior, halo difuso muy sutil */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0'
        style={{
          top: '0',
          height: '400px',
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(26,122,69,0.10) 0%, transparent 75%)',
          filter: 'blur(40px)',
        }}
      />

      <div className='relative z-10 mx-auto max-w-6xl px-5 text-center'>
        {/* Badge */}
        <div className='fu mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#1a2e1a] bg-[#0d1f12] px-4 py-1.5 text-sm font-medium text-[#22c55e]'>
          <span className='blink h-1.5 w-1.5 rounded-full bg-[#22c55e]' aria-hidden/>
          Para nutricionistas y dietistas en España
        </div>

        {/* Titular */}
        <h1 className='fu1 mx-auto max-w-3xl text-3xl font-bold leading-tight tracking-tight text-zinc-100 lg:text-5xl'>
          Genera planes nutricionales en 2 minutos.{' '}
          <span className='text-[#22c55e]'>Tú revisas y entregas.</span>
        </h1>

        {/* Subtítulo */}
        <p className='fu2 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 lg:text-lg'>
          Dietly genera el borrador del plan nutricional completo. Tú lo revisas, ajustas y lo entregas con tu marca.
          Tu paciente lo recibe en su móvil en minutos.
        </p>

        {/* CTA */}
        <div className='fu3 mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
          <Link
            href='/signup'
            className='glow-btn inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#1a7a45] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a7a45]/25 transition-all duration-200 hover:bg-[#22c55e] hover:shadow-[#22c55e]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a7a45]'
          >
            Empieza con 2 pacientes gratis →
          </Link>
          <a
            href='/p/demo'
            target='_blank'
            rel='noopener noreferrer'
            className='group inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-[#1a2e1a] px-7 py-3.5 text-sm font-medium text-zinc-400 transition-colors hover:border-[#1a7a45]/50 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500'
          >
            Ver plan de ejemplo →
          </a>
        </div>
        <p className='fu3 mt-3 text-center text-xs text-zinc-400'>
          Sin tarjeta · Cancela cuando quieras
        </p>

        {/* Precios inline */}
        <div className='fu3 mt-6 flex items-center justify-center gap-6 text-sm'>
          <div className='text-center'>
            <span className='font-bold text-zinc-100'>46€</span>
            <span className='text-zinc-500'>/mes · Básico</span>
          </div>
          <span className='text-zinc-700'>|</span>
          <div className='text-center'>
            <span className='font-bold text-zinc-100'>89€</span>
            <span className='text-zinc-500'>/mes · Pro</span>
          </div>
        </div>
        <p className='fu3 mt-4 text-xs text-zinc-700'>
          ¿Ya tienes cuenta?{' '}
          <Link href='/login' className='text-zinc-500 transition-colors hover:text-zinc-400'>
            Inicia sesión
          </Link>
        </p>

        {/* Métricas */}
        <div className='fu4 mx-auto mt-10 grid max-w-lg grid-cols-3 overflow-hidden rounded-2xl border border-[#1a2e1a]'>
          {[
            { num: '2 min', label: 'borrador completo' },
            { num: '7 días', label: 'macros por comida' },
            { num: '100%', label: 'bajo tu supervisión' },
          ].map((s) => (
            <div key={s.num} className='border-r border-[#1a2e1a] bg-[#0d140d] px-4 py-5 text-center last:border-r-0'>
              <p className='text-xl font-bold text-zinc-100 lg:text-2xl'>{s.num}</p>
              <p className='mt-0.5 text-xs text-zinc-600'>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
}

// 2. Barra de flujo

const TOOLS = [
  { icon: <IconSpreadsheet />, label: 'Hoja de cálculo' },
  { icon: <IconDocument />, label: 'Procesador de texto' },
  { icon: <IconDesign />, label: 'Herramienta de diseño' },
  { icon: <IconChat />, label: 'IA generalista' },
];

function WorkflowBar() {
  return (
    <section className='sect-div border-b border-[#1a2e1a]/60 py-10'>
      <div className='mx-auto max-w-6xl px-5'>
        <p className='mb-8 text-center text-sm font-semibold text-zinc-400'>
          Tu flujo de trabajo actual, unificado
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4'>
          {TOOLS.map((tool, i) => (
            <div key={tool.label} className='flex items-center gap-3 sm:gap-4'>
              <div className='flex flex-col items-center gap-2'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-[#1a2e1a] bg-[#0d140d] text-zinc-500'>
                  {tool.icon}
                </div>
                <span className='text-xs text-zinc-600'>{tool.label}</span>
              </div>
              {i < TOOLS.length - 1 && (
                <span className='mb-5 text-zinc-700' aria-hidden>
                  <IconArrow />
                </span>
              )}
            </div>
          ))}

          {/* Flecha final → Dietly */}
          <span className='mb-5 text-[#1a7a45]' aria-hidden>
            <IconArrow />
          </span>
          <div className='flex flex-col items-center gap-2'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-[#1a7a45]/50 bg-[#0d1f12] font-bold text-[#22c55e] text-sm'>
              D
            </div>
            <span className='text-xs font-semibold text-[#22c55e]'>Todo en uno</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// 3. Problema

const PAINS = [
  {
    title: '1-3 horas por paciente nuevo',
    desc: 'Calcular macros en hojas de cálculo semana tras semana — el mismo proceso manual que acumula horas invisibles.',
  },
  {
    title: 'Calidad inconsistente a escala',
    desc: 'El plan número 10 del día nunca tiene la misma dedicación que el primero. El paciente lo percibe.',
  },
  {
    title: 'Las IAs generalistas no cumplen el RGPD',
    desc: 'Introducir datos de salud de tus pacientes en chatbots genera responsabilidad legal. No tienen contrato de encargo de tratamiento.',
  },
] as const;

function ProblemSection() {
  return (
    <section className='sect-div py-16 lg:py-24'>
      <div className='mx-auto max-w-6xl px-5'>
        <SectionLabel>El problema</SectionLabel>
        <H2>¿Cuánto tiempo pierdes cada semana?</H2>
        <p className='mt-3 max-w-lg text-sm leading-relaxed text-zinc-500'>
          El método manual que usan la mayoría de nutricionistas tiene un coste invisible que
          crece con cada paciente nuevo.
        </p>

        <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className='feat-card rounded-xl border border-[#1a2e1a] bg-[#0a0f0a] p-5'
            >
              <div className='mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30'>
                <IconX className='cross-red h-4 w-4' />
              </div>
              <p className='text-sm font-semibold text-zinc-200'>{pain.title}</p>
              <p className='mt-2 text-xs leading-relaxed text-zinc-500'>{pain.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. Cómo funciona

const STEPS = [
  {
    n: '1',
    tiempo: '2 min',
    title: 'Introduces los datos del paciente',
    desc: 'Biométricos, objetivo, nivel de actividad, alergias y preferencias. O envíale el cuestionario de intake para que lo rellene él desde el móvil.',
  },
  {
    n: '2',
    tiempo: '2 min',
    title: 'Dietly genera el borrador completo',
    desc: '7 días con comidas, ingredientes en gramos, preparación paso a paso, macros por comida y lista de la compra. Sin comidas en blanco.',
  },
  {
    n: '3',
    tiempo: 'Tú decides',
    title: 'Revisas, editas y apruebas. Tu paciente lo recibe en el móvil.',
    desc: 'Edita cualquier campo con tu criterio clínico. El plan se entrega solo cuando lo apruebas — no antes. Tu paciente lo ve como una app, sin descargas.',
  },
] as const;

function HowItWorksSection() {
  return (
    <section id='como-funciona' className='sect-div py-16 lg:py-24'>
      <div className='mx-auto max-w-6xl px-5'>
        <SectionLabel>Cómo funciona</SectionLabel>
        <H2>La IA prepara. Tú apruebas. Tu paciente recibe.</H2>

        <div className='mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {STEPS.map((step, i) => (
            <div key={step.n} className='flex flex-col gap-4'>
              {/* Connector line for desktop */}
              <div className='flex items-center gap-3'>
                <span
                  className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#22c55e]'
                  style={{ border: '1px solid #1a7a45', background: '#0d1f12' }}
                >
                  {step.n}
                </span>
                <span className='rounded-full border border-[#1a2e1a] bg-[#0d140d] px-2.5 py-0.5 text-xs text-zinc-500'>
                  {step.tiempo}
                </span>
                {i < STEPS.length - 1 && (
                  <span className='hidden flex-1 border-t border-dashed border-[#1a2e1a] lg:block' aria-hidden />
                )}
              </div>
              <h3 className='text-sm font-semibold leading-snug text-zinc-100'>{step.title}</h3>
              <p className='text-xs leading-relaxed text-zinc-500'>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Nota legal */}
        <div className='mt-10 rounded-xl border border-[#1a2e1a] bg-[#0d140d] px-5 py-4'>
          <p className='text-xs leading-relaxed text-zinc-500'>
            <span className='font-semibold text-zinc-400'>Diseñado bajo tu supervisión: </span>
            El plan solo puede entregarse al paciente una vez que lo revisas y apruebas.
            El botón de envío está desactivado hasta entonces — no es solo UX, es la cobertura
            legal del producto.
          </p>
        </div>
      </div>
    </section>
  );
}

// 5. Tabla comparativa

const COMP_ROWS = [
  {
    tool: 'Hoja de cálculo',
    plan: false,
    pdf: false,
    app: false,
    rgpd: true,
    highlight: false,
  },
  {
    tool: 'IA generalista',
    plan: 'warn',
    pdf: false,
    app: false,
    rgpd: false,
    highlight: false,
  },
  {
    tool: 'Software tradicional',
    plan: false,
    pdf: true,
    app: true,
    rgpd: true,
    highlight: false,
  },
  {
    tool: 'Dietly',
    plan: true,
    pdf: true,
    app: true,
    rgpd: true,
    highlight: true,
  },
] as const;

const COL_HEADERS = ['Genera el plan', 'PDF profesional', 'App para paciente', 'Cumple RGPD'];

function Cell({ value }: { value: boolean | 'warn' }) {
  if (value === 'warn') return <IconWarn />;
  if (value) return <IconCheck />;
  return <IconX />;
}

function ComparisonSection() {
  return (
    <section className='sect-div py-16 lg:py-24'>
      <div className='mx-auto max-w-6xl px-5'>
        <SectionLabel>Comparativa</SectionLabel>
        <H2>Todo lo que ya usas, en un solo flujo</H2>
        <p className='mt-3 max-w-lg text-sm text-zinc-500'>
          Sin logos ni nombres de marcas registradas. Solo herramientas genéricas que probablemente ya conoces.
        </p>

        {/* Table — desktop */}
        <div className='mt-10 hidden overflow-hidden rounded-2xl border border-[#1a2e1a] md:block'>
          <table className='w-full table-fixed border-collapse text-sm'>
            <thead>
              <tr className='bg-[#0d140d]'>
                <th className='border-b border-[#1a2e1a] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500' scope='col'>
                  Herramienta
                </th>
                {COL_HEADERS.map((h) => (
                  <th key={h} className='border-b border-l border-[#1a2e1a] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500' scope='col'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMP_ROWS.map((row) => (
                <tr
                  key={row.tool}
                  className={`comp-row border-b border-[#1a2e1a] last:border-b-0 ${
                    row.highlight ? 'bg-[#0d1f12]' : 'bg-[#0a0f0a]'
                  }`}
                >
                  <td className='px-5 py-4 font-medium text-zinc-200'>
                    {row.highlight ? (
                      <span className='font-bold text-[#22c55e]'>{row.tool}</span>
                    ) : row.tool}
                  </td>
                  {([row.plan, row.pdf, row.app, row.rgpd] as const).map((v, i) => (
                    <td key={i} className='border-l border-[#1a2e1a] px-4 py-4 text-center'>
                      <div className='flex justify-center'>
                        <Cell value={v} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className='mt-8 space-y-3 md:hidden'>
          {COMP_ROWS.map((row) => (
            <div
              key={row.tool}
              className={`rounded-xl border p-4 ${
                row.highlight ? 'border-[#1a7a45]/40 bg-[#0d1f12]' : 'border-[#1a2e1a] bg-[#0a0f0a]'
              }`}
            >
              <p className={`mb-3 font-semibold ${row.highlight ? 'text-[#22c55e]' : 'text-zinc-200'}`}>
                {row.tool}
              </p>
              <div className='grid grid-cols-2 gap-2'>
                {COL_HEADERS.map((h, i) => {
                  const vals = [row.plan, row.pdf, row.app, row.rgpd] as const;
                  return (
                    <div key={h} className='flex items-center gap-2'>
                      <Cell value={vals[i]} />
                      <span className='text-xs text-zinc-500'>{h}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 6. Features

const FEATURES = [
  {
    icon: <IconPlan />,
    title: 'Plan completo en 2 minutos',
    desc: 'Macros, recetas, ingredientes en gramos y lista de la compra. 7 días sin comidas en blanco, bajo tu supervisión.',
  },
  {
    icon: <IconEdit />,
    title: 'Tú revisas y editas — siempre en control',
    desc: 'Cada campo es editable antes de aprobar. El criterio clínico final es siempre tuyo.',
  },
  {
    icon: <IconPdf />,
    title: 'PDF profesional con tu nombre',
    desc: 'Tu logotipo, colores y clínica en cada documento listo para entregar.',
  },
  {
    icon: <IconPhone />,
    title: 'App móvil para el paciente',
    desc: 'El paciente abre un enlace y ve su plan como una app. Sin descargas, sin login, macros por comida.',
  },
  {
    icon: <IconCalendar />,
    title: 'Agenda y citas integrada',
    desc: 'Citas presenciales y videollamadas vinculadas a cada paciente, sin apps externas.',
  },
  {
    icon: <IconShield />,
    title: 'Cumple LOPDGDD — servidores en Europa',
    desc: 'Encargado del tratamiento, contrato incluido en T&Cs. Datos cifrados en reposo. Sin IAs generalistas.',
  },
] as const;

function FeaturesSection() {
  return (
    <section className='sect-div py-16 lg:py-24'>
      <div className='mx-auto max-w-6xl px-5'>
        <div className='text-center'>
          <SectionLabel>Funcionalidades</SectionLabel>
          <H2>Diseñado para el nutricionista autónomo español</H2>
          <p className='mx-auto mt-3 max-w-lg text-sm text-zinc-500'>
            No es solo generación de planes. Es el flujo de trabajo completo de la consulta moderna.
          </p>
        </div>

        <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className='feat-card rounded-xl border border-[#1a2e1a] bg-[#050a05] p-5'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-[#1a2e1a] bg-[#0d1f12] text-[#1a7a45]'>
                {f.icon}
              </div>
              <h3 className='mt-4 text-sm font-semibold text-zinc-100'>{f.title}</h3>
              <p className='mt-1.5 text-xs leading-relaxed text-zinc-500'>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 7. CTA Final

function FinalCtaSection() {
  return (
    <section className='sect-div py-20 text-center lg:py-28'>
      <div
        aria-hidden
        className='pointer-events-none fixed inset-x-0 bottom-0 h-64'
        style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 110%, rgba(26,122,69,.15) 0%, transparent 70%)', zIndex: -1 }}
      />
      <div className='mx-auto max-w-xl px-5'>
        <SectionLabel>¿Todo claro?</SectionLabel>
        <h2 className='text-2xl font-bold text-zinc-100 lg:text-4xl'>
          Empieza hoy. Tu próximo plan en 2 minutos.
        </h2>
        <p className='mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400'>
          Sin tarjeta. Sin prueba limitada. Si no te convence, no pagas.
        </p>
        <div className='mt-8'>
          <CtaButton href='/signup'>
            Empieza con 2 pacientes gratis →
          </CtaButton>
        </div>
        <p className='mt-5 text-xs text-zinc-700'>
          ¿Ya tienes cuenta?{' '}
          <Link href='/login' className='text-zinc-500 transition-colors hover:text-zinc-400'>
            Inicia sesión
          </Link>
        </p>

        {/* Legal trust footer */}
        <div className='mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#1a2e1a] pt-8 text-xs text-zinc-600'>
          <span>RGPD · LOPDGDD</span>
          <span aria-hidden>·</span>
          <span>Ley 44/2003</span>
          <span aria-hidden>·</span>
          <span>Servidores en UE</span>
          <span aria-hidden>·</span>
          <Link href='/legal/privacidad' className='transition-colors hover:text-zinc-400'>Privacidad</Link>
          <span aria-hidden>·</span>
          <Link href='/legal/terminos' className='transition-colors hover:text-zinc-400'>Términos</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* Grain — capa de ruido fijo sobre toda la landing */}
      <div className='grain' aria-hidden />
      <div className='landing-bg'>
        <HeroSection />
        <WorkflowBar />
        <ProblemSection />
        <HowItWorksSection />
        <ComparisonSection />
        <FeaturesSection />
        <FinalCtaSection />
      </div>
    </>
  );
}
