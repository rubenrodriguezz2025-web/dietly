-- Añade stripe_price_id a profiles — fuente única de verdad para distinguir Básico vs Pro.
--
-- Contexto: las tablas products/prices/subscriptions del boilerplate Stripe nunca se
-- aplicaron al proyecto real. Dietly usa profiles.subscription_status como SoT y ahora
-- también profiles.stripe_price_id, escritos desde el webhook de Stripe en cada evento
-- customer.subscription.*. El tier (Básico/Pro) se deriva comparando con las env vars
-- STRIPE_PRICE_BASICO_ID / STRIPE_PRICE_PRO_ID.
--
-- Sin backfill: usuarios existentes quedan en NULL y se repueblan en el próximo
-- evento webhook. Si hiciera falta rellenar a mano, ejecutar script puntual.

ALTER TABLE profiles ADD COLUMN stripe_price_id text;

COMMENT ON COLUMN profiles.stripe_price_id IS
  'Price ID de Stripe del item activo en la suscripción. Escrito por el webhook en customer.subscription.*. Se compara con STRIPE_PRICE_PRO_ID para derivar isPro.';
