-- ============================================================
-- Añade logo_url a profiles y crea bucket de Storage para logos
-- El bucket es privado — RLS controla qué nutricionista accede
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- Bucket privado para logos de clínica (max 512 KB, solo imágenes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nutritionist-logos',
  'nutritionist-logos',
  false,
  524288,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: cada nutricionista solo puede gestionar su propio logo
-- Convención de ruta: {user_id}/logo.{ext}

CREATE POLICY "logos_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'nutritionist-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "logos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'nutritionist-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "logos_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'nutritionist-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "logos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'nutritionist-logos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
