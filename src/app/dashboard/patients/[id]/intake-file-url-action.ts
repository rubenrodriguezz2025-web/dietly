'use server';

import { getSession } from '@/features/account/controllers/get-session';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const SIGNED_URL_TTL = 60 * 10; // 10 minutos

export async function getIntakeFileUrl(path: string): Promise<{ url: string } | { error: string }> {
  const session = await getSession();
  if (!session?.user) return { error: 'No autenticado.' };

  // path esperado: <nutritionist_id>/<patient_id>/<filename>
  const nutritionistId = path.split('/')[0];
  if (!nutritionistId || nutritionistId !== session.user.id) {
    return { error: 'Acceso denegado.' };
  }

  const { data, error } = await supabaseAdminClient.storage
    .from('intake-files')
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data) return { error: 'No se pudo generar el enlace.' };
  return { url: data.signedUrl };
}
