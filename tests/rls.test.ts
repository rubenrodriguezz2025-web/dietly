/**
 * tests/rls.test.ts
 *
 * Tests de aislamiento Row Level Security (RLS) para cumplimiento RGPD.
 *
 * Verifica que el nutricionista A NO puede leer, modificar ni borrar
 * datos que pertenecen al nutricionista B, en todas las tablas críticas.
 *
 * Prerrequisitos (variables de entorno en .env.test):
 *   NEXT_PUBLIC_SUPABASE_URL       — URL del proyecto Supabase
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  — clave anon (JWT pública)
 *   SUPABASE_SERVICE_ROLE_KEY      — clave service_role (solo para setup/teardown)
 *
 * Ejecución:
 *   npx playwright test tests/rls.test.ts --project=rls
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// ── Configuración ─────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const SKIP = !SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY;

// Credenciales de usuarios de prueba (no deben existir en producción)
const USER_A = {
  email:    'rls-test-a@dietly-test.invalid',
  password: 'RlsTestA_2025!',
};
const USER_B = {
  email:    'rls-test-b@dietly-test.invalid',
  password: 'RlsTestB_2025!',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cliente con privilegios de servicio (bypassa RLS) — solo para setup/teardown */
function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Crea un cliente Supabase autenticado como el usuario dado */
async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session!.access_token}` } },
  });
}

// ── Estado del test ───────────────────────────────────────────────────────────

let admin: SupabaseClient;
let userAId: string;
let userBId: string;
let patientAId: string;
let patientBId: string;
let planAId: string;

// ── Setup ─────────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  if (SKIP) return;

  admin = adminClient();

  // Limpiar usuarios previos (por si quedaron de una ejecución fallida)
  for (const email of [USER_A.email, USER_B.email]) {
    const { data: existing } = await admin.auth.admin.listUsers();
    const user = existing?.users.find((u) => u.email === email);
    if (user) await admin.auth.admin.deleteUser(user.id);
  }

  // Crear usuario A
  const { data: createdA, error: errA } = await admin.auth.admin.createUser({
    email:    USER_A.email,
    password: USER_A.password,
    email_confirm: true,
  });
  if (errA) throw new Error(`No se pudo crear user A: ${errA.message}`);
  userAId = createdA.user.id;

  // Crear usuario B
  const { data: createdB, error: errB } = await admin.auth.admin.createUser({
    email:    USER_B.email,
    password: USER_B.password,
    email_confirm: true,
  });
  if (errB) throw new Error(`No se pudo crear user B: ${errB.message}`);
  userBId = createdB.user.id;

  // Crear perfil para usuario A (necesario como FK en algunas tablas)
  await (admin as any).from('profiles').upsert({
    id:        userAId,
    full_name: 'Test Nutricionista A',
  });

  // Crear perfil para usuario B
  await (admin as any).from('profiles').upsert({
    id:        userBId,
    full_name: 'Test Nutricionista B',
  });

  // Crear paciente para A (via service_role, bypassa RLS)
  const { data: patientA } = await (admin as any)
    .from('patients')
    .insert({
      nutritionist_id: userAId,
      name:            'Paciente de A',
      email:           'paciente-a@test.invalid',
    })
    .select('id')
    .single();
  patientAId = patientA.id;

  // Crear paciente para B
  const { data: patientB } = await (admin as any)
    .from('patients')
    .insert({
      nutritionist_id: userBId,
      name:            'Paciente de B',
      email:           'paciente-b@test.invalid',
    })
    .select('id')
    .single();
  patientBId = patientB.id;

  // Crear plan para A (status approved para testear el token)
  const { data: planA } = await (admin as any)
    .from('nutrition_plans')
    .insert({
      nutritionist_id: userAId,
      patient_id:      patientAId,
      status:          'approved',
      week_start_date: '2026-01-06',
    })
    .select('id')
    .single();
  planAId = planA.id;
});

// ── Teardown ──────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  if (SKIP || !admin) return;

  // Borrar datos de test (service_role bypassa RLS)
  if (patientAId) await (admin as any).from('patients').delete().eq('id', patientAId);
  if (patientBId) await (admin as any).from('patients').delete().eq('id', patientBId);
  if (userAId)    await admin.auth.admin.deleteUser(userAId);
  if (userBId)    await admin.auth.admin.deleteUser(userBId);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('RLS — Aislamiento entre nutricionistas', () => {

  test('nutricionista A solo ve sus propios pacientes', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data, error } = await (clientA as any)
      .from('patients')
      .select('id, nutritionist_id');

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    // Todos los pacientes devueltos deben ser del nutricionista A
    for (const p of data!) {
      expect(p.nutritionist_id).toBe(userAId);
    }

    // El paciente de B NO debe aparecer
    const ids = (data as any[]).map((p) => p.id);
    expect(ids).not.toContain(patientBId);
  });

  test('nutricionista B solo ve sus propios pacientes', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const clientB = await signedInClient(USER_B.email, USER_B.password);

    const { data, error } = await (clientB as any)
      .from('patients')
      .select('id, nutritionist_id');

    expect(error).toBeNull();
    const ids = (data as any[]).map((p) => p.id);
    expect(ids).not.toContain(patientAId);
  });

  test('nutricionista A no puede leer paciente de B por ID directo', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data, error } = await (clientA as any)
      .from('patients')
      .select('id')
      .eq('id', patientBId)
      .maybeSingle();

    // RLS debe devolver null (fila no visible) sin error de permisos
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('nutricionista A no puede UPDATE paciente de B', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data, error } = await (clientA as any)
      .from('patients')
      .update({ name: 'Hackeado por A' })
      .eq('id', patientBId)
      .select('id');

    // RLS debe silenciar la actualización (0 filas afectadas, no error)
    expect(error).toBeNull();
    expect(data).toHaveLength(0);

    // Verificar que el nombre de B sigue intacto
    const { data: check } = await (admin as any)
      .from('patients')
      .select('name')
      .eq('id', patientBId)
      .single();
    expect(check?.name).toBe('Paciente de B');
  });

  test('nutricionista A no puede DELETE paciente de B', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { error } = await (clientA as any)
      .from('patients')
      .delete()
      .eq('id', patientBId);

    expect(error).toBeNull(); // RLS silencia, no lanza error

    // Verificar que el paciente de B sigue existiendo
    const { data: check } = await (admin as any)
      .from('patients')
      .select('id')
      .eq('id', patientBId)
      .single();
    expect(check?.id).toBe(patientBId);
  });

  test('nutricionista A no puede leer planes de B', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data } = await (clientA as any)
      .from('nutrition_plans')
      .select('id, nutritionist_id');

    const ids = (data ?? []).map((p: any) => p.nutritionist_id);
    for (const id of ids) {
      expect(id).toBe(userAId);
    }
  });

  test('nutricionista A no puede leer consentimientos de pacientes de B', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    // Crear un consentimiento para el paciente B
    const { data: consent } = await (admin as any)
      .from('patient_consents')
      .insert({
        patient_id:           patientBId,
        nutritionist_id:      userBId,
        consent_type:         'ai_processing',
        consent_text_version: 'v1-test',
      })
      .select('id')
      .single();

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data } = await (clientA as any)
      .from('patient_consents')
      .select('id')
      .eq('id', consent.id)
      .maybeSingle();

    expect(data).toBeNull();

    // Limpiar
    await (admin as any).from('patient_consents').delete().eq('id', consent.id);
  });

  test('audit_logs — nutricionista A no puede leer logs de B', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    // Insertar un log de auditoría para B via service_role
    const { data: log } = await (admin as any)
      .from('audit_logs')
      .insert({
        user_id:       userBId,
        action:        'read',
        resource_type: 'patient',
        resource_id:   patientBId,
      })
      .select('id')
      .single();

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data } = await (clientA as any)
      .from('audit_logs')
      .select('id')
      .eq('id', log.id)
      .maybeSingle();

    expect(data).toBeNull();

    // Limpiar via service_role
    await (admin as any).from('audit_logs').delete().eq('id', log.id);
  });

  test('nutrition_plans — política USING (true) eliminada: A no puede leer plan de B por UUID', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    // Crear plan de B
    const { data: planB } = await (admin as any)
      .from('nutrition_plans')
      .insert({
        nutritionist_id: userBId,
        patient_id:      patientBId,
        status:          'draft',
        week_start_date: '2026-01-06',
      })
      .select('id')
      .single();

    const clientA = await signedInClient(USER_A.email, USER_A.password);

    const { data } = await (clientA as any)
      .from('nutrition_plans')
      .select('id')
      .eq('id', planB.id)
      .maybeSingle();

    // Con la política antigua USING (true) esto devolvería el plan.
    // Con RLS correcto debe devolver null.
    expect(data).toBeNull();

    // Limpiar
    await (admin as any).from('nutrition_plans').delete().eq('id', planB.id);
  });

  test('get_plan_by_patient_token RPC — solo devuelve planes approved/sent', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    // Obtener el patient_token del plan A (que está en status=approved)
    const { data: planData } = await (admin as any)
      .from('nutrition_plans')
      .select('patient_token')
      .eq('id', planAId)
      .single();

    // Llamar al RPC como anon (sin sesión)
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await (anonClient as any).rpc('get_plan_by_patient_token', {
      p_token: planData.patient_token,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(planAId);
  });

  test('get_plan_by_patient_token RPC — token inválido no devuelve datos', async () => {
    test.skip(SKIP, 'Variables de entorno no configuradas');

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const fakeToken = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await (anonClient as any).rpc('get_plan_by_patient_token', {
      p_token: fakeToken,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

});
