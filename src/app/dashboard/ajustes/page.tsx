import { redirect } from 'next/navigation';

import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { BrandSettings } from './brand-settings';
import { BrandVisitTracker } from './brand-visit-tracker';
import { LogoForm } from './logo-form';
import { ProfileForm } from './profile-form';
import { SignatureForm } from './signature-form';

export default async function AjustesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Perfil del nutricionista (incluye nuevas columnas de marca)
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select(
      'full_name, clinic_name, logo_url, college_number, signature_url, primary_color, show_macros, show_shopping_list, welcome_message, font_preference, profile_photo_url, brand_settings_visited_at, whatsapp_number'
    )
    .eq('id', user.id)
    .single();

  // Suscripción activa → determinar si es Plan Pro
  const subscription = await getSubscription();
  const isPro =
    subscription != null &&
    !!process.env.STRIPE_PRICE_PRO_ID &&
    subscription.price_id === process.env.STRIPE_PRICE_PRO_ID;

  // URL firmada del logo para previsualización (1 hora de validez)
  let logoPreviewUrl: string | null = null;
  if (profile?.logo_url) {
    const { data: signed } = await supabase.storage
      .from('nutritionist-logos')
      .createSignedUrl(profile.logo_url as string, 3600);
    logoPreviewUrl = signed?.signedUrl ?? null;
  }

  // URL firmada de la firma para previsualización (1 hora de validez)
  let signaturePreviewUrl: string | null = null;
  if (profile?.signature_url) {
    const { data: signed } = await supabase.storage
      .from('nutritionist-signatures')
      .createSignedUrl(profile.signature_url as string, 3600);
    signaturePreviewUrl = signed?.signedUrl ?? null;
  }

  // URL firmada de la foto de perfil para previsualización (1 hora de validez)
  let profilePhotoPreviewUrl: string | null = null;
  if (profile?.profile_photo_url) {
    const { data: signed } = await supabase.storage
      .from('nutritionist-photos')
      .createSignedUrl(profile.profile_photo_url as string, 3600);
    profilePhotoPreviewUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-zinc-100'>Ajustes</h1>
          <p className='mt-1 text-sm text-zinc-500'>
            Información que aparecerá en los planes PDF que generes.
          </p>
        </div>
        {/* Plan badge */}
        <div
          className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 ${
            isPro
              ? 'border-[#1a7a45]/30 bg-[#1a7a45]/10'
              : 'border-zinc-800 bg-zinc-950'
          }`}
        >
          <div className={`h-2 w-2 rounded-full ${isPro ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          <span className={`text-sm font-semibold ${isPro ? 'text-emerald-300' : 'text-zinc-400'}`}>
            {isPro ? 'Plan Profesional' : 'Plan Básico'}
          </span>
        </div>
      </div>

      {/* CTA upgrade para plan básico */}
      {!isPro && (
        <div className='flex items-center justify-between gap-4 rounded-xl border border-amber-900/40 bg-amber-950/15 px-5 py-4'>
          <div>
            <p className='text-sm font-semibold text-amber-300'>
              Logo, firma digital y colores personalizados — Plan Profesional
            </p>
            <p className='mt-0.5 text-xs text-amber-600'>
              Añade tu identidad visual a todos los PDFs que entregas a tus pacientes.
            </p>
          </div>
          <a
            href='/dashboard/admin/beta'
            className='flex-shrink-0 rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:border-amber-600 hover:bg-amber-950/60'
          >
            Ver planes →
          </a>
        </div>
      )}

      {/* ── Mi marca (arriba para visibilidad) ── */}
      <div id='mi-marca'>
        {!profile?.brand_settings_visited_at && <BrandVisitTracker />}

        <h2 className='mb-1 text-xl font-bold text-zinc-100'>Mi marca</h2>
        <p className='mb-6 text-sm text-zinc-500'>
          Personaliza el aspecto y contenido de todos tus planes nutricionales en PDF.
        </p>
        <BrandSettings
          primaryColor={profile?.primary_color ?? '#1a7a45'}
          showMacros={profile?.show_macros ?? true}
          showShoppingList={profile?.show_shopping_list ?? true}
          welcomeMessage={profile?.welcome_message ?? null}
          fontPreference={profile?.font_preference ?? 'clasica'}
          profilePhotoUrl={profilePhotoPreviewUrl}
        />
      </div>

      {/* ── Logo de la clínica (solo Pro) ── */}
      <section className={`rounded-xl border p-6 ${isPro ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800/60 bg-zinc-950/50'}`}>
        <div className='mb-4 flex items-center justify-between border-b border-zinc-800 pb-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Logo de la clínica
          </h2>
          {isPro ? (
            <span className='rounded-full bg-[#1a7a45]/20 px-2 py-0.5 text-xs font-medium text-emerald-400'>
              ✓ Activo
            </span>
          ) : (
            <span className='flex items-center gap-1 rounded-full bg-amber-950/40 px-2 py-0.5 text-xs font-medium text-amber-500'>
              <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' /></svg>
              Solo Pro
            </span>
          )}
        </div>
        <p className='mb-1 text-xs text-zinc-500'>
          El logo aparece en el encabezado y portada de los PDFs que generas para tus
          pacientes.{' '}
          {!isPro && 'Disponible en el Plan Profesional.'}
        </p>
        <p className='mb-4 text-xs text-zinc-600'>
          Si no tienes logo, puedes usar tu nombre o el de tu clínica — el PDF quedará
          igualmente profesional.
        </p>
        <LogoForm currentLogoUrl={logoPreviewUrl} isPro={isPro} />
      </section>

      {/* ── Firma digital (solo Pro) ── */}
      <section className={`rounded-xl border p-6 ${isPro ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800/60 bg-zinc-950/50'}`}>
        <div className='mb-4 flex items-center justify-between border-b border-zinc-800 pb-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Firma digital
          </h2>
          {isPro ? (
            <span className='rounded-full bg-[#1a7a45]/20 px-2 py-0.5 text-xs font-medium text-emerald-400'>
              ✓ Activo
            </span>
          ) : (
            <span className='flex items-center gap-1 rounded-full bg-amber-950/40 px-2 py-0.5 text-xs font-medium text-amber-500'>
              <svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' /></svg>
              Solo Pro
            </span>
          )}
        </div>
        <p className='mb-4 text-xs text-zinc-500'>
          La firma aparece sobre el pie de página en los PDFs aprobados.{' '}
          Usa PNG o WebP con fondo transparente para mejor resultado.{' '}
          {!isPro && 'Disponible en el Plan Profesional.'}
        </p>
        <SignatureForm currentSignatureUrl={signaturePreviewUrl} isPro={isPro} />
      </section>

      {/* ── Información personal ── */}
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Información del perfil
        </h2>
        <ProfileForm
          fullName={profile?.full_name ?? ''}
          clinicName={profile?.clinic_name ?? null}
          collegeNumber={profile?.college_number ?? null}
          whatsappNumber={profile?.whatsapp_number ?? null}
        />
      </section>
    </div>
  );
}
