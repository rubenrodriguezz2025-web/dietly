-- ============================================================
-- Retención de audit_logs a 5 años (RGPD Art. 5.1.e — limitación del plazo
-- de conservación). Tras el plazo, los registros de auditoría deben borrarse.
--
-- Esta migración añade una función SQL que elimina registros con más de
-- 5 años. Se invoca manualmente desde Supabase Studio (o se puede programar
-- con pg_cron cuando se habilite la extensión en producción).
--
-- Uso: select cleanup_old_audit_logs();
-- ============================================================

create or replace function cleanup_old_audit_logs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from audit_logs
  where created_at < now() - interval '5 years';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function cleanup_old_audit_logs is
  'Elimina audit_logs con más de 5 años (RGPD Art. 5.1.e). Devuelve el número de filas borradas. Ejecutar manualmente cada trimestre desde Supabase Studio.';

-- Restringir la ejecución al rol service_role (nadie desde el cliente)
revoke execute on function cleanup_old_audit_logs() from public;
revoke execute on function cleanup_old_audit_logs() from authenticated;
revoke execute on function cleanup_old_audit_logs() from anon;
