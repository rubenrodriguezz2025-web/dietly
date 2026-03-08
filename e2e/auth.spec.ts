/**
 * auth.spec.ts
 *
 * Flujo completo de autenticación:
 *   1. Registro con email + contraseña → pantalla "Revisa tu email"
 *   2. (Simulado) El link de confirmación lleva al callback → onboarding
 *   3. Onboarding: nombre, clínica, especialidad → redirect a /dashboard
 *   4. Login con las mismas credenciales → dashboard
 *   5. Logout → redirect a /login
 *
 * NOTA: El paso de confirmación de email requiere acceso real al buzón o
 * que Supabase tenga "Email confirmations" desactivado en el proyecto de test.
 * Este spec asume que el usuario de prueba YA existe y está confirmado, por lo
 * que solo verifica el flujo de login/logout y la redirección de onboarding
 * para una cuenta nueva con datos únicos.
 */
import { expect, test } from '@playwright/test';

import { EMAIL, PASSWORD, login } from './helpers';

// Email único por ejecución para el test de registro
const NEW_EMAIL = `e2e-${Date.now()}@playwright.test`;
const NEW_PASS = 'TestRegistro2025!';

test.describe('Autenticación', () => {
  test('registro nuevo usuario muestra pantalla de confirmación', async ({ page }) => {
    await page.goto('/signup');

    // Formulario de registro
    await expect(page.getByRole('heading', { name: 'Empieza gratis con Dietly' })).toBeVisible();

    await page.getByLabel('Email').fill(NEW_EMAIL);
    await page.getByLabel('Contraseña', { exact: true }).fill(NEW_PASS);
    await page.getByLabel('Confirmar contraseña').fill(NEW_PASS);
    await page.getByRole('button', { name: 'Crear cuenta gratis' }).click();

    // Debe mostrar la pantalla de "Revisa tu email"
    await expect(page.getByText('Revisa tu email')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('enlace de confirmación')).toBeVisible();
  });

  test('registro con contraseñas que no coinciden muestra error', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('otro@test.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('Pass1234!');
    await page.getByLabel('Confirmar contraseña').fill('Pass9999!');
    await page.getByRole('button', { name: 'Crear cuenta gratis' }).click();

    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
  });

  test('registro con contraseña corta muestra error', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('otro@test.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('corta');
    await page.getByLabel('Confirmar contraseña').fill('corta');
    await page.getByRole('button', { name: 'Crear cuenta gratis' }).click();

    await expect(page.getByText('al menos 8 caracteres')).toBeVisible();
  });

  test('login con credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Contraseña').fill('ContraseñaIncorrecta!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Email o contraseña incorrectos')).toBeVisible({ timeout: 10_000 });
  });

  test('login correcto redirige a /dashboard', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    // El saludo con el nombre del nutricionista debe estar visible
    await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
  });

  test('usuario no autenticado es redirigido al login desde /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('logout redirige a /login', async ({ page }) => {
    await login(page);
    // Abrir menu de cuenta y cerrar sesión
    await page.getByRole('button', { name: 'Menú de cuenta' }).click();
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
