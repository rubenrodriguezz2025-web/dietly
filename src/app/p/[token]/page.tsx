import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { validatePlanAccessToken } from '@/libs/auth/plan-tokens';
import { aggregateShoppingList } from '@/libs/shopping-list';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { PlanContent } from '@/types/dietly';

import { BannerInstalar } from './banner-instalar';
import { BienvenidaPwa } from './bienvenida-pwa';
import { BotonDescargar } from './boton-descargar';
import { BotonWhatsApp } from './boton-whatsapp';
import { ConsentimientoView } from './consentimiento-view';
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

  /* Animaciones bienvenida PWA */
  @keyframes bvBackdropIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bvBackdropOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes bvCardUp      { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bvCardDown    { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(100%); } }

  .pwa-bv-backdrop { animation: bvBackdropIn  0.28s ease both; }
  .pwa-bv-backdrop.saliendo { animation: bvBackdropOut 0.28s ease both; }
  .pwa-bv-card { animation: bvCardUp   0.32s cubic-bezier(0.32,0.72,0,1) both; }
  .pwa-bv-card.saliendo { animation: bvCardDown  0.28s cubic-bezier(0.32,0.72,0,1) both; }

  /* Animaciones banner instalar */
  @keyframes bannerUp   { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bannerDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(100%); } }

  .pwa-banner { animation: bannerUp   0.30s cubic-bezier(0.32,0.72,0,1) both; }
  .pwa-banner.saliendo { animation: bannerDown 0.28s cubic-bezier(0.32,0.72,0,1) both; }

  /* Expansión instrucciones con grid-template-rows */
  .pwa-instruc-wrap {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.22s ease, margin-top 0.22s ease;
    overflow: hidden;
  }
  .pwa-instruc-wrap.open { grid-template-rows: 1fr; }
  .pwa-instruc-inner { min-height: 0; }

  /* Animaciones bottom sheet intercambio de platos */
  @keyframes swapBackdropIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes swapBackdropOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes swapSheetIn     { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
  @keyframes swapSheetOut    { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(100%); } }
  @keyframes swapCheckIn     { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }

  .pwa-swap-backdrop-in  { animation: swapBackdropIn  0.22s ease both; }
  .pwa-swap-backdrop-out { animation: swapBackdropOut 0.22s ease both; }
  .pwa-swap-sheet-in     { animation: swapSheetIn     0.32s cubic-bezier(0.32,0.72,0,1) both; }
  .pwa-swap-sheet-out    { animation: swapSheetOut    0.28s cubic-bezier(0.32,0.72,0,1) both; }
  .pwa-swap-check-in     { animation: swapCheckIn     0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

  @media (prefers-reduced-motion: reduce) {
    .pwa-swap-backdrop-in, .pwa-swap-backdrop-out,
    .pwa-swap-sheet-in, .pwa-swap-sheet-out,
    .pwa-swap-check-in { animation-duration: 0.01ms !important; }
  }

  /* Ocultar elementos no imprimibles al guardar como PDF */
  @media print {
    [data-pwa-theme] { --bg: #ffffff; --card: #ffffff; --text: #18181b; --text-muted: #71717a; --border: #e4e4e7; }
    button, .pwa-banner, .pwa-bv-backdrop, .pwa-bv-card, [aria-label="Contactar con tu nutricionista por WhatsApp"] { display: none !important; }
    .pwa-header-sticky { display: none !important; }
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

// ── Viewport (themeColor no puede ir en metadata) ─────────────────────────────

export const viewport: Viewport = {
  themeColor: '#1a7a45',
};

// ── Página ────────────────────────────────────────────────────────────────────

export default async function PaginaPaciente({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ dia?: string; h?: string; e?: string }>;
}) {
  const { token } = await params;
  const { dia, h: hmac, e: expires } = await searchParams;

  // HMAC obligatorio — sin firma criptográfica no se accede al plan
  if (!hmac || !expires) {
    notFound();
  }

  const result = await validatePlanAccessToken(token, hmac, expires);
  if (!result.valid) {
    notFound();
  }

  const { data: plan } = await (supabaseAdminClient as any)
    .from('nutrition_plans')
    .select('*, patients(id, name, nutritionist_id)')
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

  const pacienteData = plan.patients as {
    id: string;
    name: string;
    nutritionist_id: string;
  } | null;

  // Ajustes de marca + verificación de consentimiento previo (en paralelo)
  let showMacros = true;
  let nombreDN: string | null = null;
  let colegiado: string | null = null;
  let clinicName: string | null = null;
  let primaryColor = '#1a7a45';
  let whatsappNumber: string | null = null;
  let logoUrl: string | null = null;
  let consentAlreadyGiven = false;

  if (pacienteData?.nutritionist_id) {
    const [profileResult, consentResult] = await Promise.all([
      (supabaseAdminClient as any)
        .from('profiles')
        .select('show_macros, full_name, college_number, primary_color, clinic_name, whatsapp_number, logo_url')
        .eq('id', pacienteData.nutritionist_id)
        .single(),
      pacienteData?.id
        ? (supabaseAdminClient as any)
            .from('patient_consents')
            .select('id')
            .eq('patient_id', pacienteData.id)
            .eq('consent_type', 'plan_view_acceptance')
            .is('revoked_at', null)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const profileBrand = profileResult.data;
    if (profileBrand?.show_macros === false) showMacros = false;
    nombreDN = profileBrand?.full_name ?? null;
    colegiado = profileBrand?.college_number ?? null;
    clinicName = profileBrand?.clinic_name ?? null;
    if (profileBrand?.primary_color) primaryColor = profileBrand.primary_color;
    whatsappNumber = profileBrand?.whatsapp_number ?? null;
    logoUrl = profileBrand?.logo_url ?? null;

    consentAlreadyGiven = !!consentResult.data;
  }

  // Pre-agregar la lista de la compra en el servidor para no pasar funciones al cliente
  const rawShoppingList = content.shopping_list as Record<string, string[]> | undefined;
  const aggregatedShoppingList: Record<string, string[]> = {};
  if (rawShoppingList) {
    for (const [key, items] of Object.entries(rawShoppingList)) {
      if (Array.isArray(items) && items.length > 0) {
        aggregatedShoppingList[key] = aggregateShoppingList(items);
      }
    }
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

  return (
    <>
      {/* CSS de la PWA — scoped a data-pwa-theme */}
      <style>{PWA_STYLES}</style>

      <PwaShell
        className={jakarta.className}
        style={{ minHeight: '100vh', background: 'var(--bg)', scrollBehavior: 'smooth' }}
      >
        {/* ── Branding header del nutricionista — sticky ───────────────────── */}
        <div
          className='pwa-header-sticky sticky top-0 z-20 w-full'
          style={{
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <header className='mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5'>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={clinicName ?? nombreDN ?? ''}
                width={32}
                height={32}
                className='h-8 w-8 flex-shrink-0 rounded-full object-cover'
                style={{ border: `2px solid ${primaryColor}` }}
              />
            ) : (nombreDN || clinicName) ? (
              <span
                className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
                style={{ background: primaryColor }}
                aria-hidden='true'
              >
                {(clinicName ?? nombreDN ?? '').charAt(0).toUpperCase()}
              </span>
            ) : null}
            <span
              className='truncate text-sm font-semibold'
              style={{ color: 'var(--text)' }}
            >
              {clinicName ?? nombreDN ?? ''}
            </span>
            <div className='ml-auto flex-shrink-0'>
              <BotonDescargar variant='compact' />
            </div>
          </header>
        </div>

        {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
        <main className='mx-auto max-w-lg px-4 pb-24'>
          {/* Navegación + swipe + tarjetas de comida */}
          <VisorDias
            days={content.days}
            initialDay={diaActual}
            showMacros={showMacros}
            primaryColor={primaryColor}
            planId={plan.id as string}
            patientToken={token}
          />

          {/* Lista de la compra interactiva */}
          {content.shopping_list && (
            <ListaCompraInteractiva
              shoppingList={aggregatedShoppingList}
              categorias={CATEGORIAS_COMPRA}
              planId={plan.id}
            />
          )}

          {/* Botón guardar como PDF */}
          <BotonDescargar />

          {/* Pie — transparencia IA (CLAUDE.md: siempre mencionar revisión profesional) */}
          <FooterTransparenciaIA
            nombreDN={nombreDN}
            colegiado={colegiado}
            aprobadoEl={aprobadoEl}
          />
        </main>

        {/* Firma digital RGPD — bloquea el plan hasta que el paciente acepta */}
        {!consentAlreadyGiven && pacienteData?.id && (
          <ConsentimientoView
            planId={plan.id as string}
            patientId={pacienteData.id}
            nutritionistId={pacienteData.nutritionist_id}
            primaryColor={primaryColor}
            nombreDN={nombreDN ?? 'tu nutricionista'}
          />
        )}

        {/* Bienvenida primera visita */}
        <BienvenidaPwa
          planId={plan.id as string}
          nombreDN={nombreDN ?? ''}
          clinicName={clinicName}
          primaryColor={primaryColor}
        />

        {/* Botón flotante WhatsApp (solo si el nutricionista tiene número configurado) */}
        {whatsappNumber && (
          <BotonWhatsApp
            whatsappNumber={whatsappNumber}
            nombrePaciente={pacienteData?.name ?? 'Paciente'}
          />
        )}

        {/* Banner instalar PWA (visitas de vuelta) */}
        <BannerInstalar planId={plan.id as string} />

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
        Este plan ha sido preparado y aprobado por{' '}
        <span className='font-semibold' style={{ color: 'var(--text)' }}>
          {nombreDN ?? 'tu nutricionista'}
        </span>
        {colegiado ? (
          <span>, nº colegiado {colegiado}</span>
        ) : null}
        {aprobadoEl ? (
          <span>, el {aprobadoEl}</span>
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
