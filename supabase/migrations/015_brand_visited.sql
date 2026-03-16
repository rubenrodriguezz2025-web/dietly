-- 015_brand_visited.sql
-- Registra la primera visita del nutricionista a la sección "Mi marca"

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS brand_settings_visited_at timestamptz;
