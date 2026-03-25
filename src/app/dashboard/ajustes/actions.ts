'use server';

import { revalidatePath } from 'next/cache';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const MAX_SIZE_BYTES = 512 * 1024; // 512 KB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const BUCKET = 'nutritionist-logos';

// ── Subir o reemplazar el logo ────────────────────────────────────────────────

export async function uploadLogo(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const file = formData.get('logo') as File | null;
  if (!file || file.size === 0) return { error: 'Selecciona un archivo' };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Formato no permitido. Usa PNG, JPG o WebP.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'El archivo supera el límite de 512 KB.' };
  }

  // Extensión a partir del MIME type
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${user.id}/logo.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return { error: uploadError.message };

  // Guardar la ruta en profiles
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ logo_url: path })
    .eq('id', user.id);

  if (dbError) return { error: dbError.message };

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Eliminar el logo ──────────────────────────────────────────────────────────

export async function deleteLogo(
  _prev: { error?: string; success?: boolean }
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // Obtener la ruta actual
  const { data: profile } = await supabase
    .from('profiles')
    .select('logo_url')
    .eq('id', user.id)
    .single();

  if (profile?.logo_url) {
    await supabase.storage.from(BUCKET).remove([profile.logo_url as string]);
  }

  await supabase
    .from('profiles')
    .update({ logo_url: null })
    .eq('id', user.id);

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Actualizar perfil (nombre y clínica) ──────────────────────────────────────

export async function updateProfile(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const full_name = (formData.get('full_name') as string).trim();
  const clinic_name = (formData.get('clinic_name') as string).trim() || null;
  const college_number = (formData.get('college_number') as string).trim() || null;

  if (!full_name) return { error: 'El nombre es obligatorio' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, clinic_name, college_number })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Subir o reemplazar la firma ───────────────────────────────────────────────

const SIG_BUCKET = 'nutritionist-signatures';

export async function uploadSignature(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const file = formData.get('signature') as File | null;
  if (!file || file.size === 0) return { error: 'Selecciona un archivo' };
  if (!['image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Solo se admite PNG o WebP (fondo transparente recomendado).' };
  }
  if (file.size > 262144) {
    return { error: 'El archivo supera el límite de 256 KB.' };
  }

  const ext = file.type === 'image/webp' ? 'webp' : 'png';
  const path = `${user.id}/signature.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(SIG_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ signature_url: path })
    .eq('id', user.id);

  if (dbError) return { error: dbError.message };

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}

// ── Eliminar la firma ─────────────────────────────────────────────────────────

export async function deleteSignature(
  _prev: { error?: string; success?: boolean }
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('signature_url')
    .eq('id', user.id)
    .single();

  if (profile?.signature_url) {
    await supabase.storage.from(SIG_BUCKET).remove([profile.signature_url as string]);
  }

  await supabase
    .from('profiles')
    .update({ signature_url: null })
    .eq('id', user.id);

  revalidatePath('/dashboard/ajustes');
  return { success: true };
}
