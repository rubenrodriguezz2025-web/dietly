# Dietly — Contexto completo actualizado

> Documento maestro de estado del proyecto. Snapshot completo tras Sprint 5.
> Fecha: 14 abril 2026.

---

## 1. Qué es Dietly

SaaS web para nutricionistas autónomos españoles. La IA genera el borrador de un plan nutricional semanal en 2 minutos; el profesional lo revisa, ajusta y lo entrega al paciente con su marca. Todo el flujo `draft → approved → sent` está diseñado como cobertura legal: la IA nunca "firma" un plan.

- **Mercado**: ~8.075 dietistas-nutricionistas colegiados en España (CGCODN 2024).
- **Dolor**: 1–3 h de trabajo manual por plan · 20–60 pacientes activos.
- **Planes**: Básico 46 €/mes (30 pacientes) · Profesional 89 €/mes (ilimitado + branding propio). IVA 21 % incluido.
- **Modelo B freemium**: 2 pacientes gratis sin tarjeta; a partir del tercero, paywall.

---

## 2. Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (App Router, Turbopack) · TypeScript estricto |
| DB + Auth | Supabase (PostgreSQL + RLS, `@supabase/ssr`) |
| Pagos | Stripe LIVE (suscripciones mensuales, `customer.subscription.*` webhooks) |
| IA | Anthropic · `claude-sonnet-4-6` (Structured Outputs via tool_use) |
| PDF | `@react-pdf/renderer` server-side en Vercel |
| Email | Resend + React Email (transaccional) · Resend como SMTP de Supabase Auth |
| UI | shadcn/ui + Tailwind CSS |
| Deploy | Vercel |

---

## 3. Estado actual (abril 2026) — launch-ready

**Sprints completados**: 1 (seguridad) · 2 (rendimiento) · 3 (validación) · 3.5 (intercambio de platos) · 4 (UX + branding PWA) · 5 (monetización + limpieza Stripe).

**Features core implementadas**:

- ✅ Auth + onboarding reducido (2–3 pasos, sin paso "primer paciente")
- ✅ CRUD pacientes + ficha con anamnesis + intake público `/p/intake/[token]`
- ✅ Generación IA día a día (7 llamadas + lista de compra)
- ✅ Editor de plan + validación clínica (19 checks)
- ✅ **Intercambio de platos** (paciente solicita desde PWA → nutricionista aprueba en `/dashboard/intercambios`)
- ✅ PDF server-side con caché (`pdf_generated_at`) + branding Pro
- ✅ Emails transaccionales con Resend (5 templates React Email) + templates Supabase Auth en ES
- ✅ PWA paciente `/p/[token]` con header branding nutricionista
- ✅ Seguimientos antropométricos (migración 038)
- ✅ Panel admin beta
- ✅ **Stripe LIVE** con `profiles` como Source of Truth
- ✅ **Modelo B freemium** con `PaywallModal` en 3 puntos (createPatient, generate, swap-meal)
- ✅ Banner de bienvenida en `/dashboard`
- ✅ RGPD: consentimientos, ARCO, audit logs (5 años), rate limiting

---

## 4. Bugs críticos resueltos en Sprint 5

Durante Sprint 5 se descubrieron y corrigieron varios problemas heredados del boilerplate `next-supabase-stripe-starter` que bloqueaban el launch:

1. **Boilerplate Stripe nunca aplicado** — las tablas `customers`, `products`, `prices` y `subscriptions` del starter jamás se crearon en la BBDD real. Había ~15 archivos muertos (`upsert-user-subscription.ts`, `upsert-product.ts`, `upsert-price.ts`, `get-products.ts`, `get-subscription.ts`, `price-card.tsx`, `create-checkout-action.ts`, `product-metadata.ts`, `types.ts`, ruta `(account)/`…) que hacían queries a tablas inexistentes y fallaban en runtime. **Erradicado en bloque.**
2. **`stripe_customer_id` perdido** — el webhook intentaba escribirlo en una tabla `customers` que no existía. **Migración 039** añade la columna a `profiles` con índice inverso.
3. **Detección Pro por nombre de producto Stripe** — heurística frágil que dependía de que el nombre contuviera "pro"/"profesional". **Migración 040** añade `profiles.stripe_price_id`; el webhook lo escribe en cada `customer.subscription.*` y `get-user-subscription.ts` deriva `isPro` comparando contra `STRIPE_PRICE_PRO_ID`.
4. **Onboarding bloqueado en "primer paciente"** — el wizard forzaba crear un paciente real antes de acceder al dashboard. Fricción enorme. Botón "Saltar este paso" temporal mientras Sprint 3 rediseña el flujo.
5. **Logo de emails 5 MB** — `logo.png` se incrustaba sin optimizar en los templates, reventaba el límite de Resend. **Fix**: pipeline con `sharp` que genera `public/logo-email.png` optimizado.
6. **Auth forms sin `autoComplete`** — Chrome/1Password no autorellenaba email/password. Añadido `email`, `new-password`, `current-password` en login, signup, forgot-password y reset-password.
7. **Templates Auth en inglés** — Supabase Auth enviaba los correos de confirmación/recuperación en inglés. Migrado Resend como SMTP y creados 4 templates HTML en español con branding Dietly en `docs/email-templates/`.
8. **`PaywallModal` ausente** — no había muro real en el flujo freemium. Integrado en `createPatient` (límite 2), `/api/plans/generate` y `/api/plans/swap-meal`.

---

## 5. Arquitectura — cambios clave tras Sprint 5

### `profiles` como Source of Truth para Stripe

```
profiles.stripe_customer_id   ← webhook customer.subscription.*
profiles.subscription_status  ← webhook customer.subscription.*
profiles.stripe_price_id      ← webhook customer.subscription.*
```

No hay tablas de sync. `get-user-subscription.ts` expone dos funciones:

- `getUserSubscription()` — con contexto auth/RLS (páginas, server actions)
- `getUserSubscriptionById(userId)` — admin client para rutas públicas `/p/[token]`

Ambas devuelven `{ status, price_id, isActive, isPro }`.

### `DIETLY_PLANS` como SoT de precios (`src/features/pricing/plans-config.ts`)

Fuente única de `name`, `price`, `patient_limit`, `features[]` y `stripe_price_id`. La página `/pricing` y el `PricingSection` renderizan directamente desde este array. Sin fetch a Stripe, sin sync a BBDD.

### Emails Auth

Resend configurado como SMTP custom de Supabase Auth. Templates en `docs/email-templates/` (confirm-signup, magic-link, reset-password, email-change). Emails transaccionales (bienvenida nutricionista, bienvenida paciente, plan listo, beta-welcome, onboarding-welcome) siguen renderizándose con React Email y enviándose directamente vía Resend API.

### Assets de logo

- `public/logo.png` — logo principal
- `public/logo-email.png` — optimizado con `sharp` para emails (< 200 KB)
- `public/favicon.svg` — favicon vectorial

---

## 6. Rutas — estado actual

### Dashboard (auth requerida)

`/dashboard` · `/dashboard/patients/new` · `/dashboard/patients/[id]` (Ficha, Cuestionario, Progreso, Seguimientos) · `/dashboard/plans/[id]` · `/dashboard/intercambios` · `/dashboard/agenda` · `/dashboard/recetas` · `/dashboard/ajustes` · `/dashboard/derechos-datos` · `/dashboard/admin/beta`

### Paciente (público)

`/p/[token]` (PWA plan) · `/p/intake/[token]` · `/p/seguimiento/[token]`

### API (21 endpoints)

Planes: `generate` (SSE), `[id]/status`, `[id]/pdf`, `[id]/pwa-pdf`, `swap-meal`, `confirm-swap`, `swap-action`.
PDF: `pdf/preview`.
Paciente: `intake/submit`, `followup/submit`, `patients/[id]/delete`, `patients/[id]/export`.
RGPD: `data-rights`.
Multimedia: `meal-image`.
Stripe: `checkout`, `portal`, `webhook`.
Infra: `health`.

### Marketing / legal

`/` · `/pricing` · `/login` · `/signup` · `/forgot-password` · `/reset-password` · `/onboarding` · `/legal/terminos` · `/legal/privacidad`

---

## 7. Migraciones (41 en `supabase/migrations/`)

- **Legacy**: `20240115041359_init.sql` (boilerplate Stripe, mayoría obsoleto tras Sprint 5)
- **001–011**: schema core, subscription_status, appointments, intake, plan_status_enum, logo_url, meeting_url, professional_identity, onboarding, patient_progress, beta_whitelist
- **014–023**: brand_settings, brand_visited, ai_request_logs, patient_consents, data_rights, validation_acked, audit_logs, rls_hardening, plan_rate_limit, ai_literacy
- **024–033**: patient_consents v2, fix_audit_trigger, patient_phone, recipes, plan_views, intake_filled_by, fix_audit_trigger_safe, dietary_restrictions_array, profiles_primary_color, plan_views_rls, pdf_cache
- **034–038 (Sprint 3.5 + 4)**: meal_swaps, allow_meal_swaps, nutritionist_photos_bucket, meal_swaps_status, progress_enhancements
- **039 (Sprint 5)**: `stripe_customer_id` a `profiles` (+ índice)
- **040 (Sprint 5)**: `stripe_price_id` a `profiles` (fuente de verdad Básico/Pro)

---

## 8. Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=

# Stripe LIVE
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_BASICO_ID=   # Plan Básico 46€/mes
STRIPE_PRICE_PRO_ID=      # Plan Pro 89€/mes — fuente de verdad isPro

# IA
ANTHROPIC_API_KEY=

# Emails
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
PLAN_TOKEN_SECRET=        # HMAC-SHA256 para tokens /p/[token]
```

---

## 9. Deuda técnica pendiente

- ~46 `as any` restantes (no críticos; mayoría en queries Supabase)
- 92 queries Supabase sin abstracción de repositorio
- Cláusula Art. 28.3 RGPD completa (letras a–h) pendiente para escalar más allá de beta
- Plantilla de consentimiento informado descargable pendiente
- Cobertura de tests E2E incompleta para el flujo de paywall

---

## 10. Próximos pasos

1. Cláusula Art. 28.3 RGPD completa en T&Cs (bloqueante para escalar)
2. Plantilla de consentimiento informado descargable
3. Fotos de comida con Nano Banana 2 (post-launch)
4. BEDCA integrada para verificación de macros (post-launch)
5. Integración Google Calendar (post-launch)

---

*Última actualización: 14 abril 2026 · tras commit `b0dbc28` (Sprint 5 erradicación boilerplate Stripe + autoComplete auth).*
