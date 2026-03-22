-- Registrar quién rellenó el cuestionario de intake
ALTER TABLE intake_forms
  ADD COLUMN IF NOT EXISTS filled_by text DEFAULT 'patient',
  ADD COLUMN IF NOT EXISTS filled_at timestamptz;
