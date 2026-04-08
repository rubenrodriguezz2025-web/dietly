-- 038_progress_enhancements.sql
-- Mejoras en patient_progress para sistema de revisión mensual
-- + Fix: columna token faltante en followup_forms

-- ─────────────────────────────────────────────────────────────────────────────
--  1. Nuevas columnas en patient_progress
-- ─────────────────────────────────────────────────────────────────────────────

-- Cadera (cm) — perímetro de cadera, complementa cintura para ratio cintura/cadera
ALTER TABLE patient_progress
  ADD COLUMN IF NOT EXISTS hip_cm numeric;

-- Adherencia al plan (1-5): 1=muy baja, 2=baja, 3=regular, 4=buena, 5=excelente
ALTER TABLE patient_progress
  ADD COLUMN IF NOT EXISTS adherence_score integer;

ALTER TABLE patient_progress
  ADD CONSTRAINT adherence_score_range
    CHECK (adherence_score IS NULL OR (adherence_score >= 1 AND adherence_score <= 5));

-- Indica si se generó un nuevo plan en esta revisión (útil para tracking de cambios)
ALTER TABLE patient_progress
  ADD COLUMN IF NOT EXISTS new_plan_generated boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
--  2. Fix: columna token en followup_forms (bug — el código la usa pero nunca se creó)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE followup_forms
  ADD COLUMN IF NOT EXISTS token uuid DEFAULT gen_random_uuid();

-- Índice para lookup por token (ruta /p/seguimiento/[token])
CREATE INDEX IF NOT EXISTS idx_followup_forms_token ON followup_forms (token);
