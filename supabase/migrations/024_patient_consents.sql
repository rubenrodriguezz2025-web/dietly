-- 024_patient_consents.sql
-- Crea la tabla patient_consents si no existe.
--
-- Por qué esta migración existe siendo la 024:
--   - La 023 ya está ocupada (023_ai_literacy.sql).
--   - La 017_patient_consents.sql original puede no haberse aplicado
--     en algunos entornos, causando el error:
--     "record 'new' has no field 'patient_id'" cuando el trigger
--     fn_audit_log() (creado en 020) intenta acceder a NEW.patient_id
--     sobre una tabla con schema distinto o inexistente.
--
-- Base legal: RGPD Art. 9(2)(a) — consentimiento explícito para datos de salud.
-- El nutricionista recaba el consentimiento del paciente y lo registra aquí.

-- ─────────────────────────────────────────────────────────────────────────────
--  1. TABLA
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_consents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id           uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- Quién registró el consentimiento (nutricionista responsable del paciente).
  -- Necesario para la política RLS sin hacer JOIN a patients en cada fila.
  nutritionist_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de consentimiento (extensible a futuros usos)
  consent_type         text        NOT NULL DEFAULT 'ai_processing',

  -- Marca temporal del otorgamiento
  granted_at           timestamptz NOT NULL DEFAULT now(),

  -- Revocación: NULL = consentimiento activo; fecha = revocado
  revoked_at           timestamptz,

  -- IP del navegador del nutricionista en el momento del registro (auditoría)
  ip_address           text,

  -- Versión del texto mostrado al registrar (trazabilidad de cambios legales)
  consent_text_version text        NOT NULL DEFAULT 'unknown',

  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  2. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;

-- Eliminar política anterior si existe (idempotente)
DROP POLICY IF EXISTS "nutritionist_manage_own_consents" ON patient_consents;

-- El nutricionista puede leer, insertar y actualizar (revocar) sus propios registros.
-- No puede borrar físicamente — la revocación usa revoked_at.
CREATE POLICY "nutritionist_manage_own_consents"
  ON patient_consents
  FOR ALL
  TO authenticated
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  3. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────

-- Consulta principal: "¿tiene este paciente un consentimiento activo?"
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_active
  ON patient_consents (patient_id, consent_type)
  WHERE revoked_at IS NULL;

-- Consulta por nutricionista (para listados de auditoría)
CREATE INDEX IF NOT EXISTS idx_patient_consents_nutritionist
  ON patient_consents (nutritionist_id, created_at DESC);
