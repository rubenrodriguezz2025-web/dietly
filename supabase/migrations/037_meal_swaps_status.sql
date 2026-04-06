-- 037: Añadir status e initiated_by a meal_swaps
-- El paciente sugiere intercambios (pending) que el nutricionista aprueba/rechaza.
-- El nutricionista también puede intercambiar directamente (initiated_by='nutritionist', status='approved').

ALTER TABLE meal_swaps
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE meal_swaps
  ADD COLUMN IF NOT EXISTS initiated_by text NOT NULL DEFAULT 'patient'
    CHECK (initiated_by IN ('patient', 'nutritionist'));

-- Índice parcial para queries de pendientes (sidebar badge, tab filtro)
CREATE INDEX IF NOT EXISTS idx_meal_swaps_pending
  ON public.meal_swaps(nutritionist_id, status)
  WHERE status = 'pending';

-- Los swaps existentes (pre-migración) se marcan como aprobados
-- ya que el flujo anterior actualizaba plan_data directamente
UPDATE meal_swaps SET status = 'approved' WHERE status = 'pending';

COMMENT ON COLUMN meal_swaps.status IS 'pending = sugerencia del paciente | approved = aceptado por nutricionista | rejected = rechazado';
COMMENT ON COLUMN meal_swaps.initiated_by IS 'patient = desde PWA | nutritionist = desde dashboard';
