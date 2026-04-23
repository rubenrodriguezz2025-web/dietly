-- Intake mejorado: objetivo de consulta, motivación y archivos adjuntos
-- Feedback de Esther Carazo: más profundidad en el intake para primera consulta.

-- 1. Añadir columnas a intake_forms
ALTER TABLE intake_forms
  ADD COLUMN IF NOT EXISTS consultation_goal text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS why_now text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attached_files text[] DEFAULT NULL;

COMMENT ON COLUMN intake_forms.consultation_goal IS
  'Objetivo de consulta del paciente (texto libre amplio)';
COMMENT ON COLUMN intake_forms.why_now IS
  'Por qué busca ayuda nutricional en este momento';
COMMENT ON COLUMN intake_forms.attached_files IS
  'URLs de archivos subidos (analíticas, informes médicos)';

-- 2. Bucket privado para archivos de intake
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intake-files',
  'intake-files',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS del bucket — carpeta = nutritionist_id del paciente
-- Estructura esperada: intake-files/<nutritionist_id>/<patient_id>/<filename>

-- El nutricionista puede ver los archivos de intake de sus pacientes
CREATE POLICY "Nutritionists can view intake files of their patients"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'intake-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- El nutricionista puede eliminar archivos de intake de sus pacientes
CREATE POLICY "Nutritionists can delete intake files of their patients"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'intake-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role puede leer/escribir todo (API route usa admin client)
CREATE POLICY "Service role can manage all intake files"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'intake-files')
  WITH CHECK (bucket_id = 'intake-files');
