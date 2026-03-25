'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

type ActionResult = { error?: string; success?: boolean };

// ── Helper de autenticación ───────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Actualizar ajustes de marca (varios campos a la vez) ──────────────────────

export async function updateBrandSettings(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const show_macros = formData.get('show_macros') === 'true';
  const show_shopping_list = formData.get('show_shopping_list') === 'true';
  const welcome_message = (formData.get('welcome_message') as string | null)?.trim() || null;
  const font_preference = (formData.get('font_preference') as string | null) || 'clasica';
  const primary_color = (formData.get('primary_color') as string | null) || '#1a7a45';

  const { error } = await supabase
    .from('profiles')
    .update({ show_macros, show_shopping_list, welcome_message, font_preference, primary_color })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Toggle show_macros ────────────────────────────────────────────────────────

export async function updateShowMacros(value: boolean): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase
    .from('profiles')
    .update({ show_macros: value })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Toggle show_shopping_list ─────────────────────────────────────────────────

export async function updateShowShoppingList(value: boolean): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase
    .from('profiles')
    .update({ show_shopping_list: value })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Actualizar mensaje de bienvenida ──────────────────────────────────────────

export async function updateWelcomeMessage(text: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const welcome_message = text.trim() || null;

  const { error } = await supabase
    .from('profiles')
    .update({ welcome_message })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Actualizar preferencia de tipografía ──────────────────────────────────────

export async function updateFontPreference(
  font: 'clasica' | 'moderna' | 'minimalista'
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase
    .from('profiles')
    .update({ font_preference: font })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Actualizar color primario ─────────────────────────────────────────────────

export async function updatePrimaryColor(color: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase
    .from('profiles')
    .update({ primary_color: color })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Subir foto de perfil ──────────────────────────────────────────────────────

const PHOTO_BUCKET = 'nutritionist-photos';
const MAX_PHOTO_SIZE = 512 * 1024; // 512 KB
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function uploadProfilePhoto(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const file = formData.get('profile_photo') as File | null;
  if (!file || file.size === 0) return { error: 'Selecciona un archivo' };
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { error: 'Formato no permitido. Usa PNG, JPG o WebP.' };
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return { error: 'El archivo supera el límite de 512 KB.' };
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${user.id}/photo.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ profile_photo_url: path })
    .eq('id', user.id);

  if (dbError) return { error: dbError.message };

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Marcar primera visita a Mi marca ─────────────────────────────────────────

export async function markBrandSettingsVisited(): Promise<void> {
  const { supabase, user } = await getAuthUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ brand_settings_visited_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('brand_settings_visited_at', null); // solo si aún no está registrado

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/ajustes');
}

// ── Eliminar foto de perfil ───────────────────────────────────────────────────

export async function deleteProfilePhoto(
  _prev: ActionResult
): Promise<ActionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: 'No autorizado' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_photo_url')
    .eq('id', user.id)
    .single();

  if (profile?.profile_photo_url) {
    await supabase.storage.from(PHOTO_BUCKET).remove([profile.profile_photo_url as string]);
  }

  await supabase
    .from('profiles')
    .update({ profile_photo_url: null })
    .eq('id', user.id);

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}
