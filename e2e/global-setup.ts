/**
 * global-setup.ts
 *
 * Se ejecuta UNA VEZ antes de todos los tests.
 * Llama al endpoint /api/e2e-setup de la propia app desplegada para crear
 * el usuario de test sin necesidad de acceso directo a Supabase desde la
 * máquina local (que puede no tener conectividad o credenciales correctas).
 *
 * Requiere E2E_SETUP_SECRET en .env.test (o .env.local) y en Vercel.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.test');
const dotenvResult = dotenv.config({ path: envPath });

export default async function globalSetup() {
  // ── Debug: verificar carga de variables ──────────────────────────────────
  console.log('[global-setup] cwd:', process.cwd());
  console.log('[global-setup] .env.test path:', envPath);
  console.log('[global-setup] dotenv result:', dotenvResult.error ? `ERROR: ${dotenvResult.error.message}` : `OK (${Object.keys(dotenvResult.parsed ?? {}).join(', ')})`);
  console.log('[global-setup] E2E_SETUP_SECRET:', process.env.E2E_SETUP_SECRET ? `SET (${process.env.E2E_SETUP_SECRET.slice(0, 4)}***)` : 'NOT SET');
  console.log('[global-setup] TEST_EMAIL:', process.env.TEST_EMAIL ?? 'NOT SET');
  console.log('[global-setup] TEST_BASE_URL:', process.env.TEST_BASE_URL ?? 'NOT SET');

  const baseUrl = process.env.TEST_BASE_URL ?? 'https://dietly.es';
  const email = process.env.TEST_EMAIL ?? 'test-e2e@dietly.es';
  const password = process.env.TEST_PASSWORD ?? 'TestDietly2025!';
  const setupSecret = process.env.E2E_SETUP_SECRET;

  if (!setupSecret) {
    console.warn(
      '\n⚠️  global-setup: E2E_SETUP_SECRET no configurado.\n' +
        '   Añade E2E_SETUP_SECRET=<secreto> a .env.test Y a Vercel para crear el usuario de test automáticamente.\n' +
        '   Si el usuario ya existe en Supabase, los tests de login seguirán funcionando.\n',
    );
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/e2e-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: setupSecret, email, password }),
    });

    if (res.ok) {
      console.log(`✅ global-setup: usuario de test listo → ${email}`);
    } else {
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) {
        console.warn('\n⚠️  global-setup: el endpoint /api/e2e-setup no está disponible.\n   Asegúrate de configurar E2E_SETUP_SECRET en Vercel.\n');
      } else {
        console.warn(`⚠️  global-setup: error al crear usuario: ${body.error ?? res.status}`);
      }
    }
  } catch (err) {
    console.warn(`⚠️  global-setup: no se pudo contactar con ${baseUrl}: ${err}`);
  }
}
