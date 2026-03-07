-- ============================================================
-- Añade valores 'generating' y 'error' al enum plan_status_type
-- El route /api/plans/generate inserta con status='generating'
-- y actualiza a 'error' si falla — valores ausentes en la migración inicial
-- ============================================================

ALTER TYPE plan_status_type ADD VALUE IF NOT EXISTS 'generating';
ALTER TYPE plan_status_type ADD VALUE IF NOT EXISTS 'error';
