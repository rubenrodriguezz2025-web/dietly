-- 021_rls_hardening.sql
-- Auditoría y refuerzo de políticas RLS en todas las tablas con datos de pacientes.
--
-- Problemas corregidos:
--   1. nutrition_plans — "Paciente ve su plan por token" usaba USING (true) → cualquiera
--      con un plan UUID podía leerlo. Se elimina y se sustituye por una función
--      SECURITY DEFINER que valida el token explícitamente.
--   2. profiles — faltaba política DELETE.
--   3. intake_forms — solo tenía SELECT para el nutricionista; se añaden INSERT/UPDATE/DELETE.
--   4. followup_forms / followup_reminders — creación y RLS completo si no existen.
--   5. plan_generations — se añade DELETE para simetría.
--   6. Views — se fuerza security_invoker = true para heredar el contexto del llamador.

-- ─────────────────────────────────────────────────────────────────────────────
--  1. nutrition_plans — eliminar política insegura, añadir RPC token-based
-- ─────────────────────────────────────────────────────────────────────────────

-- Eliminar la política que daba acceso global (USING (true)) a nutrition_plans.
-- Esta política permitía que cualquier usuario autenticado leyera cualquier plan
-- si conocía su UUID. Sustituida por la función get_plan_by_patient_token().
DROP POLICY IF EXISTS "Paciente ve su plan por token" ON nutrition_plans;

-- Función SECURITY DEFINER para que la PWA del paciente lea su plan por token.
-- Al usar SECURITY DEFINER ejecuta como el propietario de la función (postgres),
-- que tiene acceso completo, pero SOLO devuelve la fila que coincide con el token.
-- El token es un UUID único generado al crear el plan → imposible de adivinar.
--
-- Uso desde la PWA del paciente (sin sesión autenticada):
--   const { data } = await supabase.rpc('get_plan_by_patient_token', { p_token: token })
CREATE OR REPLACE FUNCTION get_plan_by_patient_token(p_token uuid)
RETURNS SETOF nutrition_plans
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM   nutrition_plans
  WHERE  patient_token = p_token
    AND  status IN ('approved', 'sent')   -- el paciente solo ve planes aprobados
  LIMIT  1;
$$;

-- Revocar acceso público a la función — solo llamable por el rol anon y authenticated
REVOKE ALL ON FUNCTION get_plan_by_patient_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_plan_by_patient_token(uuid) TO anon, authenticated;

COMMENT ON FUNCTION get_plan_by_patient_token IS
  'PWA del paciente: devuelve un plan aprobado por su patient_token UUID. '
  'SECURITY DEFINER — bypass RLS controlado. Solo expone planes con status=approved|sent.';

-- ─────────────────────────────────────────────────────────────────────────────
--  2. profiles — añadir política DELETE (faltaba)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Nutricionista borra su propio perfil" ON profiles;
CREATE POLICY "Nutricionista borra su propio perfil"
  ON profiles FOR DELETE
  USING ((SELECT auth.uid()) = id);

-- Refuerzo: sustituir las políticas existentes por la forma optimizada con SELECT
-- (evita re-evaluación de auth.uid() por fila)
DROP POLICY IF EXISTS "Nutricionista ve su propio perfil"         ON profiles;
DROP POLICY IF EXISTS "Nutricionista crea su propio perfil"       ON profiles;
DROP POLICY IF EXISTS "Nutricionista actualiza su propio perfil"  ON profiles;

CREATE POLICY "Nutricionista ve su propio perfil"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Nutricionista crea su propio perfil"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Nutricionista actualiza su propio perfil"
  ON profiles FOR UPDATE
  USING      ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ─────────────────────────────────────────────────────────────────────────────
--  3. patients — refuerzo con SELECT en auth.uid() (optimización de rendimiento)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Nutricionista ve sus pacientes"      ON patients;
DROP POLICY IF EXISTS "Nutricionista crea pacientes"        ON patients;
DROP POLICY IF EXISTS "Nutricionista actualiza sus pacientes" ON patients;
DROP POLICY IF EXISTS "Nutricionista borra sus pacientes"   ON patients;

CREATE POLICY "Nutricionista ve sus pacientes"
  ON patients FOR SELECT
  USING ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista crea pacientes"
  ON patients FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista actualiza sus pacientes"
  ON patients FOR UPDATE
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista borra sus pacientes"
  ON patients FOR DELETE
  USING ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  4. nutrition_plans — refuerzo (SELECT ya arreglado arriba)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Nutricionista ve sus planes"      ON nutrition_plans;
DROP POLICY IF EXISTS "Nutricionista crea planes"        ON nutrition_plans;
DROP POLICY IF EXISTS "Nutricionista actualiza sus planes" ON nutrition_plans;
DROP POLICY IF EXISTS "Nutricionista borra sus planes"   ON nutrition_plans;

CREATE POLICY "Nutricionista ve sus planes"
  ON nutrition_plans FOR SELECT
  USING ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista crea planes"
  ON nutrition_plans FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista actualiza sus planes"
  ON nutrition_plans FOR UPDATE
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista borra sus planes"
  ON nutrition_plans FOR DELETE
  USING ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  5. plan_generations — añadir DELETE (faltaba)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Nutricionista ve sus generaciones"     ON plan_generations;
DROP POLICY IF EXISTS "Nutricionista crea generaciones"       ON plan_generations;
DROP POLICY IF EXISTS "Nutricionista actualiza sus generaciones" ON plan_generations;
DROP POLICY IF EXISTS "Nutricionista borra sus generaciones"  ON plan_generations;

CREATE POLICY "Nutricionista ve sus generaciones"
  ON plan_generations FOR SELECT
  USING ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista crea generaciones"
  ON plan_generations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista actualiza sus generaciones"
  ON plan_generations FOR UPDATE
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista borra sus generaciones"
  ON plan_generations FOR DELETE
  USING ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  6. intake_forms — políticas completas (antes solo había SELECT)
-- ─────────────────────────────────────────────────────────────────────────────

-- Eliminar política existente (usaba EXISTS subquery costosa)
DROP POLICY IF EXISTS "Nutricionistas leen intake forms de sus pacientes" ON intake_forms;
DROP POLICY IF EXISTS "Nutricionista ve intake forms de sus pacientes"     ON intake_forms;
DROP POLICY IF EXISTS "nutritionist_read_own_intake_forms"                 ON intake_forms;

-- Asegurar que la columna nutritionist_id existe (puede haberse añadido tarde)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
    AND    table_name   = 'intake_forms'
    AND    column_name  = 'nutritionist_id'
  ) THEN
    ALTER TABLE intake_forms ADD COLUMN nutritionist_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- RLS completo para intake_forms
CREATE POLICY "Nutricionista ve sus intake forms"
  ON intake_forms FOR SELECT
  USING ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista crea intake forms"
  ON intake_forms FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista actualiza sus intake forms"
  ON intake_forms FOR UPDATE
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

CREATE POLICY "Nutricionista borra sus intake forms"
  ON intake_forms FOR DELETE
  USING ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  7. followup_forms — crear si no existe + RLS completo
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS followup_forms (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid        NOT NULL REFERENCES patients(id)    ON DELETE CASCADE,
  nutritionist_id  uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz,
  answers          jsonb
);

ALTER TABLE followup_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gestiona sus followup forms" ON followup_forms;
DROP POLICY IF EXISTS "nutritionist_own_followup_forms"           ON followup_forms;

CREATE POLICY "Nutricionista gestiona sus followup forms"
  ON followup_forms FOR ALL
  TO authenticated
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  8. followup_reminders — crear si no existe + RLS completo
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS followup_reminders (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid        NOT NULL REFERENCES patients(id)   ON DELETE CASCADE,
  nutritionist_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at        timestamptz NOT NULL,
  status           text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE followup_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricionista gestiona sus recordatorios" ON followup_reminders;
DROP POLICY IF EXISTS "nutritionist_own_followup_reminders"      ON followup_reminders;

CREATE POLICY "Nutricionista gestiona sus recordatorios"
  ON followup_reminders FOR ALL
  TO authenticated
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  9. patient_progress — refuerzo con WITH CHECK explícito
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "nutritionist_own_progress_all" ON patient_progress;

CREATE POLICY "nutritionist_own_progress_all"
  ON patient_progress FOR ALL
  TO authenticated
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  10. appointments — refuerzo con WITH CHECK explícito
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Nutricionistas gestionan sus citas" ON appointments;

CREATE POLICY "Nutricionistas gestionan sus citas"
  ON appointments FOR ALL
  TO authenticated
  USING      ((SELECT auth.uid()) = nutritionist_id)
  WITH CHECK ((SELECT auth.uid()) = nutritionist_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  11. Verificar RLS habilitado en TODAS las tablas relevantes
--      (si ya estaba habilitado, estas instrucciones son no-ops)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_generations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_forms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_reminders  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
--  12. Views — forzar security_invoker = true
--      (las vistas heredan el contexto del llamador, no del propietario)
-- ─────────────────────────────────────────────────────────────────────────────

-- Aplicar security_invoker a cualquier vista existente en el schema public.
-- Si no hay vistas, este bloque es un no-op.
DO $$
DECLARE
  v record;
BEGIN
  FOR v IN
    SELECT viewname
    FROM   pg_views
    WHERE  schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER VIEW %I SET (security_invoker = true)',
      v.viewname
    );
  END LOOP;
END;
$$;
