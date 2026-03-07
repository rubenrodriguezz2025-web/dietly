import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { PlanContent } from '@/types/dietly';

import { NavegadorDias } from './navegador-dias';

// ── Fuente ────────────────────────────────────────────────────────────────────

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// ── Metadata PWA ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Mi plan nutricional · Dietly',
  description: 'Tu plan nutricional personalizado',
  manifest: '/manifest.json',
  themeColor: '#0a3622',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mi Plan',
  },
};

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PaginaPaciente({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ dia?: string }>;
}) {
  const { token } = await params;
  const { dia } = await searchParams;

  const { data: plan } = await (supabaseAdminClient as any)
    .from('nutrition_plans')
    .select('*, patients(name)')
    .eq('patient_token', token)
    .eq('status', 'approved')
    .single();

  if (!plan) notFound();

  const content = plan.content as PlanContent | null;
  if (!content?.days?.length) notFound();

  const diaActual = Math.min(
    Math.max(parseInt(dia ?? '1', 10) || 1, 1),
    content.days.length
  );

  const diaSeleccionado =
    content.days.find((d) => d.day_number === diaActual) ?? content.days[0];
  const nombrePaciente =
    (plan.patients as { name: string } | null)?.name ?? 'Paciente';

  const fechaSemana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  const sm = content.week_summary;

  return (
    <>
      {/* Animaciones CSS staggered — sin JS */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scalePop {
          0%   { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        .anim-header   { animation: fadeIn  0.5s ease both; }
        .anim-summary  { animation: fadeUp  0.5s 0.15s ease both; }
        .anim-nav      { animation: fadeIn  0.4s 0.25s ease both; }
        .anim-comida-0 { animation: fadeUp  0.4s 0.30s ease both; }
        .anim-comida-1 { animation: fadeUp  0.4s 0.38s ease both; }
        .anim-comida-2 { animation: fadeUp  0.4s 0.46s ease both; }
        .anim-comida-3 { animation: fadeUp  0.4s 0.54s ease both; }
        .anim-comida-4 { animation: fadeUp  0.4s 0.62s ease both; }
        .anim-compra   { animation: fadeUp  0.4s 0.20s ease both; }
      `}</style>

      <div
        className={`${jakarta.className} min-h-screen bg-[#f4f7f5]`}
        style={{ WebkitFontSmoothing: 'antialiased' }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <header
          className='anim-header relative overflow-hidden px-5 pb-7 pt-safe-top'
          style={{
            background: 'linear-gradient(150deg, #0a3622 0%, #145c35 50%, #1a7a45 100%)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)',
          }}
        >
          {/* Decoración geométrica de fondo */}
          <div
            className='pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full'
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
          <div
            className='pointer-events-none absolute right-12 top-24 h-24 w-24 rounded-full'
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
          <div
            className='pointer-events-none absolute -left-6 bottom-0 h-32 w-32 rounded-full'
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />

          {/* Badge Dietly */}
          <div className='mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1'>
            <span
              className='h-1.5 w-1.5 rounded-full'
              style={{ background: '#4ade80' }}
            />
            <span className='text-[11px] font-semibold tracking-wide text-white/80'>
              DIETLY
            </span>
          </div>

          <h1 className='text-2xl font-extrabold leading-tight text-white'>
            {nombrePaciente}
          </h1>
          <p className='mt-1 text-sm font-medium text-white/50'>
            Plan nutricional · semana del {fechaSemana}
          </p>

          {/* Objetivos diarios — píldoras de color */}
          <div className='anim-summary mt-5 flex gap-2.5 overflow-x-auto pb-0.5'>
            <PildoraMacro
              valor={sm.target_daily_calories}
              unidad='kcal'
              color='rgba(74,222,128,0.18)'
              colorTexto='#4ade80'
            />
            <PildoraMacro
              valor={`${sm.target_macros.protein_g}g`}
              unidad='proteína'
              color='rgba(147,197,253,0.18)'
              colorTexto='#93c5fd'
            />
            <PildoraMacro
              valor={`${sm.target_macros.carbs_g}g`}
              unidad='carbos'
              color='rgba(252,211,77,0.18)'
              colorTexto='#fcd34d'
            />
            <PildoraMacro
              valor={`${sm.target_macros.fat_g}g`}
              unidad='grasa'
              color='rgba(249,168,212,0.18)'
              colorTexto='#f9a8d4'
            />
          </div>
        </header>

        {/* ── CONTENIDO ──────────────────────────────────────────────────────── */}
        <main className='mx-auto max-w-lg px-4 pb-16'>
          {/* Navegación sticky por días */}
          <div className='anim-nav sticky top-0 z-10 -mx-4 border-b border-zinc-200/60 bg-[#f4f7f5]/95 px-4 pt-3 pb-1 backdrop-blur-md'>
            <NavegadorDias
              dias={content.days.map((d) => ({
                numero: d.day_number,
                nombre: d.day_name,
              }))}
              diaActual={diaActual}
              token={token}
            />
          </div>

          {/* Cabecera del día */}
          <div className='mb-4 mt-5 flex items-center justify-between'>
            <h2 className='text-xl font-extrabold text-zinc-900'>
              {diaSeleccionado.day_name}
            </h2>
            <div className='flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200'>
              <span className='text-sm font-bold text-emerald-700'>
                {diaSeleccionado.total_calories}
              </span>
              <span className='text-xs font-medium text-emerald-600'>kcal</span>
              <span className='mx-0.5 text-emerald-300'>·</span>
              <span className='text-xs text-emerald-600'>
                {diaSeleccionado.total_macros.protein_g}P{' '}
                {diaSeleccionado.total_macros.carbs_g}C{' '}
                {diaSeleccionado.total_macros.fat_g}G
              </span>
            </div>
          </div>

          {/* Tarjetas de comida */}
          <div className='flex flex-col gap-3'>
            {diaSeleccionado.meals.map((comida, i) => (
              <TarjetaComida
                key={i}
                comida={comida}
                animClass={`anim-comida-${Math.min(i, 4)}`}
              />
            ))}
          </div>

          {/* Lista de la compra */}
          {content.shopping_list && (
            <section className='anim-compra mt-10'>
              <div className='mb-4 flex items-center gap-3'>
                <div className='h-px flex-1 bg-zinc-200' />
                <h2 className='text-xs font-bold uppercase tracking-widest text-zinc-400'>
                  Lista de la compra
                </h2>
                <div className='h-px flex-1 bg-zinc-200' />
              </div>

              <div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm'>
                {CATEGORIAS_COMPRA.map(([clave, etiqueta, icono], idx) => {
                  const items =
                    content.shopping_list[
                      clave as keyof typeof content.shopping_list
                    ];
                  if (!items?.length) return null;
                  return (
                    <div
                      key={clave}
                      className={
                        idx > 0 ? 'border-t border-zinc-100' : ''
                      }
                    >
                      <div className='flex items-center gap-2 px-4 py-3'>
                        <span className='text-base'>{icono}</span>
                        <span className='text-xs font-bold uppercase tracking-wider text-zinc-500'>
                          {etiqueta}
                        </span>
                      </div>
                      <ul className='px-4 pb-3 pt-0'>
                        {items.map((item, i) => (
                          <li
                            key={i}
                            className='flex items-start gap-2.5 py-1.5'
                          >
                            <span
                              className='mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full'
                              style={{ background: '#16a34a' }}
                            />
                            <span className='text-sm leading-snug text-zinc-700'>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pie */}
          <p className='mt-10 text-center text-[11px] font-medium text-zinc-400'>
            Preparado por tu nutricionista con Dietly
            <br />
            <span className='font-normal text-zinc-300'>
              Revisado y aprobado antes de enviarte este plan
            </span>
          </p>
        </main>

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </div>
    </>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function PildoraMacro({
  valor,
  unidad,
  color,
  colorTexto,
}: {
  valor: number | string;
  unidad: string;
  color: string;
  colorTexto: string;
}) {
  return (
    <div
      className='flex-shrink-0 rounded-xl px-4 py-2.5 text-center'
      style={{ background: color }}
    >
      <p
        className='text-base font-extrabold leading-none tabular-nums'
        style={{ color: colorTexto }}
      >
        {valor}
      </p>
      <p className='mt-0.5 text-[10px] font-semibold' style={{ color: colorTexto, opacity: 0.7 }}>
        {unidad}
      </p>
    </div>
  );
}

// Colores de acento lateral por tipo de comida
const ACENTO_TIPO: Record<string, { borde: string; etiqueta: string }> = {
  desayuno:     { borde: '#f59e0b', etiqueta: '#b45309' },
  media_manana: { borde: '#f97316', etiqueta: '#c2410c' },
  almuerzo:     { borde: '#10b981', etiqueta: '#047857' },
  merienda:     { borde: '#8b5cf6', etiqueta: '#6d28d9' },
  cena:         { borde: '#3b82f6', etiqueta: '#1d4ed8' },
};

const NOMBRE_TIPO: Record<string, string> = {
  desayuno:     'Desayuno',
  media_manana: 'Media mañana',
  almuerzo:     'Almuerzo',
  merienda:     'Merienda',
  cena:         'Cena',
};

type Comida = PlanContent['days'][0]['meals'][0];

function TarjetaComida({
  comida,
  animClass,
}: {
  comida: Comida;
  animClass: string;
}) {
  const acento = ACENTO_TIPO[comida.meal_type] ?? { borde: '#16a34a', etiqueta: '#15803d' };

  return (
    <article
      className={`${animClass} overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5`}
    >
      {/* Banda de color superior por tipo */}
      <div className='h-[3px] w-full' style={{ background: acento.borde }} />

      {/* Cabecera de comida */}
      <div className='flex items-start justify-between gap-3 px-4 pb-2 pt-3.5'>
        <div className='flex-1 min-w-0'>
          <p
            className='mb-0.5 text-[10px] font-bold uppercase tracking-widest'
            style={{ color: acento.etiqueta }}
          >
            {NOMBRE_TIPO[comida.meal_type] ?? comida.meal_type}
            {comida.time_suggestion && (
              <span className='font-normal text-zinc-400'>
                {' '}· {comida.time_suggestion}
              </span>
            )}
          </p>
          <h3 className='text-[15px] font-bold leading-snug text-zinc-900'>
            {comida.meal_name}
          </h3>
        </div>

        {/* Kcal — siempre visible (F-02) */}
        <div className='flex-shrink-0 rounded-xl px-3 py-2 text-center' style={{ background: '#f0fdf4' }}>
          <p className='text-base font-extrabold leading-none tabular-nums text-emerald-700'>
            {comida.calories}
          </p>
          <p className='mt-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-500'>
            kcal
          </p>
        </div>
      </div>

      {/* Macros en píldoras de color — siempre visibles (F-02) */}
      <div className='flex gap-1.5 px-4 pb-3'>
        <MacroChip valor={comida.macros.protein_g} etiqueta='P' bg='#eff6ff' color='#1d4ed8' />
        <MacroChip valor={comida.macros.carbs_g}   etiqueta='C' bg='#fffbeb' color='#b45309' />
        <MacroChip valor={comida.macros.fat_g}     etiqueta='G' bg='#fdf2f8' color='#9d174d' />
      </div>

      {/* Ingredientes — siempre visibles (F-03) */}
      {comida.ingredients.length > 0 && (
        <div className='border-t border-zinc-100 px-4 py-3'>
          <p className='mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
            Ingredientes
          </p>
          <ul className='flex flex-wrap gap-1.5'>
            {comida.ingredients.map((ing, i) => (
              <li
                key={i}
                className='rounded-full bg-zinc-50 px-2.5 py-1 text-[12px] font-medium text-zinc-700 ring-1 ring-zinc-200'
              >
                {ing.name}{' '}
                <span className='font-normal text-zinc-400'>
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preparación */}
      {comida.preparation && (
        <div className='border-t border-zinc-100 bg-zinc-50/60 px-4 py-3'>
          <p className='mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
            Preparación
          </p>
          <p className='text-[13px] leading-relaxed text-zinc-600'>{comida.preparation}</p>
        </div>
      )}
    </article>
  );
}

function MacroChip({
  valor,
  etiqueta,
  bg,
  color,
}: {
  valor: number;
  etiqueta: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      className='inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums'
      style={{ background: bg, color }}
    >
      {valor}g
      <span className='text-[10px] font-semibold opacity-70'>{etiqueta}</span>
    </span>
  );
}

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS_COMPRA: Array<[string, string, string]> = [
  ['produce', 'Frutas y verduras', '🥦'],
  ['protein', 'Proteínas',         '🥩'],
  ['dairy',   'Lácteos',           '🥛'],
  ['grains',  'Cereales y pan',    '🌾'],
  ['pantry',  'Despensa',          '🫙'],
];
