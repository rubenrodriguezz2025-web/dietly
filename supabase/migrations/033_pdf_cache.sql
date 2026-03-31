-- 033: Columna pdf_generated_at para caché de PDFs generados
-- Si pdf_generated_at >= updated_at, el PDF cacheado en Storage sigue siendo válido.

ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS pdf_generated_at timestamptz;
