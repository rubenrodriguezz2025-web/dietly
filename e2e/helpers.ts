/**
 * Helpers compartidos entre todos los specs de Playwright.
 */
import { expect, Page } from '@playwright/test';

export const EMAIL = process.env.TEST_EMAIL ?? 'test-e2e@dietly.es';
export const PASSWORD = process.env.TEST_PASSWORD ?? 'TestDietly2025!';

/** Nombre y datos del paciente de prueba (deterministas para reutilizar en specs). */
export const PACIENTE = {
  name: 'Paciente E2E Playwright',
  email: 'paciente-e2e@playwright.test',
  weight: '75',
  height: '175',
  goal: 'weight_loss',
  activity: 'moderately_active',
  sex: 'female',
  preferences: 'No le gusta el pescado azul',
  medicalNotes: 'Sin patologías relevantes',
};

/**
 * Inicia sesión con email + contraseña y espera a llegar al dashboard.
 * Si ya hay una sesión activa (storageState guardado) simplemente navega.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

/**
 * Espera a que la URL contenga el patrón dado (útil para redirecciones dinámicas).
 */
export async function waitForUrl(page: Page, pattern: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern, { timeout: 30_000 });
}

/**
 * Busca en el dashboard el paciente de prueba por nombre y devuelve su href.
 */
export async function getPatientLink(page: Page): Promise<string> {
  await page.goto('/dashboard');
  const link = page.getByRole('link', { name: PACIENTE.name });
  await expect(link).toBeVisible({ timeout: 10_000 });
  const href = await link.getAttribute('href');
  if (!href) throw new Error('No se encontró el link del paciente');
  return href;
}
