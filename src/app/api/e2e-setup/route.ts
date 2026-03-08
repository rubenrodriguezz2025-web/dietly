/**
 * /api/e2e-setup
 *
 * Endpoint exclusivo para tests E2E. Crea el usuario de test en Supabase
 * usando el service role key disponible en Vercel (no desde la máquina local).
 *
 * Protegido por E2E_SETUP_SECRET. Solo funciona si esa variable está definida.
 * El globalSetup de Playwright llama este endpoint con el secreto correcto.
 */
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Solo disponible si el secret está configurado en el entorno
  const setupSecret = process.env.E2E_SETUP_SECRET;
  if (!setupSecret) {
    return Response.json({ error: 'E2E setup not available' }, { status: 404 });
  }

  // Verificar el secreto del request
  const body = await request.json().catch(() => ({}));
  if (body.secret !== setupSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const email: string = body.email;
  const password: string = body.password;

  // Validar que sea un email de test (seguridad extra)
  if (!email || !email.includes('e2e') && !email.includes('playwright') && !email.includes('test')) {
    return Response.json({ error: 'Only test emails allowed' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Buscar si ya existe
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === email);

  let userId: string;

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { password });
    userId = existing.id;
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !created?.user) {
      return Response.json({ error: error?.message ?? 'Failed to create user' }, { status: 500 });
    }
    userId = created.user.id;
  }

  // Crear perfil si no existe
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!profile) {
    await supabase.from('profiles').insert({
      id: userId,
      full_name: 'Nutricionista E2E',
      specialty: 'general',
      clinic_name: 'Clínica E2E Test',
      subscription_tier: 'professional',
    });
  }

  return Response.json({ success: true, userId });
}
