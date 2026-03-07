-- Migración 002: añade subscription_status a profiles
-- Permite acceso rápido al estado de suscripción sin JOIN a la tabla subscriptions

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status text
    DEFAULT 'none'
    CHECK (subscription_status IN (
      'none', 'trialing', 'active', 'canceled',
      'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused'
    ));

-- Índice para filtrar por estado (futuro gate de features)
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx
  ON profiles (subscription_status);

-- Comentario de documentación
COMMENT ON COLUMN profiles.subscription_status IS
  'Reflejo del estado de Stripe. Se actualiza via webhook /api/stripe/webhook. Valores: none | trialing | active | canceled | past_due | unpaid';
