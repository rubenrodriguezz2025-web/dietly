-- 022_plan_rate_limit.sql
-- Tabla de registro de intentos fallidos de acceso a planes de pacientes.
-- Usada para rate limiting en la ruta /plan/[planId] (máx. 10 intentos por IP en 15 min).

CREATE TABLE IF NOT EXISTS plan_access_attempts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text        NOT NULL,
  plan_id    text        NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índice para consultas eficientes de rate limiting (por IP + ventana temporal)
CREATE INDEX plan_access_attempts_ip_created_idx
  ON plan_access_attempts (ip_address, created_at DESC);

-- RLS activado: solo el service role puede leer/insertar (sin políticas de usuario)
ALTER TABLE plan_access_attempts ENABLE ROW LEVEL SECURITY;

-- Limpieza automática: eliminar intentos con más de 24 horas de antigüedad
-- (cron job recomendado; por ahora se limpia en cada consulta de rate limit)
-- La función de limpieza se puede llamar periódicamente:
CREATE OR REPLACE FUNCTION cleanup_old_access_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM plan_access_attempts
  WHERE created_at < now() - interval '24 hours';
$$;
