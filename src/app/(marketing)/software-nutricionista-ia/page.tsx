import type { Metadata } from 'next';
import Link from 'next/link';

import { PricingSection } from '@/features/pricing/components/pricing-section';

export const metadata: Metadata = {
  title: 'Software nutricionista con IA · Plan semanal en 2 minutos',
  description:
    'Dietly genera el borrador del plan nutricional con IA en 2 minutos. Revisa, ajusta y firma con tu marca. Para nutricionistas en España. 2 pacientes gratis.',
  keywords: [
    'software nutricionista IA',
    'crear dietas con IA',
    'plan nutricional inteligencia artificial',
    'software nutricionista España',
  ],
  openGraph: {
    title: 'Software nutricionista con IA · Dietly',
    description:
      'Plan nutricional con IA en 2 minutos. Tú revisas y firmas con tu marca.',
    url: 'https://dietly.es/software-nutricionista-ia',
    type: 'website',
  },
  alternates: { canonical: 'https://dietly.es/software-nutricionista-ia' },
};

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Software nutricionista con IA',
  description:
    'Software para nutricionistas españoles que genera planes nutricionales con IA en 2 minutos.',
  url: 'https://dietly.es/software-nutricionista-ia',
  about: { '@id': 'https://dietly.es/#software' },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://dietly.es' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Software con IA',
        item: 'https://dietly.es/software-nutricionista-ia',
      },
    ],
  },
};

// ─── Primitivos coherentes con la landing principal ──────────────────────────

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

// ─── Iconos ──────────────────────────────────────────────────────────────────

const IconCalendar = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <rect x='3' y='4' width='18' height='18' rx='2' />
    <line x1='16' y1='2' x2='16' y2='6' />
    <line x1='8' y1='2' x2='8' y2='6' />
    <line x1='3' y1='10' x2='21' y2='10' />
  </svg>
);

const IconCart = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <circle cx='9' cy='21' r='1' />
    <circle cx='20' cy='21' r='1' />
    <path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' />
  </svg>
);

const IconDoc = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
    <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
    <polyline points='14 2 14 8 20 8' />
    <line x1='9' y1='13' x2='15' y2='13' />
    <line x1='9' y1='17' x2='15' y2='17' />
  </svg>
);

// ─── Página ──────────────────────────────────────────────────────────────────

export default function SoftwareNutricionistaIA() {
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
            <SectionLabel>Software nutricionista con IA</SectionLabel>
            <h1 className='mx-auto max-w-4xl text-4xl font-bold leading-tight text-zinc-100 lg:text-6xl'>
              Software nutricionista con IA.{' '}
              <span className='text-[#22c55e]'>Plan semanal en 2 minutos.</span>
            </h1>
            <p className='mx-auto mt-6 max-w-2xl text-lg text-zinc-400 lg:text-xl'>
              Dietly genera el borrador del plan nutricional con inteligencia artificial.
              Tú lo revisas, ajustas y firmas con tu marca y tu número de colegiada.
            </p>
            <div className='mt-10 flex flex-col items-center gap-3'>
              <CtaButton href='/signup'>Empieza con 2 pacientes gratis →</CtaButton>
              <p className='text-xs text-zinc-500'>Sin tarjeta · Cancela cuando quieras</p>
            </div>

            {/* Mockup simbólico */}
            <div className='mx-auto mt-16 max-w-3xl rounded-2xl border border-[#1a2e1a] bg-gradient-to-b from-[#0a1a0e] to-[#050a05] p-6 shadow-xl lg:p-10'>
              <div className='flex items-center justify-between border-b border-[#1a2e1a] pb-4'>
                <div className='flex items-center gap-2'>
                  <div className='h-2.5 w-2.5 rounded-full bg-red-500/70' />
                  <div className='h-2.5 w-2.5 rounded-full bg-amber-500/70' />
                  <div className='h-2.5 w-2.5 rounded-full bg-green-500/70' />
                </div>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-[#1a7a45]/15 px-2.5 py-1 text-xs font-semibold text-[#22c55e]'>
                  <span className='h-1.5 w-1.5 rounded-full bg-[#22c55e]' />
                  IA en 2 minutos
                </span>
              </div>
              <div className='mt-6 grid grid-cols-7 gap-2'>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div
                    key={day}
                    className='rounded-lg border border-[#1a2e1a] bg-[#0d140d] p-2 text-center'
                  >
                    <p className='text-[10px] font-semibold uppercase tracking-wider text-[#22c55e]'>
                      {day}
                    </p>
                    <div className='mt-2 space-y-1'>
                      <div className='h-1.5 rounded bg-zinc-800' />
                      <div className='h-1.5 rounded bg-zinc-800' />
                      <div className='h-1.5 w-3/4 rounded bg-zinc-800' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* QUÉ HACE DIETLY ────────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 py-20 lg:py-28'>
          <div className='mx-auto max-w-5xl px-6'>
            <div className='mb-14 text-center'>
              <SectionLabel>Qué obtienes</SectionLabel>
              <H2 className='mx-auto max-w-3xl'>Lo que la IA de Dietly genera por ti</H2>
            </div>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <div className='mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#1a7a45]/15 text-[#22c55e]'>
                  <IconCalendar />
                </div>
                <h3 className='mb-2 text-lg font-semibold text-zinc-100'>Plan semanal completo</h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  7 días con desayuno, comida, merienda y cena. Macros y kcal por comida.
                </p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <div className='mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#1a7a45]/15 text-[#22c55e]'>
                  <IconCart />
                </div>
                <h3 className='mb-2 text-lg font-semibold text-zinc-100'>Lista de la compra</h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  Agrupada por categorías. Lista para enviar al paciente.
                </p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <div className='mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#1a7a45]/15 text-[#22c55e]'>
                  <IconDoc />
                </div>
                <h3 className='mb-2 text-lg font-semibold text-zinc-100'>PDF profesional</h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  Con tu logo, tu nombre y tu número de colegiada. Listo en segundos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TÚ MANTIENES EL CONTROL ────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 bg-[#070f08] py-20 lg:py-28'>
          <div className='mx-auto max-w-4xl px-6'>
            <div className='mb-12 text-center'>
              <SectionLabel>Control profesional</SectionLabel>
              <H2>La IA propone. Tú decides.</H2>
              <p className='mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 lg:text-lg'>
                Dietly genera el borrador. Tú revisas cada plato, ajustas las restricciones del
                paciente, modificas lo que no encaja con tu criterio clínico, y firmas con tu
                marca. El plan solo se entrega cuando tú lo apruebas.
              </p>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {[
                { k: 'Sin tu aprobación', v: 'no se entrega' },
                { k: 'Sin tu firma', v: 'no es válido' },
                { k: 'Sin tu criterio', v: 'solo un borrador' },
              ].map((item) => (
                <div
                  key={item.k}
                  className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-5 text-center'
                >
                  <p className='text-sm font-semibold text-zinc-100'>{item.k}</p>
                  <p className='mt-1 text-sm text-[#22c55e]'>{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARA QUIÉN ES DIETLY ───────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 py-20 lg:py-28'>
          <div className='mx-auto max-w-5xl px-6'>
            <div className='mb-14 text-center'>
              <SectionLabel>Para quién</SectionLabel>
              <H2 className='mx-auto max-w-3xl'>
                Para nutricionistas que quieren tiempo, no plantillas
              </H2>
            </div>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-100'>Consulta general</h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  Si tienes 20-60 pacientes y dedicas 1-3h por plan, Dietly te devuelve el 80%
                  de ese tiempo.
                </p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-100'>Nutrición deportiva</h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  Macros editables, planes ajustados al deportista, sin plantillas cerradas.
                </p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-6'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-100'>
                  Clínica · TCA · Digestivo
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  Personalización real, no industrialización. La IA respeta cada restricción.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRECIOS ────────────────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40'>
          <div className='mx-auto max-w-5xl px-6 pt-16 text-center lg:pt-20'>
            <SectionLabel>Precios</SectionLabel>
            <H2>Empieza gratis. Paga cuando estés listo.</H2>
            <p className='mx-auto mt-4 max-w-xl text-base text-zinc-400'>
              2 pacientes gratis sin tarjeta. Cambia de plan o cancela cuando quieras.
            </p>
          </div>
          <PricingSection />
          <div className='flex justify-center pb-16'>
            <CtaButton href='/signup'>Empieza con 2 pacientes gratis →</CtaButton>
          </div>
        </section>

        {/* RGPD ───────────────────────────────────────────────────────────── */}
        <section className='border-t border-[#1a2e1a]/40 bg-[#070f08] py-20 lg:py-28'>
          <div className='mx-auto max-w-4xl px-6'>
            <div className='mb-12 text-center'>
              <SectionLabel>Compliance</SectionLabel>
              <H2>Hecho en España. Cumple RGPD.</H2>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-5'>
                <p className='text-sm font-semibold text-zinc-100'>Servidores en la UE</p>
                <p className='mt-1 text-sm text-zinc-400'>Supabase Paris.</p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-5'>
                <p className='text-sm font-semibold text-zinc-100'>Encargado del tratamiento</p>
                <p className='mt-1 text-sm text-zinc-400'>Contrato Art. 28 incluido.</p>
              </div>
              <div className='rounded-xl border border-[#1a2e1a] bg-[#0d140d] p-5'>
                <p className='text-sm font-semibold text-zinc-100'>Datos cifrados</p>
                <p className='mt-1 text-sm text-zinc-400'>Sub-encargados declarados.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL ──────────────────────────────────────────────────────── */}
        <section className='relative overflow-hidden border-t border-[#1a2e1a]/40 py-24 lg:py-32'>
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,122,69,0.15),transparent_70%)]'
          />
          <div className='relative mx-auto max-w-3xl px-6 text-center'>
            <H2 className='mx-auto max-w-2xl'>Tu próximo plan en 2 minutos. Hoy.</H2>
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
