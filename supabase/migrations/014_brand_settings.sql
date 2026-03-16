-- Migración 014: configuración de marca del nutricionista
-- Añade columnas para personalizar el aspecto del PDF y contenido visible al paciente

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_macros boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_shopping_list boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS font_preference text DEFAULT 'clasica',
  ADD COLUMN IF NOT EXISTS profile_photo_url text;
