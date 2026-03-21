-- 018_data_rights_requests.sql
-- Solicitudes de ejercicio de derechos RGPD por parte de los pacientes.
--
-- Base legal: RGPD Arts. 15-22 (acceso, rectificación, supresión, limitación,
--   portabilidad, oposición). Plazo de respuesta: 30 días naturales (Art. 12.3).
--
-- El paciente envía la solicitud desde /derechos-datos (página pública).
-- El nutricionista la gestiona desde /dashboard/derechos-datos.

CREATE TABLE IF NOT EXISTS data_rights_requests (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- El paciente puede ser eliminado; se conserva el historial con SET NULL
  patient_id              uuid        REFERENCES patients(id) ON DELETE SET NULL,

  -- Nutricionista responsable del tratamiento (encargado → responsable)
  nutritionist_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de derecho ejercido
  request_type            text        NOT NULL CHECK (request_type IN (
                            'access', 'rectification', 'erasure',
                            'restriction', 'portability', 'objection'
                          )),

  -- Estado de la solicitud
  status                  text        NOT NULL DEFAULT 'pending' CHECK (status IN (
                            'pending', 'in_progress', 'completed', 'rejected'
                          )),

  -- Snapshot del paciente al momento de la solicitud (persiste si se borra)
  patient_name_snapshot   text,
  patient_email_snapshot  text,

  -- Notas adicionales del paciente
  notes                   text,

  -- Plazo legal de respuesta (30 días desde la recepción)
  response_due_at         timestamptz NOT NULL DEFAULT (now() + interval '30 days'),

  -- Cuándo se respondió efectivamente
  responded_at            timestamptz,

  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE data_rights_requests ENABLE ROW LEVEL SECURITY;

-- El nutricionista puede consultar sus propias solicitudes
CREATE POLICY "nutritionist_select_own_rights_requests"
  ON data_rights_requests
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = nutritionist_id);

-- El nutricionista puede actualizar el estado (pending → in_progress → completed)
CREATE POLICY "nutritionist_update_own_rights_requests"
  ON data_rights_requests
  FOR UPDATE
  TO authenticated
  USING  ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- Sin policy de INSERT para 'authenticated':
--   solo el service_role (supabaseAdminClient) puede crear solicitudes desde la API pública.
-- Sin policy de DELETE: el historial es inmutable desde el cliente.

-- ── Índices ────────────────────────────────────────────────────────────────────

-- Consulta más común: "mis solicitudes pendientes"
CREATE INDEX IF NOT EXISTS idx_data_rights_nutritionist_status
  ON data_rights_requests (nutritionist_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_rights_patient
  ON data_rights_requests (patient_id)
  WHERE patient_id IS NOT NULL;
