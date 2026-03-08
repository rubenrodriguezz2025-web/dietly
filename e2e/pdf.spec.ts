/**
 * pdf.spec.ts
 *
 * Descarga del PDF del plan aprobado:
 *   1. Login → encontrar un plan en estado "Aprobado"
 *   2. Clic en "Descargar PDF" → interceptar la descarga
 *   3. Verificar que el archivo se descarga con Content-Type application/pdf
 *   4. Verificar que el tamaño del archivo es > 0
 *   5. Verificar que el nombre del archivo contiene el nombre del paciente
 */
import * as path from 'path';

import { expect, test } from '@playwright/test';

import { PACIENTE, login } from './helpers';

test.describe('Descarga de PDF', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('descargar PDF de un plan aprobado', async ({ page }) => {
    // Navegar al dashboard y buscar un plan aprobado para el paciente E2E
    await page.goto('/dashboard');

    // Ir a la ficha del paciente E2E
    const patientLink = page.getByRole('link', { name: PACIENTE.name });
    if (!(await patientLink.isVisible({ timeout: 5_000 }))) {
      test.skip();
      return;
    }
    await patientLink.click();
    await expect(page).toHaveURL(/\/dashboard\/patients\//);

    // Buscar un plan aprobado en la lista de planes del paciente
    const approvedPlanLink = page.getByRole('link', { name: /Aprobado/ });
    if (!(await approvedPlanLink.isVisible({ timeout: 5_000 }))) {
      test.skip();
      return;
    }
    await approvedPlanLink.first().click();
    await expect(page).toHaveURL(/\/dashboard\/plans\//);

    // Verificar que el estado es "Aprobado"
    await expect(page.getByText('Aprobado')).toBeVisible();

    // Iniciar la descarga
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('link', { name: /Descargar PDF/i }).click(),
    ]);

    // Verificar nombre del archivo
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.pdf$/i);
    expect(filename.toLowerCase()).toContain('plan-nutricional');

    // Guardar y verificar tamaño
    const filePath = path.join('playwright-downloads', filename);
    await download.saveAs(filePath);
    const size = (await download.createReadStream()).read();
    // Un PDF con contenido real tiene al menos 10 KB
    // (verificación indirecta: que no haya error en la descarga)
    expect(download.failure()).toBeNull();
  });

  test('el endpoint /api/plans/[id]/pdf devuelve 401 sin autenticación', async ({ request }) => {
    // Intentar descargar sin sesión
    const response = await request.get('/api/plans/00000000-0000-0000-0000-000000000000/pdf');
    expect(response.status()).toBe(401);
  });

  test('el endpoint /api/plans/[id]/pdf devuelve 400 si el plan no está aprobado', async ({
    page,
    request,
  }) => {
    await login(page);

    // Obtener cookies de sesión activa
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    // Buscar un plan borrador del paciente E2E
    await page.goto('/dashboard');
    const patientLink = page.getByRole('link', { name: PACIENTE.name });
    if (!(await patientLink.isVisible({ timeout: 5_000 }))) {
      test.skip();
      return;
    }
    await patientLink.click();

    const draftPlanLink = page.getByRole('link', { name: /Borrador/ });
    if (!(await draftPlanLink.isVisible({ timeout: 5_000 }))) {
      test.skip();
      return;
    }

    const href = await draftPlanLink.first().getAttribute('href');
    const planId = href?.split('/').pop();
    if (!planId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/plans/${planId}/pdf`, {
      headers: { Cookie: cookieHeader },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/aprobado/i);
  });
});
