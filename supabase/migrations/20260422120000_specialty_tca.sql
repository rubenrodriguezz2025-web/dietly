-- Añade 'tca' como valor válido del enum specialty_type
-- Motivo: feedback de nutricionistas TCA/psiconutrición sobre el listado de especialidades
ALTER TYPE specialty_type ADD VALUE IF NOT EXISTS 'tca';
