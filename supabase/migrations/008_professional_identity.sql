-- ============================================================
-- Identidad profesional: número de colegiado + firma digital
-- Auditoría de aprobación: approved_at + approved_by
-- ============================================================

-- Columnas en profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS college_number text,
  ADD COLUMN IF NOT EXISTS signature_url  text;

-- Columnas de auditoría en nutrition_plans
ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS approved_at  timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by  uuid references auth.users(id);

-- Bucket privado para firmas (PNG transparente, max 256 KB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nutritionist-signatures',
  'nutritionist-signatures',
  false,
  262144,
  ARRAY['image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS firma: cada nutricionista gestiona solo la suya
-- Ruta convención: {user_id}/signature.{ext}

CREATE POLICY "signatures_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'nutritionist-signatures'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "signatures_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nutritionist-signatures'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "signatures_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'nutritionist-signatures'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "signatures_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'nutritionist-signatures'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
