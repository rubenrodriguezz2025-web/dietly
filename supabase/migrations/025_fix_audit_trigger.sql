-- 025_fix_audit_trigger.sql
-- Corrección de la función fn_audit_log() y sus triggers.
--
-- Por qué existe esta migración:
--   La migración 020 intentaba crear el trigger trg_audit_patient_consents
--   sobre la tabla patient_consents. Si dicha tabla no existía en ese momento
--   (porque la migración 017 no se había aplicado en algunos entornos), la
--   creación del trigger fallaba y podía dejar fn_audit_log() en un estado
--   incorrecto o no registrado.
--
--   Esta migración re-aplica fn_audit_log() con CREATE OR REPLACE FUNCTION
--   (idempotente) y recrea los 4 triggers de auditoría de forma idempotente.

-- ─────────────────────────────────────────────────────────────────────────────
--  1. FUNCIÓN fn_audit_log() — versión canónica
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
--  2. TRIGGERS — idempotentes (DROP IF EXISTS + CREATE)
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

-- patient_consents (ahora la tabla sí existe)
DROP TRIGGER IF EXISTS trg_audit_patient_consents ON patient_consents;
CREATE TRIGGER trg_audit_patient_consents
  AFTER INSERT OR UPDATE OR DELETE ON patient_consents
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- intake_forms
DROP TRIGGER IF EXISTS trg_audit_intake_forms ON intake_forms;
CREATE TRIGGER trg_audit_intake_forms
  AFTER INSERT OR UPDATE OR DELETE ON intake_forms
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
