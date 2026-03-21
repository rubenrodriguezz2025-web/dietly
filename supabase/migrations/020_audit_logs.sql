-- 020_audit_logs.sql
-- Registro de auditoría para cumplimiento RGPD Art. 30 y Ley 41/2002.
--
-- RGPD Art. 30 — Registro de actividades de tratamiento:
--   Quién accedió/modificó datos personales de salud, cuándo y desde dónde.
--
-- Ley 41/2002 (LOPS) Art. 17 — Historia clínica:
--   Retención mínima de 5 años desde el último acto asistencial.
--   Se implementa mediante la ausencia de políticas DELETE + comentario de retención.
--
-- Arquitectura de inmutabilidad:
--   - RLS sin política DELETE ni UPDATE para el rol 'authenticated'
--   - El service_role puede borrar solo por orden judicial o requerimiento AEPD
--   - Los triggers usan SECURITY INVOKER: auth.uid() funciona con PostgREST;
--     con service_role (admin client) user_id se obtiene del campo nutritionist_id
--   - Los errores de inserción en audit_logs nunca abortan la operación original

-- ─────────────────────────────────────────────────────────────────────────────
--  1. TABLA
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nutricionista que ejecutó la acción (NULL si fue via service_role sin usuario)
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tipo de acción
  action        text        NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete')),

  -- Tipo de recurso afectado
  resource_type text        NOT NULL CHECK (resource_type IN (
                              'patient', 'plan', 'clinical_data', 'consent'
                            )),

  -- ID del recurso afectado (paciente, plan, etc.)
  resource_id   uuid        NOT NULL,

  -- Detalles no sensibles del cambio (nombres de campos modificados, cambios de estado...)
  -- IMPORTANTE: NO almacenar datos de salud aquí (principio de minimización RGPD Art. 5)
  metadata      jsonb,

  -- Contexto de red (para auditoría de acceso)
  ip_address    text,
  user_agent    text,

  -- Timestamp inmutable
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS
  'Registro de auditoría RGPD Art. 30. Retención mínima 5 años (Ley 41/2002 Art. 17). '
  'Inmutable desde cliente: sin políticas UPDATE/DELETE para rol authenticated.';

-- ─────────────────────────────────────────────────────────────────────────────
--  2. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: el nutricionista solo puede insertar entradas con su propio user_id.
-- Los triggers de base de datos (SECURITY INVOKER) utilizan esta política.
CREATE POLICY "authenticated_insert_own_audit_logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- SELECT: el nutricionista consulta su propio historial de auditoría.
-- El admin (identificado por email) puede consultar todos los registros.
CREATE POLICY "select_own_or_admin_audit_logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT auth.jwt() ->> 'email') = 'rubenrodriguezz2025@gmail.com'
  );

-- Sin políticas UPDATE ni DELETE para 'authenticated':
--   append-only desde cualquier cliente autenticado.
--   El borrado (derecho al olvido RGPD Art. 17) solo es ejecutable por service_role
--   bajo petición documentada, no desde la aplicación.

-- ─────────────────────────────────────────────────────────────────────────────
--  3. FUNCIÓN DE TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER   -- hereda el rol del llamador: auth.uid() funciona con PostgREST
AS $$
DECLARE
  v_user_id     uuid;
  v_resource_id uuid;
  v_action      text;
  v_res_type    text;
  v_metadata    jsonb;
  v_ip          text;
  v_ua          text;
BEGIN
  -- ── Identificar usuario ────────────────────────────────────────────────────
  v_user_id := auth.uid();

  -- Si la operación viene via service_role (admin client), auth.uid() = NULL.
  -- Usamos nutritionist_id del propio registro como fallback.
  IF v_user_id IS NULL THEN
    BEGIN
      v_user_id := CASE TG_OP
        WHEN 'DELETE' THEN OLD.nutritionist_id
        ELSE NEW.nutritionist_id
      END;
    EXCEPTION WHEN undefined_column THEN
      v_user_id := NULL;
    END;
  END IF;

  -- ── Acción y recurso ───────────────────────────────────────────────────────
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'create'
    WHEN 'UPDATE' THEN 'update'
    WHEN 'DELETE' THEN 'delete'
  END;

  v_resource_id := CASE TG_OP
    WHEN 'DELETE' THEN OLD.id
    ELSE NEW.id
  END;

  v_res_type := CASE TG_TABLE_NAME
    WHEN 'patients'          THEN 'patient'
    WHEN 'nutrition_plans'   THEN 'plan'
    WHEN 'intake_forms'      THEN 'clinical_data'
    WHEN 'patient_consents'  THEN 'consent'
    ELSE 'patient'
  END;

  -- ── Metadata (sin datos de salud, solo metadatos no sensibles) ─────────────
  v_metadata := CASE TG_TABLE_NAME

    WHEN 'patients' THEN CASE TG_OP
      WHEN 'INSERT' THEN
        jsonb_build_object('name', NEW.name)
      WHEN 'UPDATE' THEN
        jsonb_strip_nulls(jsonb_build_object(
          'fields_updated', (
            SELECT jsonb_agg(col ORDER BY col)
            FROM unnest(ARRAY[
              CASE WHEN NEW.name              IS DISTINCT FROM OLD.name              THEN 'name'              END,
              CASE WHEN NEW.email             IS DISTINCT FROM OLD.email             THEN 'email'             END,
              CASE WHEN NEW.weight_kg         IS DISTINCT FROM OLD.weight_kg         THEN 'weight_kg'         END,
              CASE WHEN NEW.height_cm         IS DISTINCT FROM OLD.height_cm         THEN 'height_cm'         END,
              CASE WHEN NEW.activity_level    IS DISTINCT FROM OLD.activity_level    THEN 'activity_level'    END,
              CASE WHEN NEW.goal              IS DISTINCT FROM OLD.goal              THEN 'goal'              END,
              CASE WHEN NEW.dietary_restrictions IS DISTINCT FROM OLD.dietary_restrictions THEN 'dietary_restrictions' END,
              CASE WHEN NEW.allergies         IS DISTINCT FROM OLD.allergies         THEN 'allergies'         END,
              CASE WHEN NEW.intolerances      IS DISTINCT FROM OLD.intolerances      THEN 'intolerances'      END,
              CASE WHEN NEW.preferences       IS DISTINCT FROM OLD.preferences       THEN 'preferences'       END,
              CASE WHEN NEW.medical_notes     IS DISTINCT FROM OLD.medical_notes     THEN 'medical_notes'     END
            ]) AS col
            WHERE col IS NOT NULL
          ),
          'name', NEW.name
        ))
      WHEN 'DELETE' THEN
        jsonb_build_object('name', OLD.name)
    END

    WHEN 'nutrition_plans' THEN CASE TG_OP
      WHEN 'INSERT' THEN
        jsonb_build_object(
          'patient_id', NEW.patient_id,
          'status',     NEW.status
        )
      WHEN 'UPDATE' THEN
        jsonb_strip_nulls(jsonb_build_object(
          'patient_id',   NEW.patient_id,
          'status_from',  CASE WHEN NEW.status IS DISTINCT FROM OLD.status THEN OLD.status END,
          'status_to',    CASE WHEN NEW.status IS DISTINCT FROM OLD.status THEN NEW.status END,
          'approved_at',  CASE WHEN NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN NEW.approved_at::text END
        ))
      WHEN 'DELETE' THEN
        jsonb_build_object('patient_id', OLD.patient_id, 'status', OLD.status)
    END

    WHEN 'patient_consents' THEN CASE TG_OP
      WHEN 'INSERT' THEN
        jsonb_build_object(
          'patient_id',            NEW.patient_id,
          'consent_type',          NEW.consent_type,
          'consent_text_version',  NEW.consent_text_version
        )
      WHEN 'UPDATE' THEN
        jsonb_build_object(
          'patient_id',   NEW.patient_id,
          'consent_type', NEW.consent_type,
          'revoked',      NEW.revoked_at IS NOT NULL,
          'revoked_at',   NEW.revoked_at::text
        )
      WHEN 'DELETE' THEN
        jsonb_build_object('patient_id', OLD.patient_id, 'consent_type', OLD.consent_type)
    END

    WHEN 'intake_forms' THEN CASE TG_OP
      WHEN 'INSERT' THEN
        jsonb_build_object('patient_id', NEW.patient_id)
      WHEN 'UPDATE' THEN
        jsonb_build_object(
          'patient_id',   NEW.patient_id,
          'completed',    NEW.completed_at IS NOT NULL,
          'completed_at', NEW.completed_at::text
        )
      WHEN 'DELETE' THEN
        jsonb_build_object('patient_id', OLD.patient_id)
    END

    ELSE jsonb_build_object('table', TG_TABLE_NAME)
  END;

  -- ── IP y User-Agent desde cabeceras PostgREST ──────────────────────────────
  -- Solo disponibles en contexto de peticiones HTTP via PostgREST.
  -- Con service_role o conexión directa, se captura NULL sin error.
  BEGIN
    v_ip := (current_setting('request.headers', true)::jsonb) ->> 'x-forwarded-for';
    v_ua := (current_setting('request.headers', true)::jsonb) ->> 'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_ua := NULL;
  END;

  -- ── Insertar en audit_logs — nunca falla la operación original ─────────────
  BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
    VALUES (v_user_id, v_action, v_res_type, v_resource_id, v_metadata, v_ip, v_ua);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[audit_logs] Error al insertar registro de auditoría (tabla=%, op=%): %',
      TG_TABLE_NAME, TG_OP, SQLERRM;
  END;

  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
--  4. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- patients
DROP TRIGGER IF EXISTS trg_audit_patients ON patients;
CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- nutrition_plans
DROP TRIGGER IF EXISTS trg_audit_nutrition_plans ON nutrition_plans;
CREATE TRIGGER trg_audit_nutrition_plans
  AFTER INSERT OR UPDATE OR DELETE ON nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- patient_consents (datos de consentimiento — categoría especial RGPD)
DROP TRIGGER IF EXISTS trg_audit_patient_consents ON patient_consents;
CREATE TRIGGER trg_audit_patient_consents
  AFTER INSERT OR UPDATE OR DELETE ON patient_consents
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- intake_forms (cuestionario clínico del paciente)
DROP TRIGGER IF EXISTS trg_audit_intake_forms ON intake_forms;
CREATE TRIGGER trg_audit_intake_forms
  AFTER INSERT OR UPDATE OR DELETE ON intake_forms
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ─────────────────────────────────────────────────────────────────────────────
--  5. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────

-- Consulta principal: "mis últimas N acciones" (panel de auditoría del nutricionista)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date
  ON audit_logs (user_id, created_at DESC);

-- Consulta: "quién accedió a este paciente/plan específico"
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs (resource_type, resource_id, created_at DESC);

-- Consulta admin: barrido temporal completo
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
--  6. FUNCIÓN HELPER: log_audit_read()
--
--  Los triggers solo capturan escrituras (INSERT/UPDATE/DELETE).
--  Para registrar lecturas (RGPD Art. 15 — acceso del interesado, auditorías
--  de acceso a historia clínica), llamar a esta función desde la aplicación:
--
--    SELECT log_audit_read('patient', '<patient_uuid>');
--    SELECT log_audit_read('plan', '<plan_uuid>');
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_audit_read(
  p_resource_type text,
  p_resource_id   uuid,
  p_metadata      jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ip text;
  v_ua text;
BEGIN
  BEGIN
    v_ip := (current_setting('request.headers', true)::jsonb) ->> 'x-forwarded-for';
    v_ua := (current_setting('request.headers', true)::jsonb) ->> 'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_ua := NULL;
  END;

  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
  VALUES (auth.uid(), 'read', p_resource_type, p_resource_id, p_metadata, v_ip, v_ua);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[audit_logs] log_audit_read failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION log_audit_read IS
  'Registra accesos de lectura en audit_logs. Llamar desde API routes cuando se '
  'consultan datos sensibles (ficha paciente, plan nutricional, historia clínica).';
