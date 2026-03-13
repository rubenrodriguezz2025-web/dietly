-- 010_patient_progress.sql
-- Historial de mediciones antropométricas del paciente.
-- El nutricionista registra evolución de peso, grasa, músculo y cintura.

CREATE TABLE IF NOT EXISTS patient_progress (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id       uuid          REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  nutritionist_id  uuid          REFERENCES profiles(id) NOT NULL,
  recorded_at      date          NOT NULL DEFAULT CURRENT_DATE,
  weight_kg        numeric(5, 1),
  body_fat_pct     numeric(4, 1),
  muscle_mass_kg   numeric(5, 1),
  waist_cm         numeric(5, 1),
  notes            text,
  created_at       timestamptz   DEFAULT now()
);

-- Índices para consultas habituales
CREATE INDEX IF NOT EXISTS patient_progress_patient_id_idx
  ON patient_progress (patient_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS patient_progress_nutritionist_id_idx
  ON patient_progress (nutritionist_id);

-- RLS: solo el nutricionista propietario puede leer y escribir
ALTER TABLE patient_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutritionist_own_progress_all"
  ON patient_progress
  FOR ALL
  USING  ((select auth.uid()) = nutritionist_id)
  WITH CHECK ((select auth.uid()) = nutritionist_id);

COMMENT ON TABLE patient_progress IS
  'Mediciones antropométricas periódicas registradas por el nutricionista para cada paciente.';
