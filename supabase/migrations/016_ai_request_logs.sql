-- 016_ai_request_logs.sql
-- Log de auditoría de peticiones a la API de IA (Anthropic).
--
-- Política de acceso (append-only para el nutricionista):
--   SELECT  → el nutricionista puede leer sus propios registros
--   INSERT  → solo service_role (servidor) — no hay policy para 'authenticated'
--   UPDATE  → nadie desde el cliente — sin policy
--   DELETE  → nadie desde el cliente — solo service_role para cumplimiento RGPD
--
-- Los prompts almacenados están pseudonimizados: no contienen nombre, email
-- ni IDs reales del paciente. El session_patient_id es un UUID efímero por sesión.

CREATE TABLE IF NOT EXISTS ai_request_logs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nutricionista que generó la petición (FK para auditoría y consultas propias)
  nutritionist_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- UUID de sesión pseudonimizado — NO es el ID real del paciente en la DB.
  -- Generado en cada petición por pseudonymizePatient().
  session_patient_id  uuid        NOT NULL,

  -- Plan al que pertenece la petición (puede ser NULL en recalculate_macros)
  plan_id             uuid        REFERENCES nutrition_plans(id) ON DELETE SET NULL,

  -- Metadatos del modelo
  model_version       text        NOT NULL,
  -- 'generate_day' | 'regenerate_day' | 'recalculate_macros' | 'shopping_list'
  request_type        text        NOT NULL,
  -- Número de día (1-7) solo para generate_day y regenerate_day
  day_number          int,

  -- Prompt completo enviado a la IA (ya pseudonimizado)
  prompt              text        NOT NULL,
  -- JSON del tool_use.input devuelto por la IA (datos de comidas, sin PII)
  response_summary    text,

  -- Métricas de uso y coste
  tokens_input        int         NOT NULL DEFAULT 0,
  tokens_output       int         NOT NULL DEFAULT 0,
  cost_usd            numeric(10,6),

  -- Timestamp inmutable de la petición
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- El nutricionista puede consultar sus propios registros (auditoría)
CREATE POLICY "nutritionist_select_own_ai_logs"
  ON ai_request_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = nutritionist_id);

-- Sin policy de INSERT para 'authenticated':
--   solo el service_role (supabaseAdminClient) puede insertar registros.
--   Esto garantiza que los logs solo se escriben desde el servidor.

-- Sin policy de DELETE/UPDATE para 'authenticated':
--   append-only desde la perspectiva del nutricionista.
--   Para borrado por derecho al olvido (RGPD Art. 17), usar un endpoint
--   administrativo que llame a supabaseAdminClient con service_role.

-- ── Índices ────────────────────────────────────────────────────────────────────

-- Consultas habituales: "mis últimos logs" y "logs de este plan"
CREATE INDEX IF NOT EXISTS idx_ai_logs_nutritionist_date
  ON ai_request_logs (nutritionist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_logs_plan
  ON ai_request_logs (plan_id)
  WHERE plan_id IS NOT NULL;
