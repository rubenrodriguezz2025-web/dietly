-- Migración 039: Mover stripe_customer_id de tabla legacy 'customers' a 'profiles'
-- La tabla 'customers' del boilerplate next-supabase-stripe-starter nunca existió
-- en la BBDD real de Dietly. Este campo es necesario para el flujo de checkout/billing.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- Índice para búsqueda inversa (webhook busca userId por stripe_customer_id)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
