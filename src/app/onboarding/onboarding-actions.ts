'use server';

import { createElement } from 'react';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';

import { OnboardingWelcomeEmail } from '@/features/emails/onboarding-welcome';
import { resendClient } from '@/libs/resend/resend-client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { render } from '@react-email/components';

type ActionResult = { error?: string; success?: boolean };

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_BUCKET = 'nutritionist-logos';

// ── Step 2: guardar perfil profesional ───────────────────────────────────────
// No establece onboarding_completed_at todavía (eso ocurre al finalizar el wizard)

export async function saveProfileWizard(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const full_name = (formData.get('full_name') as string).trim();
  const clinic_name = (formData.get('clinic_name') as string).trim() || null;
  const specialty = formData.get('specialty') as string;
  const college_number = (formData.get('college_number') as string | null)?.trim() || null;
  const aiLiteracy = formData.get('ai_literacy') === 'on';

  if (!full_name) return { error: 'El nombre es obligatorio.' };
  if (!specialty) return { error: 'Selecciona tu especialidad.' };
  if (!aiLiteracy) {
    return { error: 'Debes confirmar que conoces las capacidades y limitaciones de la IA.' };
  }

  const now = new Date().toISOString();
  const profileData = {
    id: user.id,
    full_name,
    clinic_name,
    specialty,
    ...(college_number ? { college_number } : {}),
    ai_literacy_acknowledged_at: now,
  };

  const { error } = await (supabase as any).from('profiles').upsert(profileData);

  if (error?.message?.includes('schema cache')) {
    const { ai_literacy_acknowledged_at: _, ...fallbackData } = profileData;
    const { error: retryError } = await (supabase as any).from('profiles').upsert(fallbackData);
    if (retryError) return { error: retryError.message };
  } else if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ── Step 3: guardar logo y color de marca ─────────────────────────────────────

export async function saveBrandWizard(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const primary_color = (formData.get('primary_color') as string | null) || '#1a7a45';

  // Guardar color — siempre
  const { error: colorError } = await supabase
    .from('profiles')
    .update({ primary_color })
    .eq('id', user.id);

  if (colorError) return { error: colorError.message };

  // Subir logo — solo si hay archivo
  const file = formData.get('logo') as File | null;
  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Formato no permitido. Usa PNG, JPG o WebP.' };
    }
    if (file.size > MAX_SIZE_BYTES) {
      return { error: 'La imagen es demasiado grande (máx. 5 MB). Prueba con una más ligera.' };
    }

    // Optimizar: redimensionar a max 800x800 y convertir a WebP calidad 85
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const optimized = await sharp(rawBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const path = `${user.id}/logo.webp`;

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, optimized, { contentType: 'image/webp', upsert: true });

    if (uploadError) return { error: uploadError.message };

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ logo_url: path })
      .eq('id', user.id);

    if (dbError) return { error: dbError.message };
  }

  revalidatePath('/onboarding');
  return { success: true };
}

// ── Completar onboarding ───────────────────────────────────────────────────────
// Establece onboarding_completed_at y envía email de bienvenida al nutricionista

export async function markOnboardingComplete(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: now })
    .eq('id', user.id);

  if (error) return { error: error.message };

  // Email de bienvenida al nutricionista — no bloquea si falla
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const name = profile?.full_name ?? 'nutricionista';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const dashboardUrl = `${appUrl}/dashboard`;

    // Notificación interna
    await resendClient.emails.send({
      from: 'Dietly <noreply@dietly.es>',
      to: 'hola@dietly.es',
      subject: `Nuevo onboarding completado — ${name}`,
      text: `${name} (${user.email}) ha completado el onboarding de Dietly.`,
    });

    // Email de bienvenida al propio nutricionista
    if (user.email) {
      const emailElement = createElement(OnboardingWelcomeEmail, { name, dashboardUrl });
      const [html, text] = await Promise.all([
        render(emailElement),
        render(emailElement, { plainText: true }),
      ]);

      await resendClient.emails.send({
        from: 'Dietly <hola@dietly.es>',
        to: user.email,
        subject: `Bienvenida a Dietly, ${name} 🌱`,
        html,
        text,
      });
    }
  } catch {
    // El email no es crítico
  }

  return { success: true };
}
