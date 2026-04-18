-- LEVE-8: Cambiar la FK appointments.patient_id de ON DELETE SET NULL a ON DELETE CASCADE.
-- Motivo: al eliminar un paciente (derecho de supresión RGPD), sus citas quedaban huérfanas
-- con patient_id NULL en el calendario del nutricionista. Con CASCADE se eliminan junto al
-- paciente, evitando datos residuales sin dueño.

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;
