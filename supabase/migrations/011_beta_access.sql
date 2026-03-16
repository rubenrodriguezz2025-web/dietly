-- 011_beta_access.sql
-- Lista blanca de emails para acceso beta por invitación

CREATE TABLE IF NOT EXISTS beta_whitelist (
  id      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email   text        UNIQUE NOT NULL,
  name    text,
  added_at timestamptz DEFAULT now(),
  notes   text
);

-- RLS activado: ningún usuario autenticado puede leer/escribir directamente.
-- Solo el service_role (supabaseAdminClient) bypasa RLS y tiene acceso completo.
ALTER TABLE beta_whitelist ENABLE ROW LEVEL SECURITY;

-- Sin policies para usuarios normales → acceso exclusivo via service_role
