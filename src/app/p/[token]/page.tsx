import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { aggregateShoppingList } from '@/libs/shopping-list';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { PlanContent } from '@/types/dietly';

import { BotonCompartir } from './boton-compartir';
import { ListaCompraInteractiva } from './lista-compra';
import { PwaShell } from './pwa-shell';
import { VisorDias } from './visor-dias';

// ── Fuente ────────────────────────────────────────────────────────────────────

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// ── CSS de la PWA (scoped a [data-pwa-theme]) ─────────────────────────────────

const PWA_STYLES = `
  /* Variables de tema — light por defecto, dark por preferencia del SO */
  [data-pwa-theme="light"] {
    --bg:               #f4f7f5;
    --card:             #ffffff;
    --card2:            #f8f8f8;
    --text:             #18181b;
    --text-muted:       #71717a;
    --border:           #e4e4e7;
    --nav-bg:           rgba(244,247,245,0.95);
    --chip-off:         #f4f4f5;
    --dot-off:          #d4d4d8;
    --kcal-bg:          #f0fdf4;
    --kcal-border:      #bbf7d0;
    --kcal-fg:          #047857;
    --chip-protein-bg:  #eff6ff;
    --chip-protein-fg:  #1d4ed8;
    --chip-carbs-bg:    #fffbeb;
    --chip-carbs-fg:    #b45309;
    --chip-fat-bg:      #fdf2f8;
    --chip-fat-fg:      #9d174d;
  }

  [data-pwa-theme="dark"] {
    --bg:               #0f0f0f;
    --card:             #1a1a1a;
    --card2:            #222222;
    --text:             #f5f5f5;
    --text-muted:       #a1a1aa;
    --border:           #2a2a2a;
    --nav-bg:           rgba(15,15,15,0.95);
    --chip-off:         #262626;
    --dot-off:          #3f3f46;
    --kcal-bg:          rgba(4,120,87,0.18);
    --kcal-border:      rgba(4,120,87,0.3);
    --kcal-fg:          #34d399;
    --chip-protein-bg:  rgba(29,78,216,0.18);
    --chip-protein-fg:  #93c5fd;
    --chip-carbs-bg:    rgba(180,83,9,0.18);
    --chip-carbs-fg:    #fcd34d;
    --chip-fat-bg:      rgba(157,23,77,0.18);
    --chip-fat-fg:      #f9a8d4;
  }

  /* Animaciones de entrada del header */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .anim-header  { animation: fadeIn  0.5s ease both; }
  .anim-summary { animation: fadeUp  0.5s 0.15s ease both; }
  .anim-compra  { animation: fadeUp  0.4s 0.20s ease both; }

  /* Animaciones de swipe entre días */
  @keyframes pwa-slide-right {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pwa-slide-left {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

// ── Metadata PWA (dinámica por nutricionista) ─────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  const { data: plan } = await (supabaseAdminClient as any)
    .from('nutrition_plans')
    .select('*, patients(name, nutritionist_id)')
    .eq('patient_token', token)
    .in('status', ['approved', 'sent'])
    .single();

  const paciente = plan?.patients as { name: string; nutritionist_id: string } | null;
  const nombrePaciente = paciente?.name ?? 'Paciente';

  let nombreDN = 'tu nutricionista';
  let primaryColor = '#0a3622';

  if (paciente?.nutritionist_id) {
    const { data: prof } = await (supabaseAdminClient as any)
      .from('profiles')
      .select('full_name, primary_color')
      .eq('id', paciente.nutritionist_id)
      .single();
    if (prof?.full_name) nombreDN = prof.full_name;
    if (prof?.primary_color) primaryColor = prof.primary_color;
  }

  return {
    title: `${nombrePaciente} — Plan nutricional de ${nombreDN}`,
    description: 'Tu plan nutricional personalizado',
    manifest: '/manifest.json',
    themeColor: primaryColor,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Mi Plan',
    },
    icons: {
      apple: '/apple-touch-icon.png',
    },
  };
}

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
    .select('*, patients(name, nutritionist_id)')
    .eq('patient_token', token)
    .in('status', ['approved', 'sent'])
    .single();

  if (!plan) notFound();

  const content = plan.content as PlanContent | null;
  if (!content?.days?.length) notFound();

  // ── Registrar visita del paciente (fire-and-forget) ────────────────────────
  void (async () => {
    try {
      const reqHeaders = await headers();
      const ip =
        reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        reqHeaders.get('x-real-ip') ??
        null;

      const { data: existing } = await (supabaseAdminClient as any)
        .from('plan_views')
        .select('id, open_count')
        .eq('plan_id', plan.id)
        .maybeSingle();

      if (existing) {
        await (supabaseAdminClient as any)
          .from('plan_views')
          .update({
            last_opened_at: new Date().toISOString(),
            open_count: (existing.open_count ?? 0) + 1,
          })
          .eq('id', existing.id);
      } else {
        await (supabaseAdminClient as any)
          .from('plan_views')
          .insert({ plan_id: plan.id, patient_token: token, ip_address: ip });
      }
    } catch {
      // No bloqueamos el render si falla el registro
    }
  })();

  const pacienteData = plan.patients as { name: string; nutritionist_id: string } | null;
  const nombrePaciente = pacienteData?.name ?? 'Paciente';

  // Ajustes de marca del nutricionista
  let showMacros = true;
  let nombreDN: string | null = null;
  let colegiado: string | null = null;
  let primaryColor = '#1a7a45';

  if (pacienteData?.nutritionist_id) {
    const { data: profileBrand } = await (supabaseAdminClient as any)
      .from('profiles')
      .select('show_macros, full_name, college_number, primary_color')
      .eq('id', pacienteData.nutritionist_id)
      .single();
    if (profileBrand?.show_macros === false) showMacros = false;
    nombreDN = profileBrand?.full_name ?? null;
    colegiado = profileBrand?.college_number ?? null;
    if (profileBrand?.primary_color) primaryColor = profileBrand.primary_color;
  }

  const aprobadoEl = plan.approved_at
    ? new Date(plan.approved_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const diaActual = Math.min(
    Math.max(parseInt(dia ?? '1', 10) || 1, 1),
    content.days.length
  );

  const fechaSemana = new Date(plan.week_start_date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  const sm = content.week_summary;

  return (
    <>
      {/* CSS de la PWA — scoped a data-pwa-theme */}
      <style>{PWA_STYLES}</style>

      <PwaShell
        className={jakarta.className}
        style={{ minHeight: '100vh', background: 'var(--bg)', scrollBehavior: 'smooth' }}
      >
        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <header
          className='anim-header relative overflow-hidden px-5 pb-7'
          style={{
            background: `linear-gradient(150deg, color-mix(in srgb, ${primaryColor} 60%, #000) 0%, color-mix(in srgb, ${primaryColor} 80%, #000) 50%, ${primaryColor} 100%)`,
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)',
          }}
        >
          {/* Decoración geométrica */}
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

          <div className='flex items-start justify-between gap-3'>
            <div>
              <h1 className='text-2xl font-extrabold leading-tight text-white'>
                {nombrePaciente}
              </h1>
              <p className='mt-1 text-sm font-medium text-white/50'>
                Plan nutricional · semana del {fechaSemana}
              </p>
            </div>
            <BotonCompartir
              titulo={`Plan nutricional de ${nombrePaciente}`}
              texto='Mira mi plan nutricional personalizado'
            />
          </div>

          {/* Objetivos diarios — solo si show_macros */}
          {showMacros && (
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
          )}
        </header>

        {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
        <main className='mx-auto max-w-lg px-4 pb-24'>
          {/* Navegación + swipe + tarjetas de comida */}
          <VisorDias
            days={content.days}
            initialDay={diaActual}
            showMacros={showMacros}
            primaryColor={primaryColor}
          />

          {/* Lista de la compra interactiva */}
          {content.shopping_list && (
            <ListaCompraInteractiva
              shoppingList={content.shopping_list as Record<string, string[]>}
              categorias={CATEGORIAS_COMPRA}
              planId={plan.id}
              aggregateFn={aggregateShoppingList}
            />
          )}

          {/* Pie — transparencia IA (CLAUDE.md: siempre mencionar revisión profesional) */}
          <FooterTransparenciaIA
            nombreDN={nombreDN}
            colegiado={colegiado}
            aprobadoEl={aprobadoEl}
          />
        </main>

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </PwaShell>
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

function FooterTransparenciaIA({
  nombreDN,
  colegiado,
  aprobadoEl,
}: {
  nombreDN: string | null;
  colegiado: string | null;
  aprobadoEl: string | null;
}) {
  return (
    <div
      className='mt-10 rounded-2xl px-5 py-4 shadow-sm'
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className='mb-3 flex items-center gap-2'>
        <div
          className='flex h-6 w-6 items-center justify-center rounded-full'
          style={{ background: 'var(--chip-off)' }}
        >
          <svg
            className='h-3.5 w-3.5'
            style={{ color: 'var(--text-muted)' }}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='10' />
            <path d='M12 16v-4M12 8h.01' />
          </svg>
        </div>
        <p
          className='text-[11px] font-semibold uppercase tracking-wider'
          style={{ color: 'var(--text-muted)' }}
        >
          Sobre este plan
        </p>
      </div>

      <p className='text-[12px] leading-relaxed' style={{ color: 'var(--text-muted)' }}>
        Este plan nutricional fue elaborado con asistencia de inteligencia artificial (Claude,
        Anthropic) y revisado y aprobado
        {nombreDN ? (
          <>
            {' '}por{' '}
            <span className='font-semibold' style={{ color: 'var(--text)' }}>
              {nombreDN}
            </span>
            {colegiado ? (
              <span style={{ color: 'var(--text-muted)' }}>, nº colegiado {colegiado}</span>
            ) : null}
          </>
        ) : (
          ' por tu nutricionista'
        )}
        {aprobadoEl ? (
          <span style={{ color: 'var(--text-muted)' }}>, el {aprobadoEl}</span>
        ) : null}
        {'.'}
      </p>

      <p className='mt-2 text-[11px]' style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
        Los valores nutricionales son estimaciones de referencia. Ante cualquier duda, consulta
        directamente con tu nutricionista.
      </p>
    </div>
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
