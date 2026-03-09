-- 009_onboarding.sql
-- Añade onboarding_completed_at a profiles para saber cuándo el nutricionista
-- completó el checklist de inicio (4 pasos: cuenta, logo, paciente, plan).
-- NULL = todavía no completado → mostrar checklist en el dashboard.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN profiles.onboarding_completed_at IS
  'Momento en que el nutricionista completó el checklist de onboarding. NULL = pendiente.';
