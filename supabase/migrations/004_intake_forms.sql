-- Migración 004: cuestionario de intake del paciente
-- Pegar en: Supabase Dashboard → SQL Editor → New query

-- 1. Añadir intake_token a patients (token público para el link del cuestionario)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS intake_token uuid DEFAULT gen_random_uuid();

-- Rellenar tokens para pacientes existentes que no tengan
UPDATE patients SET intake_token = gen_random_uuid() WHERE intake_token IS NULL;

-- Índice único para búsqueda pública por token
CREATE UNIQUE INDEX IF NOT EXISTS patients_intake_token_idx
  ON patients (intake_token);

-- 2. Tabla para respuestas del cuestionario
CREATE TABLE IF NOT EXISTS intake_forms (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  answers      jsonb       NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultar por paciente
CREATE INDEX IF NOT EXISTS intake_forms_patient_idx
  ON intake_forms (patient_id, completed_at DESC);

-- RLS: el nutricionista puede leer los intake forms de sus pacientes
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutricionistas leen intake forms de sus pacientes"
  ON intake_forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = intake_forms.patient_id
        AND (SELECT auth.uid()) = p.nutritionist_id
    )
  );

-- Insert público NO se cubre con RLS normal — la API route usa service_role
-- (supabaseAdminClient) para hacer el INSERT, que bypasea RLS.
