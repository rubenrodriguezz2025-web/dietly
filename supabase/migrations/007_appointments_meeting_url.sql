-- ============================================================
-- Añade meeting_url a appointments para citas de videollamada
-- Se muestra en el dashboard y en el email de recordatorio
-- ============================================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_url text;
