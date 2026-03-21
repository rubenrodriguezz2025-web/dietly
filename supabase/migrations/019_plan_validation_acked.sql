-- 019_plan_validation_acked.sql
-- Añade columna para trackear qué alertas de bloqueo ha reconocido el nutricionista.
--
-- Cada código de bloqueo (e.g. 'cal_too_low', 'allergen_present') queda registrado
-- aquí cuando el D-N marca "He revisado esta alerta". El ApproveButton comprueba
-- que todos los bloques activos estén en este array antes de permitir la aprobación.

ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS validation_acked_blocks text[] NOT NULL DEFAULT '{}';
