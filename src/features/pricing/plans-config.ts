// Configuración estática de los planes Dietly.
// Fuente de verdad para la sección de precios, el PaywallModal y cualquier
// lógica que necesite mostrar o enlazar los planes comerciales.
//
// Los `stripe_price_id` provienen de variables de entorno para que los IDs
// reales de Stripe LIVE no vivan en el repo.

export type DietlyPlanId = 'basico' | 'pro';

export interface DietlyPlan {
  id: DietlyPlanId;
  name: string;
  price: number;
  currency: 'EUR';
  stripe_price_id: string | undefined;
  patient_limit: number | null; // null = ilimitado
  features: readonly string[];
  recommended: boolean;
}

export const DIETLY_PLANS: readonly DietlyPlan[] = [
  {
    id: 'basico',
    name: 'Básico',
    price: 46,
    currency: 'EUR',
    stripe_price_id: process.env.STRIPE_PRICE_BASICO_ID,
    patient_limit: 30,
    features: [
      'Hasta 30 pacientes activos',
      'Planes nutricionales con IA',
      'PDF profesional con tu marca',
      'PWA para el paciente',
      'Lista de la compra automática',
      'Soporte por email',
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: 89,
    currency: 'EUR',
    stripe_price_id: process.env.STRIPE_PRICE_PRO_ID,
    patient_limit: null,
    features: [
      'Pacientes ilimitados',
      'Todo lo del plan Básico',
      'Logo propio en el PDF',
      'Firma digital en el PDF',
      'Recetario personal',
      'Soporte prioritario',
    ],
    recommended: true,
  },
] as const;
