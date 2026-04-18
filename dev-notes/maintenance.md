# Mantenimiento — Dietly

Tareas periódicas que no están automatizadas. Ejecutar desde Supabase Studio (SQL Editor) salvo que se indique lo contrario.

---

## Retención de `audit_logs` (5 años · RGPD Art. 5.1.e)

Los registros de auditoría deben conservarse 5 años y borrarse después por el principio de limitación del plazo de conservación.

**Función**: `cleanup_old_audit_logs()` (migración `20260418202113_audit_logs_retention.sql`)

**Cómo ejecutar** (trimestral):

```sql
select cleanup_old_audit_logs();
```

Devuelve el número de filas borradas.

**Cuándo automatizar**: cuando se habilite `pg_cron` en producción, crear un job trimestral:

```sql
select cron.schedule(
  'cleanup-audit-logs-quarterly',
  '0 3 1 */3 *', -- 03:00 UTC, primer día de cada trimestre
  $$select cleanup_old_audit_logs()$$
);
```

Hasta entonces, ejecutar manualmente cada trimestre y anotar la fecha en el historial de abajo.

### Historial de ejecuciones

| Fecha | Filas borradas | Ejecutado por |
|-------|----------------|---------------|
| —     | —              | —             |
