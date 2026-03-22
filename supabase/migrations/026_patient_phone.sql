-- Añadir campo de teléfono al perfil del paciente
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone text;
