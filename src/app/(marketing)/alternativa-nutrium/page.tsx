import type { Metadata } from 'next';
import Link from 'next/link';

import { PricingSection } from '@/features/pricing/components/pricing-section';

export const metadata: Metadata = {
  title: 'Alternativa a Nutrium para nutricionistas en España',
  description:
    'Dietly es la alternativa española a Nutrium: IA que genera planes en 2 minutos, RGPD nativo, 2 pacientes gratis sin tarjeta. Compara precios y funcionalidades.',
  keywords: [
    'Nutrium alternativa',
    'alternativa a Nutrium',
    'Nutrium vs Dietly',
    'software nutricionista España',
  ],
  openGraph: {
    title: 'Dietly · Alternativa a Nutrium en España',
    description:
      'Software nutricionista con IA, RGPD nativo, 2 pacientes gratis sin tarjeta. Compara con Nutrium.',
    url: 'https://dietly.es/alternativa-nutrium',
    type: 'website',
  },
  alternates: { canonical: 'https://dietly.es/alternativa-nutrium' },
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Alternativa a Nutrium',
  description: 'Comparativa entre Dietly y Nutrium para nutricionistas en España.',
  url: 'https://dietly.es/alternativa-nutrium',
  about: { '@id': 'https://dietly.es/#software' },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://dietly.es' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Alternativa a Nutrium',
        item: 'https://dietly.es/alternativa-nutrium',
      },
    ],
  },
};

// ─── Primitivos ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a7a45]'>
      {children}
    </p>
  );
}

function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-2xl font-bold leading-snug text-zinc-100 lg:text-4xl ${className}`}>
      {children}
    </h2>
  );
}

function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className='inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1a7a45] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#22c55e] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]'
    >
      {children}
    </Link>
  );
}

// ─── Datos de la tabla comparativa ───────────────────────────────────────────
// Datos de Nutrium verificados en nutrium.com/es/pricing a fecha 2026-04-15.
// Plan 10 clientes/mes: 25€/mes (15€/mes anual, 179€/año).
// Plan Clientes ilimitados: 49€/mes (25€/mes anual, 299€/año).
// Ambos incluyen 14 días de prueba. Sub-verificar antes de cada actualización.

type Row = {
  label: string;
  dietly: string;
  nutrium: string;
  dietlyHighlight?: boolean;
};

const comparisonRows: Row[] = [
  { label: 'Sede', dietly: 'España', nutrium: 'Portugal', dietlyHighlight: true },
  {
    label: 'Idioma y enfoque',
    dietly: 'Solo español, foco en España',
    nutrium: 'Multilingüe (7 idiomas)',
    dietlyHighlight: true,
  },
  {
    label: 'Generación de planes con IA',
    dietly: 'Borrador completo del plan semanal en 2 min',
    nutrium: 'Herramientas de IA como asistencia',
    dietlyHighlight: true,
  },
  {
    label: 'RGPD / LOPDGDD',
    dietly: 'Encargado del tratamiento + contrato Art. 28',
    nutrium: 'Cumple RGPD europeo',
  },
  { label: 'Hosting de datos', dietly: 'UE (París)', nutrium: 'UE' },
  {
    label: 'Empezar sin tarjeta',
    dietly: '2 pacientes gratis, sin tarjeta',
    nutrium: 'Prueba 14 días',
    dietlyHighlight: true,
  },
  {
    label: 'Plan de entrada',
    dietly: '46€/mes · 30 pacientes',
    nutrium: '25€/mes · hasta 10 clientes/mes (15€/mes anual)',
  },
  {
    label: 'Plan ilimitado',
    dietly: '89€/mes · pacientes ilimitados',
    nutrium: '49€/mes · clientes ilimitados (25€/mes anual)',
  },
  {
    label: 'App para el paciente',
    dietly: 'PWA web, sin descargas',
    nutrium: 'App nativa iOS/Android',
  },
  {
    label: 'PDF con tu marca',
    dietly: 'Logo + número de colegiada',
    nutrium: 'Sí',
  },
  {
    label: 'Soporte',
    dietly: 'Directo, en español, fundador en España',
    nutrium: 'Multilingüe',
    dietlyHighlight: true,
  },
  {
    label: 'Enfoque de producto',
    dietly: 'Nutricionista autónomo en España',
    nutrium: 'Multinacional, B2B + B2C',
  },
];

// ─── Página ──────────────────────────────────────────────────────────────────

export default function AlternativaNutrium() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      <div className='relative bg-[#050a05] text-zinc-100'>
        {/* HERO ───────────────────────────────────────────────────────────── */}
        <section className='relative overflow-hidden'>
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(26,122,69,0.18),transparent_60%)]'
          />
          <div className='relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center lg:pb-28 lg:pt-32'>
            <SectionLabel>Comparativa</SectionLabel>
            <h1 className='mx-auto max-w-4xl text-4xl font-bold leading-tight text-zinc-100 lg:text-6xl'>
              Alternativa a Nutrium para{' '}
              <span className='text-[#22c55e]'>nutricionistas en España</span>
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-lg text-zinc-400 lg:text-xl'>
              Dietly genera el borrador del plan nutricional con IA en 2 minutos,
              cumple RGPD nativo en España y empieza gratis con 2 pacientes — sin tarjeta.
            </p>
            <div className='mt-10 flex flex-col items-center gap-3'>
              <CtaButton href='/signup'>Empieza con 2 pacientes gratis →</CtaButton>
              <p className='text-xs text-zinc-500'>Sin tarjeta · Cancela cuando quieras</p>
            </div>
          </div>
        </section>

        {/* TABLA COMPARATIVA ──────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 py-20 lg:py-28'>
          <div className='mx-auto max-w-5xl px-6'>
            <div className='mb-12 text-center'>
              <SectionLabel>Dietly vs Nutrium</SectionLabel>
              <H2 className='mx-auto max-w-3xl'>
                Comparativa para nutricionistas en España
              </H2>
              <p className='mx-auto mt-4 max-w-xl text-sm text-zinc-500'>
                Datos públicos verificados en nutrium.com a fecha de abril de 2026.
              </p>
            </div>

            <div className='overflow-hidden rounded-2xl border border-[#1a2e1a] bg-[#0d140d]'>
              {/* Cabecera desktop */}
              <div className='hidden grid-cols-[1.3fr_1fr_1fr] border-b border-[#1a2e1a] bg-[#0a1a0e] md:grid'>
                <div className='px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
                  Característica
                </div>
                <div className='px-5 py-4 text-sm font-bold text-[#22c55e]'>Dietly</div>
                <div className='px-5 py-4 text-sm font-bold text-zinc-300'>Nutrium</div>
              </div>

              {comparisonRows.map((row, idx) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr] ${
                    idx !== comparisonRows.length - 1 ? 'border-b border-[#1a2e1a]' : ''
                  }`}
                >
                  <div className='px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:py-5 md:text-[11px]'>
                    {row.label}
                  </div>
                  <div className='px-5 pb-2 pt-1 md:py-5'>
                    <div className='flex items-start gap-2'>
                      <span className='mt-0.5 inline-block text-[#22c55e]' aria-hidden='true'>
                        ✓
                      </span>
                      <p
                        className={`text-sm leading-snug ${
                          row.dietlyHighlight ? 'font-semibold text-zinc-100' : 'text-zinc-200'
                        }`}
                      >
                        {row.dietly}
                      </p>
                    </div>
                  </div>
                  <div className='px-5 pb-5 pt-1 md:py-5'>
                    <p className='text-sm leading-snug text-zinc-400'>{row.nutrium}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-10 flex justify-center'>
              <CtaButton href='/signup'>Empieza con 2 pacientes gratis →</CtaButton>
            </div>
          </div>
        </section>

        {/* POR QUÉ DIETLY ─────────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 bg-[#070f08] py-20 lg:py-28'>
          <div className='mx-auto max-w-5xl px-6'>
            <div className='mb-14 text-center'>
              <SectionLabel>Diferenciales</SectionLabel>
              <H2 className='mx-auto max-w-3xl'>
                Tres razones por las que Dietly encaja mejor en consultas españolas
              </H2>
            </div>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-100'>
                  Hecho en España, para España
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  Cumple LOPDGDD y RGPD desde el día uno. Datos en la UE. Soporte directo
                  en español sin tickets internacionales.
                </p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-100'>
                  IA que genera, no que asiste
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  El borrador completo del plan semanal aparece en 2 minutos: 7 días, macros
                  por comida, lista de la compra. Tú revisas y firmas con tu marca.
                </p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-100'>
                  Empieza gratis sin tarjeta
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  2 pacientes gratis para probar Dietly con casos reales. Sin tarjeta, sin
                  prueba limitada de 14 días. Si no te convence, no pagas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PARA QUIÉN ENCAJA CADA UNO ─────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 py-20 lg:py-28'>
          <div className='mx-auto max-w-5xl px-6'>
            <div className='mb-14 text-center'>
              <SectionLabel>Honestidad</SectionLabel>
              <H2 className='mx-auto max-w-3xl'>
                ¿Te encaja Dietly o te encaja Nutrium?
              </H2>
            </div>
            <div className='grid gap-6 md:grid-cols-2'>
              <div className='rounded-2xl border border-[#1a7a45]/40 bg-[#0d140d] p-7'>
                <h3 className='mb-4 text-lg font-bold text-[#22c55e]'>Te encaja Dietly si…</h3>
                <ul className='flex flex-col gap-3 text-sm leading-relaxed text-zinc-300'>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-[#22c55e]'>✓</span>
                    Tu consulta es en España y necesitas RGPD/LOPDGDD nativo.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-[#22c55e]'>✓</span>
                    Quieres probar sin tarjeta y sin compromiso.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-[#22c55e]'>✓</span>
                    Buscas generación rápida de planes con IA, no plantillas.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-[#22c55e]'>✓</span>
                    Tienes 20–60 pacientes activos y quieres recuperar tiempo.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-[#22c55e]'>✓</span>
                    Trabajas como autónomo o pequeña consulta.
                  </li>
                </ul>
              </div>

              <div className='rounded-2xl border border-[#1a2e1a] bg-[#0d140d] p-7'>
                <h3 className='mb-4 text-lg font-bold text-zinc-300'>Te encaja Nutrium si…</h3>
                <ul className='flex flex-col gap-3 text-sm leading-relaxed text-zinc-400'>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-zinc-500'>·</span>
                    Tienes consulta multilingüe o internacional.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-zinc-500'>·</span>
                    Trabajas con apps nativas iOS/Android.
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-zinc-500'>·</span>
                    Necesitas integración con empresas (corporate wellness).
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 text-zinc-500'>·</span>
                    Tienes equipo grande y necesitas funciones enterprise.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRECIOS ────────────────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40'>
          <div className='mx-auto max-w-5xl px-6 pt-16 text-center lg:pt-20'>
            <SectionLabel>Precios</SectionLabel>
            <H2>Compara precios</H2>
            <p className='mx-auto mt-4 max-w-xl text-base text-zinc-400'>
              2 pacientes gratis sin tarjeta. Sin permanencia. IVA incluido.
            </p>
          </div>
          <PricingSection />
          <div className='flex justify-center pb-16'>
            <CtaButton href='/signup'>Empieza con 2 pacientes gratis →</CtaButton>
          </div>
        </section>

        {/* MIGRACIÓN ──────────────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 bg-[#070f08] py-20 lg:py-28'>
          <div className='mx-auto max-w-3xl px-6 text-center'>
            <SectionLabel>Migración</SectionLabel>
            <H2>¿Vienes desde Nutrium?</H2>
            <p className='mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 lg:text-lg'>
              Si ya usas Nutrium y quieres probar Dietly, escríbeme directamente a{' '}
              <a
                href='mailto:rubenrodriguezz2025@gmail.com'
                className='font-semibold text-[#22c55e] hover:underline'
              >
                rubenrodriguezz2025@gmail.com
              </a>
              . Te ayudo personalmente con la transición — datos de pacientes, formato de
              planes, lo que necesites.
            </p>
          </div>
        </section>

        {/* CTA FINAL ──────────────────────────────────────────────────────── */}
        <section className='relative overflow-hidden border-t border-[#1a2e1a]/40 py-24 lg:py-32'>
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,122,69,0.15),transparent_70%)]'
          />
          <div className='relative mx-auto max-w-3xl px-6 text-center'>
            <H2 className='mx-auto max-w-2xl'>Pruébalo con 2 pacientes. Sin tarjeta.</H2>
            <div className='mt-10 flex flex-col items-center gap-3'>
              <CtaButton href='/signup'>Empieza con 2 pacientes gratis →</CtaButton>
              <p className='text-xs text-zinc-500'>
                Sin tarjeta. Sin prueba limitada. Si no te convence, no pagas.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
