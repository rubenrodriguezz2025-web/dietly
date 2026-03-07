-- Migración 003: tabla de citas (agenda del nutricionista)
-- Pegar en: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS appointments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid       NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id     uuid        REFERENCES patients(id) ON DELETE SET NULL,
  date           date        NOT NULL,
  time           time        NOT NULL,
  type           text        NOT NULL DEFAULT 'presencial'
                             CHECK (type IN ('presencial', 'online')),
  notes          text,
  status         text        NOT NULL DEFAULT 'scheduled'
                             CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultas frecuentes por nutricionista + mes
CREATE INDEX IF NOT EXISTS appointments_nutritionist_date_idx
  ON appointments (nutritionist_id, date);

-- RLS: cada nutricionista solo ve sus propias citas
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutricionistas gestionan sus citas"
  ON appointments FOR ALL
  USING ((SELECT auth.uid()) = nutritionist_id);

-- Actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_appointments_updated_at();
