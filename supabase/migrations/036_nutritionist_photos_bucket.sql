-- Crear bucket para fotos de perfil de nutricionistas
INSERT INTO storage.buckets (id, name, public)
VALUES ('nutritionist-photos', 'nutritionist-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: el nutricionista puede subir su propia foto (carpeta = su uid)
CREATE POLICY "Nutritionists can upload their own photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nutritionist-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: el nutricionista puede ver su propia foto
CREATE POLICY "Nutritionists can view their own photo"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'nutritionist-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: el nutricionista puede actualizar (upsert) su propia foto
CREATE POLICY "Nutritionists can update their own photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'nutritionist-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: el nutricionista puede eliminar su propia foto
CREATE POLICY "Nutritionists can delete their own photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'nutritionist-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permitir al service_role descargar fotos (para generación PDF server-side)
CREATE POLICY "Service role can read all photos"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'nutritionist-photos');
