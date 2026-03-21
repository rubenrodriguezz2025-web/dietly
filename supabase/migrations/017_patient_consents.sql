-- 017_patient_consents.sql
-- Registro de consentimientos de pacientes para tratamiento de datos con IA.
--
-- Base legal: RGPD Art. 9(2)(a) — consentimiento explícito para datos de salud.
-- El nutricionista recaba el consentimiento del paciente y lo registra aquí.
-- El borrado físico no está permitido desde el cliente (auditoría inmutable).
-- La revocación se gestiona con revoked_at (soft delete).

CREATE TABLE IF NOT EXISTS patient_consents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id           uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nutritionist_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de consentimiento (extensible a futuros usos)
  consent_type         text        NOT NULL DEFAULT 'ai_processing',

  -- Marca temporal del otorgamiento
  granted_at           timestamptz NOT NULL DEFAULT now(),

  -- Revocación: NULL = consentimiento activo; fecha = revocado
  revoked_at           timestamptz,

  -- IP del navegador del nutricionista en el momento del registro (auditoría)
  ip_address           text,

  -- Versión del texto mostrado al registrar (para trazabilidad de cambios legales)
  consent_text_version text        NOT NULL,

  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;

-- El nutricionista puede leer, insertar y actualizar (revocar) sus propios registros.
-- No puede borrar físicamente — la revocación usa revoked_at.
CREATE POLICY "nutritionist_manage_own_consents"
  ON patient_consents
  FOR ALL
  TO authenticated
  USING  ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- ── Índices ────────────────────────────────────────────────────────────────────

-- Consulta principal: "¿tiene este paciente un consentimiento activo?"
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_active
  ON patient_consents (patient_id, consent_type)
  WHERE revoked_at IS NULL;
