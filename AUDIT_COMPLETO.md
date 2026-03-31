# Auditoría Completa — Dietly v1.0 Beta

**Fecha**: 1 de abril de 2026
**Modelo**: Claude Opus 4.6
**Alcance**: UX/UI, Código, Seguridad/RGPD, Rendimiento
**Codebase**: 171 archivos, ~26.600 LOC

---

## Resumen ejecutivo

Dietly es un MVP funcional con un flujo core sólido (crear paciente → generar plan IA → PDF → enviar). La PWA del paciente es limpia y el dashboard tiene buena estructura. Sin embargo, la auditoría revela **5 problemas críticos** que deben resolverse antes de escalar más allá de los 8 beta testers actuales, especialmente en seguridad (XSS en emails, tokens predecibles) y rendimiento (`force-dynamic` en root layout anula todo el caché de Next.js). La deuda técnica más importante es la ausencia total de validación Zod en inputs — un requisito del propio CLAUDE.md que no se ha implementado.

**Distribución de hallazgos**:
| Severidad | Cantidad |
|-----------|----------|
| Crítico   | 5        |
| Alto      | 12       |
| Medio     | 11       |
| Bajo      | 7        |
| **Total** | **35**   |

---

## Tabla de problemas por severidad

### CRÍTICO (5)

| ID | Bloque | Problema | Impacto | Archivo(s) |
|----|--------|----------|---------|------------|
| C-01 | Rendimiento | `export const dynamic = 'force-dynamic'` en `layout.tsx` raíz — desactiva TODO el caché estático de Next.js en toda la app | TTFB +200-400ms en cada página, Vercel edge cache inútil | `src/app/layout.tsx` |
| C-02 | Seguridad | XSS en emails de intake y seguimiento — datos del paciente se inyectan sin sanitizar en templates React Email | Un paciente malicioso puede inyectar HTML/JS en el email que recibe el nutricionista | `src/features/emails/`, `src/app/api/intake/submit/route.ts`, `src/app/api/followup/submit/route.ts` |
| C-03 | Seguridad | `/api/health` expone prefijo de API keys (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`) con `key.substring(0,8)` | Facilita ataques de fuerza bruta parcial; viola mejores prácticas de seguridad | `src/app/api/health/route.ts` |
| C-04 | Seguridad | `/p/[token]` usa UUID v4 sin HMAC ni rate limiting real — tokens adivinables con fuerza bruta | Acceso no autorizado a planes nutricionales (datos de salud RGPD Art. 9) | `src/app/p/[token]/page.tsx` |
| C-05 | Rendimiento | Zero `error.tsx` en toda la app — cualquier error no capturado muestra pantalla blanca | UX catastrófica ante cualquier fallo de Supabase, Stripe o API | Todos los directorios de `src/app/` |

### ALTO (12)

| ID | Bloque | Problema | Impacto | Archivo(s) |
|----|--------|----------|---------|------------|
| A-01 | Seguridad | `plan_views` sin RLS — cualquier usuario autenticado puede leer/escribir registros de visualización de otros | Fuga de datos: quién abrió qué plan y cuándo | `supabase/migrations/027_plan_views.sql` |
| A-02 | Código | Cero validación Zod en toda la app — CLAUDE.md lo exige, no se implementó | Inputs sin validar en 17 API routes y server actions; potencial inyección/corrupción de datos | Todas las API routes y actions |
| A-03 | Código | Rate limiting in-memory (`Map()`) inútil en serverless — cada invocación tiene memoria nueva | `/api/plans/generate` sin protección real contra abuso; un usuario puede generar planes ilimitados (coste IA) | `src/app/api/plans/generate/route.ts` |
| A-04 | Código | 46 `as any` restantes en código de producción (de 90+ originales) | Type safety degradada; bugs silenciosos en runtime | Múltiples archivos |
| A-05 | Seguridad | Sin headers CSP ni HSTS — Next.js no los añade por defecto | Vulnerable a XSS reflejado, clickjacking, downgrade HTTPS | `next.config.js` |
| A-06 | Seguridad | `/api/meal-image` sin autenticación — cualquiera puede generar imágenes consumiendo créditos IA | Abuso de API, coste económico directo | `src/app/api/meal-image/route.ts` |
| A-07 | Seguridad | Sin rate limit en `/api/plans/generate` — generación IA cuesta ~$0.10-0.50 por plan | Un usuario puede agotar créditos Anthropic; sin Zod, el body puede contener datos inesperados | `src/app/api/plans/generate/route.ts` |
| A-08 | RGPD | Consentimiento `ai_processing` no se requiere antes de generar plan — se puede generar sin consentimiento del paciente | Incumplimiento RGPD Art. 9 — procesamiento de datos de salud con IA sin base legal | `src/app/api/plans/generate/route.ts` |
| A-09 | Rendimiento | Queries con `select('*')` en 15+ ubicaciones — trae columnas innecesarias | Payload inflado, mayor latencia, más memoria | Múltiples archivos |
| A-10 | Rendimiento | Descargas secuenciales de Storage en PDF (logo, firma, foto) — 3 fetches en serie | +600-900ms en generación de PDF cuando el nutricionista tiene los 3 assets | `src/app/api/plans/[id]/pdf/route.ts` |
| A-11 | Rendimiento | SSE stream sin `AbortController` ni reconexión — si la conexión se corta, el plan queda en estado `generating` para siempre | Plan zombie sin forma de recuperarlo desde UI | `src/app/dashboard/plans/[id]/plan-viewer.tsx` |
| A-12 | Rendimiento | PDF se regenera en cada descarga — sin caché en Supabase Storage | Cada clic en "Descargar PDF" consume CPU del servidor y tarda 2-5s | `src/app/api/plans/[id]/pdf/route.ts` |

### MEDIO (11)

| ID | Bloque | Problema | Impacto | Archivo(s) |
|----|--------|----------|---------|------------|
| M-01 | Código | Detección Pro duplicada en 3 sitios con lógica diferente | Inconsistencia: un archivo puede detectar Pro y otro no para el mismo usuario | `ajustes/page.tsx`, `pdf/route.ts`, `get-subscription.ts` |
| M-02 | Código | Coexistencia `src/lib/` y `src/libs/` — convención rota | Confusión en imports, búsqueda de código difícil | `src/lib/`, `src/libs/` |
| M-03 | Seguridad | Endpoints de test en producción (`/api/test-pdf`, `/api/test-stream`, `/api/e2e-setup`) | Superficie de ataque innecesaria; `/api/e2e-setup` puede crear datos falsos | `src/app/api/test-*/`, `src/app/api/e2e-setup/` |
| M-04 | RGPD | `audit_logs` solo tiene triggers en 4 de 22 tablas — faltan appointments, recipes, followup_forms, etc. | Audit trail incompleto para cumplimiento RGPD | `supabase/migrations/020_audit_logs.sql` |
| M-05 | Rendimiento | Recharts importado sin lazy loading — ~180KB en bundle del cliente | Penaliza First Load JS en páginas que no usan gráficos | `src/app/dashboard/patients/[id]/` |
| M-06 | Rendimiento | Faltan `loading.tsx` en: `patients/new`, `recetas`, `derechos-datos`, `admin/beta` | Sin skeleton durante carga; el usuario ve pantalla en blanco | Directorios mencionados |
| M-07 | UX | Cookie banner cubre contenido en primera visita — no se puede interactuar con la página debajo | UX bloqueante en landing para nuevos visitantes | Landing page |
| M-08 | UX | PWA del paciente sin header de branding del nutricionista (logo, nombre clínica, color) | El paciente no identifica quién le envió el plan; el nutricionista pierde branding | `src/app/p/[token]/pwa-shell.tsx` |
| M-09 | Código | `supabaseAdminClient` (service role) usado en server actions donde bastaría el client autenticado con RLS | Bypasea RLS innecesariamente; mayor superficie de riesgo si hay bug de autenticación | Múltiples server actions |
| M-10 | RGPD | Art. 28.3 incompleto en T&Cs — faltan letras a-h de la cláusula de encargado del tratamiento | Incumplimiento formal antes de escalar a 10+ clientes | `/legal/terminos` |
| M-11 | Rendimiento | Queries secuenciales en dashboard principal — 4-5 queries en serie que podrían ejecutarse en paralelo | +200-400ms en carga del dashboard | `src/app/dashboard/page.tsx` |

### BAJO (7)

| ID | Bloque | Problema | Impacto | Archivo(s) |
|----|--------|----------|---------|------------|
| B-01 | UX | Agenda muestra citas duplicadas (artefactos de tests E2E) | Confusión visual; no afecta datos reales | `src/app/dashboard/agenda/` |
| B-02 | UX | `/dashboard/admin/beta` inaccesible para usuarios no-admin sin feedback claro | Página vacía o error sin explicación | `src/app/dashboard/admin/beta/` |
| B-03 | Código | 12 archivos > 400 líneas (top: landing 883, PDF 788, generate 754) | Dificulta mantenimiento y code review | Archivos mencionados |
| B-04 | Código | Tipos `Database` en `types.ts` con tablas legacy del boilerplate (`customers`, `products`, `prices`) | Ruido en autocompletado; confusión sobre qué tablas son de Dietly | `src/libs/supabase/types.ts` |
| B-05 | Rendimiento | `console.log` en producción (debugging) — sin logger con niveles | Logs ruidosos en Vercel; sin capacidad de filtrar por severidad | Múltiples archivos |
| B-06 | RGPD | Datos de `ai_request_logs` pseudonimizados pero sin periodo de retención definido | Acumulación infinita de logs; sin política de limpieza | `supabase/migrations/016_ai_request_logs.sql` |
| B-07 | Rendimiento | Imágenes de landing sin `priority` ni `sizes` — LCP subóptimo | Lighthouse score penalizado en mobile | Landing page |

---

## Plan de acción

### Pre-lanzamiento (antes de escalar a 10+ clientes)

**Sprint 1 — Seguridad crítica (1-2 días)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Eliminar exposición de API keys en `/api/health` | C-03 | 15 min |
| Sanitizar inputs en templates de email (escape HTML) | C-02 | 1h |
| Añadir HMAC a tokens de `/p/[token]` (ya existe `plan-tokens.ts`) | C-04 | 2h |
| Añadir RLS a `plan_views` | A-01 | 30 min |
| Añadir auth a `/api/meal-image` | A-06 | 30 min |
| Eliminar/proteger endpoints de test en producción | M-03 | 30 min |
| Añadir headers CSP + HSTS en `next.config.js` | A-05 | 1h |

**Sprint 2 — Rendimiento crítico (1 día)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Eliminar `force-dynamic` del root layout; mover a rutas que lo necesiten | C-01 | 1h |
| Añadir `error.tsx` global + en rutas principales | C-05 | 2h |
| Paralelizar descargas de Storage en PDF (`Promise.all`) | A-10 | 30 min |
| Cachear PDF generado en Supabase Storage | A-12 | 2h |

**Sprint 3 — Validación y protección (2-3 días)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Implementar Zod en las 5 API routes más críticas (generate, intake, followup, delete, export) | A-02 | 4h |
| Rate limiting real con Upstash Redis o Vercel KV | A-03, A-07 | 3h |
| Verificar consentimiento `ai_processing` antes de generar plan | A-08 | 1h |
| Añadir `AbortController` + reconexión en SSE del plan | A-11 | 2h |

### Roadmap post-lanzamiento

**Fase 1 — Calidad de código (semana 6)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Eliminar los 46 `as any` restantes | A-04 | 4h |
| Consolidar `src/lib/` y `src/libs/` en uno | M-02 | 2h |
| Centralizar detección Pro en una sola función | M-01 | 1h |
| Reducir uso de `supabaseAdminClient` donde no es necesario | M-09 | 2h |
| Optimizar queries `select('*')` → columnas específicas | A-09 | 3h |

**Fase 2 — UX y rendimiento (semana 7)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Lazy-load Recharts | M-05 | 1h |
| Añadir `loading.tsx` en rutas faltantes | M-06 | 1h |
| Paralelizar queries del dashboard | M-11 | 1h |
| Header de branding en PWA del paciente | M-08 | 2h |
| Ajustar cookie banner para no bloquear contenido | M-07 | 1h |
| Optimizar imágenes de landing (priority, sizes) | B-07 | 30 min |

**Fase 3 — RGPD completo (semana 8)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Cláusula Art. 28.3 completa en T&Cs (letras a-h) | M-10 | 2h (redacción legal) |
| Ampliar triggers de audit_logs a todas las tablas relevantes | M-04 | 2h |
| Definir política de retención para `ai_request_logs` | B-06 | 1h |

**Fase 4 — Limpieza (semana 9+)**

| Tarea | IDs | Esfuerzo |
|-------|-----|----------|
| Refactorizar archivos > 400 líneas | B-03 | 4h |
| Implementar logger con niveles (reemplazar console.log) | B-05 | 2h |
| Limpiar datos E2E de agenda | B-01 | 30 min |
| Feedback claro en admin/beta para no-admins | B-02 | 30 min |
| Limpiar tipos legacy del boilerplate | B-04 | 30 min |
| Extender Zod al resto de API routes y server actions | A-02 | 4h |

---

## Detalle por bloque

### Bloque 1 — UX/UI (Glance browser en dietly.es)

**Páginas auditadas**: Landing, Login, Dashboard, Pacientes, Ficha paciente, Editor de plan, Ajustes, Agenda, Recetas, Derechos de datos, Admin/Beta, PWA paciente (390px mobile).

**Positivo**:
- Dashboard bien estructurado con sidebar clara y métricas útiles
- Ficha de paciente con tabs funcionales (Ficha, Cuestionario, Progreso, Seguimientos)
- PWA del paciente limpia: navegación por días, cards de comidas con macros, lista de compra interactiva
- Dark mode automático en PWA funciona correctamente
- Editor de plan con progreso visual día a día

**Problemas encontrados**: M-07 (cookie banner), M-08 (PWA sin branding), B-01 (agenda duplicados), B-02 (admin inaccesible).

### Bloque 2 — Código y deuda técnica

**Métricas**:
- 171 archivos TypeScript/TSX
- ~26.600 líneas de código
- 46 `as any` en producción
- 0 schemas Zod implementados (de 17+ necesarios)
- 92 queries Supabase sin capa de abstracción
- 52 archivos > 200 líneas

**Verificaciones especiales**:
- **BUG-006** (confirmado NO es bug): `get-subscription.ts` ya fue corregido en sesión anterior con `.eq('user_id', user.id)`.
- **BUG-007** (riesgo bajo): Metadata de Stripe usa `userId` como string — funciona porque Supabase UUIDs son strings válidos.

### Bloque 3 — Seguridad y RGPD

**Estado RGPD** (6/11 requisitos cubiertos):
| Requisito | Estado |
|-----------|--------|
| Consentimiento datos salud (Art. 9) | Parcial — existe tabla pero no se verifica antes de generar |
| Derecho al olvido (Art. 17) | OK — endpoint DELETE implementado |
| Exportación datos (Art. 20) | OK — endpoint GET implementado |
| Solicitudes ARCO | OK — panel completo |
| Audit trail | Parcial — solo 4 de 22 tablas |
| Pseudonimización IA | OK — PII eliminada antes de enviar a Anthropic |
| Cláusula Art. 28.3 | Incompleto — faltan letras a-h |
| Retención de datos | Parcial — falta política en ai_request_logs |
| Notificación de brechas | No implementado |
| EIPD (evaluación de impacto) | No realizada |
| Cifrado en reposo | OK — Supabase por defecto |

### Bloque 4 — Rendimiento y estabilidad

**Impacto estimado de fixes críticos**:
- Eliminar `force-dynamic` del root layout: **-200-400ms TTFB** en páginas estáticas
- Cachear PDF: **-2-5s** por descarga repetida
- Paralelizar Storage downloads: **-600ms** en generación PDF
- Lazy-load Recharts: **-180KB** First Load JS

**Observaciones positivas**:
- Turbopack en dev funciona correctamente
- SSE streaming para generación IA es buena arquitectura
- PDF server-side en Vercel funciona (validado en producción)
- Service worker con network-first es la estrategia correcta para PWA

---

*Auditoría generada automáticamente con Claude Opus 4.6 el 1 de abril de 2026.*
