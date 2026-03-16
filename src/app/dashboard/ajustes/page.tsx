import { redirect } from 'next/navigation';

import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { BrandSettings } from './brand-settings';
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
      'full_name, clinic_name, logo_url, college_number, signature_url, primary_color, show_macros, show_shopping_list, welcome_message, font_preference, profile_photo_url, brand_settings_visited_at'
    )
    .eq('id', user.id)
    .single();

  // Suscripción activa → determinar si es Plan Pro
  const subscription = await getSubscription();
  const productName: string = (subscription as any)?.prices?.products?.name ?? '';
  const isPro =
    subscription != null &&
    (productName.toLowerCase().includes('pro') ||
      productName.toLowerCase().includes('profesional') ||
      productName === ''); // fallback: cualquier suscripción activa

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
      <div>
        <h1 className='text-2xl font-bold text-zinc-100'>Ajustes del perfil</h1>
        <p className='mt-1 text-sm text-zinc-500'>
          Información que aparecerá en los planes PDF que generes.
        </p>
      </div>

      {/* ── Información personal ── */}
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <h2 className='mb-4 border-b border-zinc-800 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
          Información del perfil
        </h2>
        <ProfileForm
          fullName={profile?.full_name ?? ''}
          clinicName={profile?.clinic_name ?? null}
          collegeNumber={profile?.college_number ?? null}
        />
      </section>

      {/* ── Logo de la clínica (solo Pro) ── */}
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <div className='mb-4 flex items-center justify-between border-b border-zinc-800 pb-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Logo de la clínica
          </h2>
          {isPro ? (
            <span className='rounded-full bg-[#1a7a45]/20 px-2 py-0.5 text-xs font-medium text-[#22c55e]'>
              Plan Pro
            </span>
          ) : (
            <span className='rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500'>
              Plan Básico
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
      <section className='rounded-xl border border-zinc-800 bg-zinc-950 p-6'>
        <div className='mb-4 flex items-center justify-between border-b border-zinc-800 pb-3'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
            Firma digital
          </h2>
          {isPro ? (
            <span className='rounded-full bg-[#1a7a45]/20 px-2 py-0.5 text-xs font-medium text-[#22c55e]'>
              Plan Pro
            </span>
          ) : (
            <span className='rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500'>
              Plan Básico
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

      {/* ── Mi marca ── */}
      <div id='mi-marca'>
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
          brandSettingsVisitedAt={profile?.brand_settings_visited_at ?? null}
        />
      </div>
    </div>
  );
}
