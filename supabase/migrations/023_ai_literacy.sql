-- 023_ai_literacy.sql
-- Registra cuándo el nutricionista reconoció las capacidades y limitaciones
-- de la IA durante el onboarding (Art. 22 LSSI + transparencia algorítmica).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_literacy_acknowledged_at timestamptz;
