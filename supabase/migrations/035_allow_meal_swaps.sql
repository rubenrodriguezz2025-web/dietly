-- 035: Columna allow_meal_swaps en patients + swap_notification_sent_at en meal_swaps
-- Permite al nutricionista habilitar/deshabilitar intercambio de platos por paciente
-- y controlar rate limiting de notificaciones email por swap

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS allow_meal_swaps boolean NOT NULL DEFAULT true;

-- Para rate limiting de notificaciones email (1 por paciente cada 6h)
ALTER TABLE meal_swaps
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz DEFAULT null;

COMMENT ON COLUMN patients.allow_meal_swaps IS 'Permite al paciente intercambiar platos desde la PWA';
COMMENT ON COLUMN meal_swaps.notification_sent_at IS 'Timestamp del último email enviado al nutricionista por este swap';
