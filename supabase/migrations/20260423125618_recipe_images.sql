-- Imagen en recetas: feedback Esther Carazo.
-- Una receta con foto se percibe como más apetecible y mejora adherencia;
-- especialmente relevante en TCA (dimensión visual y sensorial).

-- 1. Columna image_url en recipes
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

COMMENT ON COLUMN recipes.image_url IS
  'Path en el bucket recipe-images ({nutritionist_id}/{recipe_id}.{ext})';

-- 2. Bucket privado para imágenes de recetas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS del bucket — carpeta = nutritionist_id
-- Estructura esperada: recipe-images/<nutritionist_id>/<recipe_id>.<ext>

CREATE POLICY "Nutritionists can view their own recipe images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Nutritionists can upload their own recipe images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Nutritionists can update their own recipe images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Nutritionists can delete their own recipe images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role puede leer todo (para server-side operations)
CREATE POLICY "Service role can read all recipe images"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'recipe-images');
