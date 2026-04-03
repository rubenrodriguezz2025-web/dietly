# SECURITY_AUDIT.md — Dietly
> Fecha: 4 abril 2026 | Auditor: Claude Code (3 agentes paralelos) | Método: Análisis estático completo del codebase

---

## RESUMEN EJECUTIVO

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| CRITICAL | 3 | Requieren fix inmediato |
| HIGH | 6 | Requieren fix antes de escalar beta |
| MEDIUM | 11 | Planificar para próximo sprint |
| LOW | 6 | Deuda técnica menor |
| INFO | 14 | Sin acción requerida (positivos) |

**Veredicto: La aplicación tiene buenas bases de seguridad** (RLS en todas las tablas, HMAC tokens, pseudonymización PII, headers de seguridad, Stripe verificado). Sin embargo, hay 3 hallazgos críticos en autenticación y acceso a datos de pacientes que deben resolverse antes de escalar.

---

## HALLAZGOS CRÍTICOS (P0)

### C-01: `getSession()` no valida JWT en servidor — Stripe endpoints expuestos

**Archivo**: `src/features/account/controllers/get-session.ts:6`
**Afecta**: `/api/stripe/checkout`, `/api/stripe/portal`

`supabase.auth.getSession()` lee el JWT de la cookie **sin validarlo contra el servidor de Supabase**. Supabase documenta explícitamente: *"Do not trust getSession() for authorization on the server. Use getUser() instead."* Un atacante puede forjar el JWT cookie y crear sesiones de Stripe checkout en nombre de otros usuarios.

**Fix**: Reemplazar `getSession()` por `getUser()` en `get-session.ts`.

---

### C-02: `/p/[token]` — Acceso al plan del paciente sin verificación HMAC

**Archivo**: `src/app/p/[token]/page.tsx:217-223`

```typescript
if (hmac && expires) {
  const result = await validatePlanAccessToken(token, hmac, expires);
  if (!result.valid) { notFound(); }
}
```

La verificación HMAC **solo se ejecuta si los query params `hmac` y `expires` están presentes**. Sin ellos, cualquier persona que conozca o adivine el UUID `patient_token` accede al plan completo con datos de salud (RGPD Art. 9).

El middleware (`src/middleware.ts`) protege `/plan/[planId]` pero **NO** `/p/[token]` — la regex `^\/plan\/[^/]+$` no matchea.

**Fix**: Hacer HMAC obligatorio. Si faltan `hmac` o `expires`, devolver `notFound()`.

---

### C-03: Bypass de compatibilidad en `/p/intake/[token]` permite acceso sin autenticación

**Archivo**: `src/middleware.ts:169-172`

```typescript
// Compatibilidad hacia atrás: si no hay parámetros HMAC, permitir el acceso.
if (!token || !expires) {
  return NextResponse.next({ request });
}
```

Cualquier request a `/p/intake/[token]` sin params HMAC pasa sin verificación. El comentario dice "temporalmente" pero es una puerta trasera permanente a los formularios de intake de pacientes.

**Fix**: Eliminar el bypass. Si hay tokens legacy sin HMAC, migrarlos o invalidarlos.

---

## HALLAZGOS ALTOS (P1)

### H-01: `/api/intake/submit` sin autenticación ni verificación de token

**Archivo**: `src/app/api/intake/submit/route.ts`

Acepta cualquier `patient_id` UUID e inserta datos en `intake_forms` y `patient_consents` con admin client. Sin HMAC, sin sesión, sin rate limiting. Un atacante con un UUID válido puede enviar intake falso y otorgar consentimiento IA en nombre del paciente.

**Fix**: Requerir el `intake_token` HMAC firmado. Añadir rate limiting por IP.

---

### H-02: `/api/plans/swap-meal` y `/api/plans/confirm-swap` — Sin rate limiting, solo patient_token

**Archivos**: `src/app/api/plans/swap-meal/route.ts`, `src/app/api/plans/confirm-swap/route.ts`

Autorizan acceso solo con `patient_token` (UUID sin firma criptográfica). Sin rate limiting. Un atacante puede:
1. Generar llamadas ilimitadas a Claude API (~$0.01-0.05 cada una)
2. Modificar el contenido del plan vía confirm-swap sin conocimiento del nutricionista

**Fix**: Añadir rate limiting por IP + token. Considerar HMAC obligatorio. Limitar swaps por plan (ej: 10 máximo).

---

### H-03: Rate limiting en memoria en `/api/data-rights` — Inefectivo en serverless

**Archivo**: `src/app/api/data-rights/route.ts:11-22`

Usa `Map` en memoria para rate limiting. En Vercel serverless cada invocación puede correr en una instancia diferente, anulando el límite. Además, la respuesta 404 cuando el email no existe **permite enumeración de usuarios**.

**Fix**: Usar rate limiting en DB (patrón de `plan_access_attempts`). Devolver siempre 201 independientemente de si el email existe.

---

### H-04: Webhook Stripe duplicado — Riesgo de procesamiento doble

**Archivos**: `src/app/api/stripe/webhook/route.ts`, `src/app/api/webhooks/route.ts`

Dos handlers con lógica diferente (`sincronizarSuscripcion` vs `upsertUserSubscription`). Si ambos están configurados en Stripe Dashboard, los eventos se procesan 2 veces con resultados inconsistentes. El handler en `/api/webhooks/` tiene un bug: `if (!sig || !webhookSecret) return;` no devuelve Response.

**Fix**: Eliminar `/api/webhooks/route.ts` (el duplicado). Verificar Stripe Dashboard.

---

### H-05: `E2E_SETUP_SECRET` posiblemente en historial de git

**Archivo**: `.env.test:7`

Contiene un secreto hardcoded de 64 caracteres hex. `.env.test` está en `.gitignore`, pero si fue commiteado antes de añadirlo al ignore, el secreto está en el historial.

**Fix**: Ejecutar `git log --all -- .env.test`. Si aparece, rotar el secreto inmediatamente.

---

### H-06: `/api/data-rights` sin autenticación + enumeración de emails

**Archivo**: `src/app/api/data-rights/route.ts`

Acepta solicitudes ARCO de cualquier persona que conozca un email de paciente. Sin auth. La respuesta 404 confirma si un email existe en la BD.

**Fix**: Devolver siempre 201. Añadir verificación por email (enviar enlace de confirmación antes de crear la solicitud).

---

## HALLAZGOS MEDIOS (P2)

| # | Hallazgo | Archivo | Fix |
|---|----------|---------|-----|
| M-01 | **Sin Content-Security-Policy (CSP)** — CLAUDE.md dice que se implementó pero NO está | `next.config.js` | Añadir CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |
| M-02 | **Dependencia sin usar `@google/generative-ai`** — Aumenta superficie de ataque | `package.json:26` | `npm uninstall @google/generative-ai` |
| M-03 | **`supabaseAdminClient` en 41 archivos** — Bypassa RLS en páginas que no lo necesitan | `src/app/dashboard/page.tsx` y otros | Migrar a server client donde sea posible |
| M-04 | **`/api/e2e-setup` sin guard en código** — Solo redirect en next.config.js (bypassable) + bug de precedencia en validación email | `src/app/api/e2e-setup/route.ts` | Añadir `if (NODE_ENV === 'production') return 404` + fix paréntesis |
| M-05 | **Test endpoints sin auth en código** (`/api/test-pdf`, `/api/test-stream`) | `src/app/api/test-*/route.ts` | Añadir early-exit guard en producción |
| M-06 | **`/api/data-rights` sin Zod** — No valida formato email ni longitud de campos | `src/app/api/data-rights/route.ts` | Añadir schema Zod |
| M-07 | **`aceptarConsentimientoPlan` sin validación** — Server action acepta UUIDs arbitrarios | `src/app/p/[token]/actions.ts:15-34` | Validar UUIDs con Zod + verificar relación plan-paciente |
| M-08 | **`preferences` y `medical_notes` pueden contener PII** enviada a Anthropic sin filtrar | `src/libs/ai/pseudonymize.ts:37-43` | Documentar al nutricionista + regex básica para detectar emails/nombres |
| M-09 | **Sin política de retención automática** — audit_logs, ai_request_logs sin purga | — | Implementar cron/pg_cron para purgar según política (5 años audit, 1 año logs) |
| M-10 | **Sin `List-Unsubscribe` en emails** | `src/features/emails/*.tsx` | Añadir header y enlace de baja |
| M-11 | **Middleware no protege `/dashboard`** de usuarios no autenticados — guards comentados | `src/libs/supabase/supabase-middleware-client.ts:49-55` | Descomentar e implementar redirect a /login |

---

## HALLAZGOS BAJOS (P3)

| # | Hallazgo | Archivo | Notas |
|---|----------|---------|-------|
| L-01 | Contraseñas de test hardcoded en archivos de test | `tests/rls.test.ts:31-36`, `e2e/global-setup.ts:28` | Aceptable para tests con dominio `.invalid` |
| L-02 | Auth callback: `next.startsWith('/')` no previene `//evil.com` | `src/app/(auth)/auth/callback/route.ts:28` | Añadir check `!next.startsWith('//')` |
| L-03 | DELETE response expone nombre del paciente borrado | `src/app/api/patients/[id]/delete/route.ts:68` | Devolver solo `{ ok: true }` |
| L-04 | `request_id` sin validar UUID en DELETE patient | `src/app/api/patients/[id]/delete/route.ts:41` | Validar como UUID |
| L-05 | Uploads: sin validación de magic bytes (solo MIME type) | `src/app/dashboard/ajustes/actions.ts` | Verificar magic bytes del archivo |
| L-06 | `escapeHtml` innecesario en `subject` de email (no es contexto HTML) | `src/app/api/intake/submit/route.ts:119` | Usar nombre sin escapar en subject |

---

## HALLAZGOS POSITIVOS (INFO)

| # | Hallazgo | Verificación |
|---|----------|-------------|
| I-01 | **RLS en TODAS las tablas** (22+) con políticas correctas | Migraciones 001-034 verificadas |
| I-02 | **HMAC-SHA256 bien implementado** — Web Crypto, constant-time verify, 90 días expiración | `src/libs/auth/plan-tokens.ts` |
| I-03 | **Pseudonymización PII antes de Anthropic** — nombre, email, teléfono, fecha nacimiento eliminados | `src/libs/ai/pseudonymize.ts` |
| I-04 | **Stripe webhook verificado correctamente** — `constructEvent()` con firma | `src/app/api/stripe/webhook/route.ts:33` |
| I-05 | **Headers de seguridad configurados** — HSTS (2 años + preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy | `next.config.js:24-37` |
| I-06 | **Secrets server-only** — ningún secret con prefix `NEXT_PUBLIC_`, admin client solo en server | `src/libs/` |
| I-07 | **Sin inyección SQL** — todas las queries usan builder parametrizado de Supabase | 92 archivos verificados |
| I-08 | **XSS en emails mitigado** — `escapeHtml()` en intake/submit y followup/submit | `src/app/api/*/route.ts` |
| I-09 | **Consentimiento IA verificado** antes de generación de plan | `src/app/api/plans/generate/route.ts:456-473` |
| I-10 | **Exportación RGPD Art. 20 completa** — paciente, planes, progreso, consents, intake | `src/app/api/patients/[id]/export/route.ts` |
| I-11 | **Eliminación hard delete** con cascade FK, logs pseudonimizados preservados | `src/app/api/patients/[id]/delete/route.ts` |
| I-12 | **Validación uploads correcta** — MIME, tamaño (256-512 KB), path sin user input | `src/app/dashboard/ajustes/actions.ts` |
| I-13 | **`getEnvVar()` helper** fuerza presencia de env vars en runtime | `src/utils/get-env-var.ts` |
| I-14 | **`dangerouslySetInnerHTML` solo con contenido estático** — CSS y scripts SW hardcoded | 3 usos verificados |

---

## PLAN DE REMEDIACIÓN PRIORIZADO

### Sprint inmediato (antes de escalar beta)

| # | Fix | Esfuerzo | Impacto |
|---|-----|----------|---------|
| 1 | C-01: `getSession()` → `getUser()` en `get-session.ts` | 5 min | Cierra bypass JWT en Stripe |
| 2 | C-02: HMAC obligatorio en `/p/[token]` | 15 min | Protege datos de salud pacientes |
| 3 | C-03: Eliminar bypass backward-compat en middleware | 5 min | Cierra puerta trasera intake |
| 4 | H-01: Auth en `/api/intake/submit` | 30 min | Previene intake/consent falsos |
| 5 | H-02: Rate limiting en swap-meal/confirm-swap | 30 min | Previene abuso API Claude |
| 6 | H-04: Eliminar webhook duplicado `/api/webhooks/` | 5 min | Evita procesamiento doble |
| 7 | H-05: Verificar `.env.test` en git history | 5 min | Rotar secreto si expuesto |

### Próximo sprint

| # | Fix | Esfuerzo |
|---|-----|----------|
| 8 | M-01: Implementar CSP header | 1 h |
| 9 | M-02: `npm uninstall @google/generative-ai` | 1 min |
| 10 | M-04: Guard producción en `/api/e2e-setup` + fix precedencia | 10 min |
| 11 | M-05: Guard producción en test endpoints | 10 min |
| 12 | M-06: Zod en `/api/data-rights` | 20 min |
| 13 | H-03: Rate limiting DB en `/api/data-rights` + anti-enumeración | 45 min |
| 14 | H-06: Anti-enumeración emails (siempre 201) | 15 min |
| 15 | M-11: Descomentar guards middleware dashboard | 15 min |

### Backlog

| # | Fix | Esfuerzo |
|---|-----|----------|
| 16 | M-03: Reducir uso de `supabaseAdminClient` | 2 h |
| 17 | M-07: Validar server action `aceptarConsentimientoPlan` | 20 min |
| 18 | M-09: Política de retención automática | 1 h |
| 19 | M-10: `List-Unsubscribe` en emails | 30 min |
| 20 | L-02: Fix open redirect edge case | 5 min |

---

## COMPARATIVA CON AUDIT PREVIO (1 abril 2026)

| Área | Audit 1 abril | Security Audit 4 abril | Cambio |
|------|---------------|------------------------|--------|
| `/api/health` expone keys | RESUELTO | Confirmado resuelto | ✅ |
| XSS en emails | RESUELTO | Confirmado (`escapeHtml`) | ✅ |
| Tokens sin firma | RESUELTO | HMAC implementado, pero bypass en `/p/[token]` | ⚠️ C-02 |
| RLS plan_views | RESUELTO | Confirmado (migración 032) | ✅ |
| Auth `/api/meal-image` | RESUELTO | Confirmado | ✅ |
| Rate limiting | RESUELTO | Funciona en generate, NO en swap/intake/followup | ⚠️ H-01/H-02 |
| CSP header | Marcado como RESUELTO | **NO implementado** | ❌ M-01 |
| `getSession` vs `getUser` | No auditado | **NUEVO hallazgo crítico** | 🆕 C-01 |

---

*Auditoría realizada: 4 abril 2026*
*Método: 3 agentes de análisis estático en paralelo (auth+API, secrets+deps+config, data+XSS+RGPD)*
*Total archivos analizados: ~160 en src/, 34 migraciones, next.config.js, package.json*
*Próxima auditoría recomendada: tras resolver los 3 CRITICALs*
