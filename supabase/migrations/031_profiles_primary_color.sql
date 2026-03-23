-- 031_profiles_primary_color.sql
-- Añade primary_color a la tabla profiles.
--
-- Esta columna faltaba en las migraciones previas aunque el código la usaba
-- (routes PDF, página de ajustes). Si la columna no existía, la query de perfil
-- fallaba silenciosamente devolviendo null, causando que el PDF mostrara
-- 'Nutricionista' en lugar del nombre real del profesional.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1a7a45';

COMMENT ON COLUMN profiles.primary_color IS
  'Color corporativo principal del nutricionista (hex). Se usa en encabezados y píldoras del PDF.';
