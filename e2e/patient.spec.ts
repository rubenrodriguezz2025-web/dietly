/**
 * patient.spec.ts
 *
 * Flujo de creación y verificación de paciente:
 *   1. Login
 *   2. Crear paciente con datos completos (personales, antropométricos,
 *      restricciones, notas clínicas)
 *   3. Verificar redirect a la ficha del paciente
 *   4. Verificar que los datos guardados son correctos (TMB/TDEE calculados)
 *   5. Verificar que el paciente aparece en el dashboard
 */
import { expect, test } from '@playwright/test';

import { PACIENTE, login } from './helpers';

test.describe('Gestión de pacientes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('crear paciente con datos completos y verificar ficha', async ({ page }) => {
    await page.goto('/dashboard/patients/new');
    await expect(page.getByRole('heading', { name: /nuevo paciente/i })).toBeVisible();

    // ── Datos personales ──────────────────────────────────────────────────────
    await page.getByLabel('Nombre completo').fill(PACIENTE.name);
    await page.getByLabel('Email').fill(PACIENTE.email);

    // Fecha de nacimiento (input date nativo)
    await page.locator('input[name="date_of_birth"]').fill('1990-05-15');

    // Sexo
    await page.locator('select[name="sex"]').selectOption(PACIENTE.sex);

    // ── Datos antropométricos ─────────────────────────────────────────────────
    await page.locator('input[name="weight_kg"]').fill(PACIENTE.weight);
    await page.locator('input[name="height_cm"]').fill(PACIENTE.height);
    await page.locator('select[name="activity_level"]').selectOption(PACIENTE.activity);
    await page.locator('select[name="goal"]').selectOption(PACIENTE.goal);

    // ── Restricciones dietéticas ──────────────────────────────────────────────
    await page.locator('input[value="Sin gluten (celiaquía)"]').check();
    await page.locator('input[value="Sin lactosa"]').check();

    // ── Notas clínicas ────────────────────────────────────────────────────────
    await page.locator('textarea[name="preferences"]').fill(PACIENTE.preferences);
    await page.locator('textarea[name="medical_notes"]').fill(PACIENTE.medicalNotes);

    // Guardar
    await page.getByRole('button', { name: 'Crear paciente' }).click();

    // ── Verificar ficha ───────────────────────────────────────────────────────
    // Debe redirigir a /dashboard/patients/[id]
    await expect(page).toHaveURL(/\/dashboard\/patients\/[a-z0-9-]+$/, { timeout: 15_000 });

    // Nombre visible en el h1
    await expect(page.getByRole('heading', { name: PACIENTE.name })).toBeVisible();

    // Datos personales
    await expect(page.getByText('35 años').or(page.getByText('34 años'))).toBeVisible();
    await expect(page.getByText(`${PACIENTE.weight} kg`)).toBeVisible();
    await expect(page.getByText(`${PACIENTE.height} cm`)).toBeVisible();

    // TMB y TDEE calculados (deben ser > 0)
    const tmbText = await page.getByText(/\d+ kcal/).first().innerText();
    expect(parseInt(tmbText)).toBeGreaterThan(1000);

    // Restricciones dietéticas
    await expect(page.getByText('Sin gluten (celiaquía)')).toBeVisible();
    await expect(page.getByText('Sin lactosa')).toBeVisible();

    // Preferencias y notas médicas
    await expect(page.getByText(PACIENTE.preferences)).toBeVisible();
    await expect(page.getByText(PACIENTE.medicalNotes)).toBeVisible();

    // Botón de generar plan presente (puede aparecer en header y en empty-state)
    await expect(page.getByRole('button', { name: '+ Generar plan' }).first()).toBeVisible();
  });

  test('paciente creado aparece en el dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // La lista de pacientes debe contener el nombre
    await expect(page.getByRole('link', { name: PACIENTE.name }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('paciente creado aparece en el selector de la agenda', async ({ page }) => {
    await page.goto('/dashboard/agenda');
    const selector = page.locator('select[name="patient_id"]');
    await expect(selector).toBeVisible();
    const options = await selector.locator('option').allInnerTexts();
    expect(options.some((o) => o.includes('Paciente E2E'))).toBeTruthy();
  });

  test('link del cuestionario intake se puede copiar', async ({ page }) => {
    // Navegar a la ficha del paciente (buscar desde dashboard)
    await page.goto('/dashboard');
    await page.getByRole('link', { name: PACIENTE.name }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/patients\//);

    // Sección del cuestionario
    await expect(page.getByText('Cuestionario de salud')).toBeVisible();

    // El botón "Copiar" debe estar visible junto al link del intake
    const copyBtn = page.getByRole('button', { name: /copiar/i });
    await expect(copyBtn).toBeVisible();

    // Click en copiar → debe mostrar "Copiado"
    await copyBtn.click();
    await expect(page.getByText(/copiado/i)).toBeVisible({ timeout: 3_000 });
  });
});
