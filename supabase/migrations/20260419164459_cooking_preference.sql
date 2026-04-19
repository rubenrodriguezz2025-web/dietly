-- Preferencia de cocina del paciente a nivel de ficha.
-- Persiste entre generaciones de planes; el modal de generación la usa como default,
-- pero el nutricionista puede sobreescribirla puntualmente.
ALTER TABLE patients
  ADD COLUMN cooking_preference text
  CHECK (cooking_preference IN ('simple', 'medium', 'elaborate'))
  DEFAULT NULL;

COMMENT ON COLUMN patients.cooking_preference IS
  'Preferencia de cocina del paciente: simple (5-10 min), medium (15-20 min), elaborate (sin límite)';
