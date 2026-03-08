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

const FECHA_CITA = nextMonday();
const HORA_CITA = '10:00';
/** Mes de FECHA_CITA en formato YYYY-MM (puede ser el mes siguiente si nextMonday cruza mes) */
const MES_CITA = FECHA_CITA.substring(0, 7);
/** Mes siguiente a MES_CITA para verificar navegación */
const [_year, _month] = MES_CITA.split('-').map(Number);
const MES_SIGUIENTE =
  _month === 12
    ? `${_year + 1}-01`
    : `${_year}-${String(_month + 1).padStart(2, '0')}`;

test.describe('Agenda de citas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navegar al mes de la cita para que sea visible en el calendario
    await page.goto(`/dashboard/agenda?mes=${MES_CITA}`);
    await expect(page.getByRole('heading', { name: /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i })).toBeVisible();
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
    // Ir al siguiente mes — esperar la URL exacta del mes siguiente
    await page.getByRole('link', { name: 'Siguiente →' }).click();
    await page.waitForURL(new RegExp(`mes=${MES_SIGUIENTE}`), { timeout: 10_000 });

    const mesSig = new URL(page.url()).searchParams.get('mes');
    expect(mesSig).toBe(MES_SIGUIENTE);

    // Volver al mes anterior — el enlace "← Anterior" de la página del mes siguiente apunta a MES_CITA
    await page.getByRole('link', { name: '← Anterior' }).click();
    await page.waitForURL(new RegExp(`mes=${MES_CITA}`), { timeout: 10_000 });

    const mesAnt = new URL(page.url()).searchParams.get('mes');
    expect(mesAnt).toBe(MES_CITA);
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
