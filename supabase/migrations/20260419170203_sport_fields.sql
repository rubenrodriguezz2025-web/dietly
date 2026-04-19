-- Campos específicos para pacientes de nutricionistas deportivos
-- Solo se rellenan desde el formulario cuando profile.specialty === 'sports'
ALTER TABLE patients
  ADD COLUMN sport_type text DEFAULT NULL,
  ADD COLUMN training_days_per_week integer DEFAULT NULL
    CHECK (training_days_per_week BETWEEN 1 AND 7),
  ADD COLUMN training_time text DEFAULT NULL
    CHECK (training_time IN ('morning', 'afternoon', 'evening')),
  ADD COLUMN training_schedule text DEFAULT NULL,
  ADD COLUMN supplementation text DEFAULT NULL;

COMMENT ON COLUMN patients.sport_type IS
  'Tipo de deporte: CrossFit, running, ciclismo, etc.';
COMMENT ON COLUMN patients.training_days_per_week IS
  'Días de entrenamiento por semana (1-7)';
COMMENT ON COLUMN patients.training_time IS
  'Horario habitual de entrenamiento';
COMMENT ON COLUMN patients.training_schedule IS
  'Detalle de horario: ej 7:00-8:30';
COMMENT ON COLUMN patients.supplementation IS
  'Suplementación actual: creatina, proteína, etc.';
