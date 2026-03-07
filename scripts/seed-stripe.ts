/**
 * Script para crear los productos y precios de Dietly en Stripe (modo TEST).
 *
 * USO:
 *   npx tsx scripts/seed-stripe.ts
 *
 * Requiere STRIPE_SECRET_KEY en .env.local (clave test sk_test_...).
 * Imprime los price IDs — añádelos a .env.local como:
 *   STRIPE_PRICE_BASICO_ID=price_...
 *   STRIPE_PRICE_PRO_ID=price_...
 */

import * as fs from 'fs';
import * as path from 'path';

import Stripe from 'stripe';

// Cargar .env.local manualmente si no está cargado
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, key, val] = match;
      process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
    }
  }
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('ERROR: STRIPE_SECRET_KEY no encontrada en .env.local');
  process.exit(1);
}

if (!secretKey.startsWith('sk_test_')) {
  console.error('ERROR: Usa una clave TEST (sk_test_...). No ejecutes en producción.');
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

async function seed() {
  console.log('Creando productos y precios en Stripe TEST...\n');

  // ── Plan Básico ─────────────────────────────────────────────────────────────
  const productoBasico = await stripe.products.create({
    name: 'Dietly Básico',
    description: 'Hasta 30 pacientes activos. Ideal para nutricionistas que empiezan.',
    metadata: {
      plan_tier: 'basic',
      max_patients: '30',
    },
  });

  const precioBasico = await stripe.prices.create({
    product: productoBasico.id,
    unit_amount: 4600, // 46,00 € en céntimos
    currency: 'eur',
    recurring: {
      interval: 'month',
      trial_period_days: 14,
    },
    nickname: 'Básico mensual — 46€/mes',
    metadata: {
      plan_tier: 'basic',
    },
  });

  // ── Plan Pro ─────────────────────────────────────────────────────────────────
  const productoPro = await stripe.products.create({
    name: 'Dietly Pro',
    description: 'Pacientes ilimitados + soporte prioritario. Para nutricionistas consolidados.',
    metadata: {
      plan_tier: 'pro',
      max_patients: 'unlimited',
    },
  });

  const precioPro = await stripe.prices.create({
    product: productoPro.id,
    unit_amount: 8900, // 89,00 € en céntimos
    currency: 'eur',
    recurring: {
      interval: 'month',
      trial_period_days: 14,
    },
    nickname: 'Pro mensual — 89€/mes',
    metadata: {
      plan_tier: 'pro',
    },
  });

  // ── Resultado ────────────────────────────────────────────────────────────────
  console.log('✅  Productos y precios creados correctamente.\n');
  console.log('Añade estas líneas a tu .env.local (y a las env vars de Vercel):\n');
  console.log(`STRIPE_PRICE_BASICO_ID=${precioBasico.id}`);
  console.log(`STRIPE_PRICE_PRO_ID=${precioPro.id}`);
  console.log(`\nProducto Básico: ${productoBasico.id}`);
  console.log(`Producto Pro:    ${productoPro.id}`);
  console.log('\nConfigura el webhook de Stripe apuntando a:');
  console.log('  https://TU_DOMINIO/api/stripe/webhook');
  console.log('\nEventos a escuchar:');
  console.log('  checkout.session.completed');
  console.log('  customer.subscription.created');
  console.log('  customer.subscription.updated');
  console.log('  customer.subscription.deleted');
  console.log('  product.created, product.updated');
  console.log('  price.created, price.updated');
}

seed().catch((err) => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});
