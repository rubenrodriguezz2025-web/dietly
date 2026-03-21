import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.local primero (Supabase vars) y .env.test después (sobreescribe TEST_*)
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.test'), override: true });

const BASE_URL = process.env.TEST_BASE_URL ?? 'https://dietly.es';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, // Los tests comparten estado de usuario → secuencial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: BASE_URL,
    // Guardar estado de autenticación entre tests del mismo archivo
    storageState: undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Esperar más en producción (generación IA puede tardar)
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Solo Chromium — suficiente para CI y local
  projects: [
    {
      name: 'chromium',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Tests de aislamiento RLS — sin navegador, solo Supabase JS client
      // Ejecutar con: npx playwright test --project=rls
      name: 'rls',
      testDir: './tests',
      use: {},
    },
  ],

  // Timeout global por test (plan/generación IA puede tardar hasta 5 min)
  timeout: 5 * 60_000,
  expect: { timeout: 10_000 },
});
