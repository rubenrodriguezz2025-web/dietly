/**
 * agenda.spec.ts
 *
 * Flujo completo de la agenda de citas:
 *   1. Login → navegar a /dashboard/agenda
 *   2. Crear cita con date picker nativo, selector de hora y paciente
 *   3. Verificar que la cita aparece en el calendario
 *   4. Marcar la cita como completada (botón ✓)
 *   5. Verificar que el estado cambia a "Completada"
 *   6. Eliminar la cita (botón ✕ con confirm)
 *   7. Verificar que desaparece del calendario
 */
import { expect, test } from '@playwright/test';

import { PACIENTE, login } from './helpers';

/** Fecha del próximo lunes en formato YYYY-MM-DD */
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Mes en formato YYYY-MM para la URL */
function currentMonthParam(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const FECHA_CITA = nextMonday();
const HORA_CITA = '10:00';

test.describe('Agenda de citas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navegar al mes actual explícitamente para que las citas nuevas sean visibles
    await page.goto(`/dashboard/agenda?mes=${currentMonthParam()}`);
    await expect(page.getByRole('heading', { name: /agenda|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i })).toBeVisible();
  });

  test('crear cita presencial con paciente y verificar en calendario', async ({ page }) => {
    // ── Formulario nueva cita ─────────────────────────────────────────────────
    const form = page.locator('form').filter({ has: page.locator('input[name="date"]') });

    // Seleccionar paciente E2E (si existe)
    const patientSelect = form.locator('select[name="patient_id"]');
    const options = await patientSelect.locator('option').allInnerTexts();
    if (options.some((o) => o.includes('Paciente E2E'))) {
      await patientSelect.selectOption({ label: options.find((o) => o.includes('Paciente E2E'))! });
    }

    // Tipo: presencial (ya es el default)
    await form.locator('select[name="type"]').selectOption('presencial');

    // Fecha con input nativo
    await form.locator('input[name="date"]').fill(FECHA_CITA);

    // Hora con select
    await form.locator('select[name="time"]').selectOption(HORA_CITA);

    // Notas
    await form.locator('textarea[name="notes"]').fill('Revisión inicial E2E Playwright');

    // Guardar
    await form.getByRole('button', { name: 'Crear cita' }).click();

    // Mensaje de éxito
    await expect(page.getByText('Cita guardada correctamente')).toBeVisible({ timeout: 10_000 });

    // ── Verificar en el calendario ────────────────────────────────────────────
    // La cita debe aparecer con la hora
    await expect(page.getByText(HORA_CITA)).toBeVisible({ timeout: 10_000 });
    // Badge "presencial"
    await expect(page.getByText('presencial').first()).toBeVisible();
    // Notas
    await expect(page.getByText('Revisión inicial E2E Playwright')).toBeVisible();
  });

  test('marcar cita como completada cambia el estado', async ({ page }) => {
    // Buscar una cita programada (scheduled) y completarla
    const scheduledBadge = page.getByText('Programada').first();
    if (!(await scheduledBadge.isVisible({ timeout: 5_000 }))) {
      test.skip();
      return;
    }

    // Botón ✓ junto a esa cita
    const citaCard = page.locator('.rounded-xl').filter({ has: scheduledBadge });
    const completeBtn = citaCard.locator('button[title="Marcar como completada"]');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // El badge debe cambiar a "Completada"
    await expect(page.getByText('Completada').first()).toBeVisible({ timeout: 10_000 });
  });

  test('eliminar cita la elimina del calendario', async ({ page }) => {
    // Crear una cita específica para eliminar
    const form = page.locator('form').filter({ has: page.locator('input[name="date"]') });
    await form.locator('input[name="date"]').fill(FECHA_CITA);
    await form.locator('select[name="time"]').selectOption('11:00');
    await form.locator('textarea[name="notes"]').fill('Cita para eliminar E2E');
    await form.getByRole('button', { name: 'Crear cita' }).click();
    await expect(page.getByText('Cita guardada correctamente')).toBeVisible({ timeout: 10_000 });

    // Verificar que existe
    await expect(page.getByText('Cita para eliminar E2E')).toBeVisible();

    // Confirmar el diálogo y eliminar
    page.on('dialog', (dialog) => dialog.accept());
    const citaCard = page.locator('.rounded-xl').filter({ has: page.getByText('Cita para eliminar E2E') });
    const deleteBtn = citaCard.locator('button[title="Eliminar cita"]');
    await deleteBtn.click();

    // La cita debe desaparecer
    await expect(page.getByText('Cita para eliminar E2E')).not.toBeVisible({ timeout: 10_000 });
  });

  test('navegar al mes siguiente y al anterior funciona', async ({ page }) => {
    // Ir al siguiente mes
    await page.getByRole('link', { name: 'Siguiente →' }).click();

    const url = new URL(page.url());
    const mesSig = url.searchParams.get('mes');
    expect(mesSig).toBeTruthy();

    // Volver al mes anterior
    await page.getByRole('link', { name: '← Anterior' }).click();

    const urlAnt = new URL(page.url());
    const mesAnt = urlAnt.searchParams.get('mes');
    expect(mesAnt).toBeTruthy();
    expect(mesAnt).not.toBe(mesSig);
  });

  test('crear cita online aparece con badge correcto', async ({ page }) => {
    const form = page.locator('form').filter({ has: page.locator('input[name="date"]') });
    await form.locator('select[name="type"]').selectOption('online');
    await form.locator('input[name="date"]').fill(FECHA_CITA);
    await form.locator('select[name="time"]').selectOption('15:30');
    await form.getByRole('button', { name: 'Crear cita' }).click();

    await expect(page.getByText('Cita guardada correctamente')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('online').first()).toBeVisible();
  });
});
