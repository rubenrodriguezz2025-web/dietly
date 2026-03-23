-- 030_dietary_restrictions_array.sql
-- Convierte dietary_restrictions de text a text[]
--
-- La columna fue creada como text (cadena separada por comas) pero el schema
-- definido en CLAUDE.md especifica text[] para facilitar consultas y tipado.
-- Se migran los datos existentes dividiéndolos por ', '.

ALTER TABLE patients
  ALTER COLUMN dietary_restrictions TYPE text[]
  USING CASE
    WHEN dietary_restrictions IS NULL OR dietary_restrictions = '' THEN NULL
    ELSE string_to_array(dietary_restrictions, ', ')
  END;
