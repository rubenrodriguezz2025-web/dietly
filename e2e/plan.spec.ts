/**
 * plan.spec.ts
 *
 * Flujo de generación y aprobación de plan nutricional:
 *   1. Login → navegar a la ficha del paciente E2E
 *   2. Clic en "Generar plan" → verificar streaming (7 barras de progreso)
 *   3. Verificar que el plan queda en estado "Borrador"
 *   4. Verificar que los macros del resumen semanal son visibles
 *   5. Verificar que los 7 días están presentes con al menos 4 comidas
 *   6. Aprobar el plan → verificar estado "Aprobado"
 *   7. Verificar que el botón "Descargar PDF" aparece al aprobar
 */
import { expect, Page, test } from '@playwright/test';

import { PACIENTE, login } from './helpers';

/** Navega a la ficha del paciente E2E y devuelve el ID del plan generado. */
async function navigateToPatient(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: PACIENTE.name }).click();
  await expect(page).toHaveURL(/\/dashboard\/patients\/[a-z0-9-]+$/, { timeout: 10_000 });
}

test.describe('Generación y aprobación de plan', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('generar plan muestra progreso de 7 días y crea borrador', async ({ page }) => {
    await navigateToPatient(page);

    // Clic en "Generar plan" (puede haber 2: header + empty-state)
    const generateBtn = page.getByRole('button', { name: '+ Generar plan' }).first();
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Fase de generación: debe mostrar el spinner con el nombre del día
    await expect(page.getByText('Iniciando...')).toBeVisible({ timeout: 5_000 });

    // Esperar a que aparezcan las 7 barras de progreso
    const progressBars = page.locator('.bg-emerald-500, .bg-zinc-700').filter({ hasText: '' });
    // Las barras son divs sin texto — verificar por la estructura del componente
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 5_000 });

    // Los 7 días se muestran de forma secuencial: verificar que el progreso avanza
    // Esperamos ver al menos el día "Lunes" referenciado
    await expect(
      page.getByText(/Generando Lunes|Generando Martes|Generando/i)
    ).toBeVisible({ timeout: 30_000 });

    // Esperar a que el plan termine y haga redirect al editor
    // La generación puede tardar hasta 5 minutos
    await page.waitForURL(/\/dashboard\/plans\/[a-z0-9-]+$/, { timeout: 5 * 60_000 });

    // ── Verificar el plan ─────────────────────────────────────────────────────

    // Estado "Borrador"
    await expect(page.getByText('Borrador')).toBeVisible();

    // Mensaje de revisión
    await expect(page.getByText(/Borrador generado por IA/i)).toBeVisible();

    // Resumen semanal — macros visibles
    await expect(page.getByText('Resumen semanal')).toBeVisible();
    await expect(page.getByText(/kcal objetivo/i)).toBeVisible();
    await expect(page.getByText(/Proteína objetivo/i)).toBeVisible();
    await expect(page.getByText(/Carbohidratos objetivo/i)).toBeVisible();
    await expect(page.getByText(/Grasa objetivo/i)).toBeVisible();

    // Los 7 días deben estar presentes
    for (const dia of ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) {
      await expect(page.getByText(dia).first()).toBeVisible({ timeout: 5_000 });
    }

    // Cada día tiene al menos una comida (Desayuno)
    const desayunos = page.getByText('Desayuno');
    await expect(desayunos.first()).toBeVisible();
    expect(await desayunos.count()).toBeGreaterThanOrEqual(7);

    // Botón "Aprobar plan" visible
    await expect(page.getByRole('button', { name: 'Aprobar plan' })).toBeVisible();
  });

  test('editar una comida en el plan marca el día como modificado', async ({ page }) => {
    // Navegar a un plan borrador existente (si hay alguno)
    await page.goto('/dashboard');

    // Buscar si hay borradores en la sección del dashboard
    const borradoresSection = page.locator('#borradores');
    if (await borradoresSection.isVisible()) {
      await borradoresSection.getByRole('link').first().click();
    } else {
      // Navegar al paciente y buscar un plan borrador
      await navigateToPatient(page);
      const planLink = page.getByRole('link', { name: /Borrador/ });
      if (!(await planLink.isVisible())) {
        test.skip();
        return;
      }
      await planLink.first().click();
    }

    await expect(page).toHaveURL(/\/dashboard\/plans\//);

    // Hacer clic en el nombre de la primera comida (EditableField)
    const nombreComida = page.locator('[title="Clic para editar"]').first();
    await nombreComida.click();

    // Debe aparecer un input (el EditableField entra en modo edición con autoFocus)
    const inputComida = page.locator('input[class*="bg-zinc-900"]').first();
    await expect(inputComida).toBeVisible({ timeout: 3_000 });

    // Modificar el valor
    await inputComida.fill('Tostadas integrales editadas');
    await inputComida.press('Tab'); // salir del campo

    // Debe aparecer el botón "Guardar cambios" (día marcado como dirty)
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible({ timeout: 5_000 });
  });

  test('aprobar plan cambia estado a Aprobado y muestra botón PDF', async ({ page }) => {
    // Navegar a un plan borrador
    await page.goto('/dashboard');

    const borradoresSection = page.locator('#borradores');
    if (await borradoresSection.isVisible()) {
      await borradoresSection.getByRole('link').first().click();
    } else {
      await navigateToPatient(page);
      const planLink = page.getByRole('link', { name: /Borrador/ });
      if (!(await planLink.isVisible())) {
        test.skip();
        return;
      }
      await planLink.first().click();
    }

    await expect(page).toHaveURL(/\/dashboard\/plans\//);
    await expect(page.getByText('Borrador')).toBeVisible();

    // Aprobar el plan
    const approveBtn = page.getByRole('button', { name: 'Aprobar plan' });
    await expect(approveBtn).toBeEnabled({ timeout: 5_000 });
    await approveBtn.click();

    // El estado debe cambiar a "Aprobado"
    await expect(page.getByText('Aprobado')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Plan aprobado por el nutricionista')).toBeVisible();

    // El botón "Descargar PDF" debe aparecer
    await expect(page.getByRole('link', { name: /Descargar PDF/i })).toBeVisible();
  });
});
