# CLAUDE.md — Dietly

Lee este archivo COMPLETO antes de escribir cualquier código.

---

## Producto

**Dietly** — SaaS web para nutricionistas autónomos españoles. La IA genera el borrador del plan nutricional en 2 minutos. El profesional lo revisa, ajusta y entrega con su marca.

> ⚠️ **Copy SIEMPRE menciona revisión profesional.** El flujo `draft → approved` es cobertura legal.

**Mercado**: ~8.075 D-N colegiados (CGCODN 2024) · dolor: 1-3 h/plan manual · 20-60 pacientes activos

**Planes**: Básico 46€/mes (30 pacientes) · Pro 89€/mes (ilimitado + branding PDF propio) · IVA 21% incluido

---

## Stack

```
Frontend:  Next.js 15 (App Router)
DB + Auth: Supabase (PostgreSQL + RLS)
Pagos:     Stripe (suscripciones mensuales)
IA:        claude-sonnet-4-6 (Structured Outputs)
PDF:       @react-pdf/renderer (server-side en Vercel ✅)
Email:     Resend + React Email
UI:        shadcn/ui + Tailwind CSS
Deploy:    Vercel
```

---

## Schema DB (18 tablas · tipos en `src/libs/supabase/types.ts`)

> ⚠️ **profiles es la fuente única de verdad para Stripe.** Las tablas `customers`/`products`/`prices`/`subscriptions` del boilerplate `next-supabase-stripe-starter` nunca se aplicaron al proyecto real y se eliminaron en Sprint 5. El webhook escribe `stripe_customer_id`, `subscription_status` y `stripe_price_id` directamente en `profiles` en cada evento `customer.subscription.*`.

### `profiles`
`id` · `full_name` · `specialty` (weight_loss|sports|clinical|general) · `clinic_name` · `logo_url` · `primary_color` (#1a7a45) · `college_number` · `signature_url` · `subscription_status` · `stripe_customer_id` · `stripe_price_id` · `onboarding_completed_at` · `show_macros` · `show_shopping_list` · `welcome_message` · `font_preference` (clasica|moderna|minimalista) · `profile_photo_url` · `brand_settings_visited_at` · `ai_literacy_acknowledged_at`

### `patients`
`id` · `nutritionist_id` · `name` · `email` · `phone` · `date_of_birth` · `sex` (male|female) · `weight_kg` · `height_cm` · `activity_level` (sedentary|lightly_active|moderately_active|very_active|extra_active) · `goal` (weight_loss|weight_gain|maintenance|muscle_gain|health) · `dietary_restrictions text[]` · `allergies text[]` · `intolerances text[]` · `preferences` · `medical_notes` · `tmb` · `tdee` · `intake_token`

### `nutrition_plans`
`id` · `patient_id` · `nutritionist_id` · `status` (generating|draft|approved|sent|error) · `content jsonb` · `week_start_date` · `patient_token` · `sent_at` · `approved_at` · `approved_by` · `validation_acked_blocks text[]` · `pdf_generated_at`

### `plan_generations`
`id` · `plan_id` · `nutritionist_id` · `day_number` (1-7) · `status` (pending|generating|completed|failed) · `tokens_input` · `tokens_output` · `cost_usd`

### Tablas adicionales

| Tabla | Propósito |
|-------|-----------|
| `appointments` | Agenda presencial/online (meeting_url) |
| `intake_forms` | Cuestionarios (filled_by: patient/nutritionist) |
| `patient_progress` | Seguimiento antropométrico |
| `beta_whitelist` | Acceso beta con plan_limit |
| `ai_request_logs` | Log IA pseudonymizado (sin PII) |
| `patient_consents` | Consentimiento RGPD Art. 9 (ai_processing) |
| `data_rights_requests` | Solicitudes ARCO |
| `audit_logs` | Audit trail RGPD (triggers, 5 años) |
| `followup_forms` / `followup_reminders` | Seguimiento |
| `plan_access_attempts` | Rate limiting por IP |
| `recipes` | Recetario personal del nutricionista |
| `plan_views` | Lectura de recepción (first_opened, open_count) |
| `meal_swaps` | Solicitudes de intercambio de platos (paciente → nutricionista) |
| `nutritionist_photos` | Bucket privado de fotos de perfil del profesional |

---

## Compliance RGPD

- Dietly = **encargado del tratamiento** · nutricionista = **responsable**
- Sub-encargados listados: Supabase, Stripe, Resend, Anthropic, Vercel
- **TODO antes de escalar**: añadir cláusula Art. 28.3 RGPD completa (letras a-h) en T&Cs
- Derechos ARCO implementados · consentimiento ai_processing requerido antes de generar plan
- IVA 21% en suscripción SaaS · servicios nutricionista exentos (no es problema de Dietly)

---

## Generación IA

- **Modelo**: `claude-sonnet-4-6` · Structured Outputs (JSON garantizado via tool_use)
- **Estrategia**: 7 llamadas separadas (una por día) + 1 para lista de la compra
- **Coste estimado**: ~$0.10-0.50/plan · capturar `tokens_used` siempre en `plan_generations`
- Pseudonymización PII antes de enviar a Anthropic
- Timeout 30s/día · retry día fallido (no plan completo) · circuit breaker en resilience.ts
- Verificar `ai_processing` consent antes de llamar a Claude

**Estructura JSON content**: `week_summary` (target_calories, target_macros, weekly_averages) + `days[]` (day_number, day_name, total_calories, total_macros, meals[]) + `shopping_list` (produce, protein, dairy, grains, pantry)

---

## Reglas de desarrollo

### Código
- TypeScript estricto · sin `any` · Zod para todos los inputs
- Server Actions para mutaciones (no fetch desde cliente)
- Feature-based: `src/features/<feature>/` con components/, actions/, models/, utils/
- ESLint: `npm run lint` antes de cada commit · sin warnings en producción
- Git commits: mensajes en inglés, formato `type: descripción` (feat/fix/refactor/chore)
- Migraciones: crear con `npm run migration:new`, aplicar con `npm run migration:up` (o Supabase Studio para hotfixes en producción)

### Supabase
- **RLS en TODAS las tablas** · patrón: `(select auth.uid()) = nutritionist_id`
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente · usar `@supabase/ssr`

### PDF
- Fonts locales en `/public/fonts/` (nunca Google Fonts CDN)
- Generar solo en status `approved` · cachear con `pdf_generated_at`
- Distinción Básico/Pro: `profiles.stripe_price_id === process.env.STRIPE_PRICE_PRO_ID` (ver `get-user-subscription.ts`)

### Monetización (Modelo B freemium)
- 2 pacientes gratis sin suscripción · al intentar crear el 3º, `PaywallModal` bloquea
- Muro fuerte también en generación IA y en `/api/plans/swap-meal`
- Banner de bienvenida en `/dashboard` invita a empezar prueba de 14 días

### No hacer en MVP
❌ Recálculo macros al editar · ❌ BEDCA/USDA · ❌ App nativa · ❌ Multi-nutricionista · ❌ OAuth social · ❌ Plan anual · ❌ Templates dieta · ❌ Wearables · ❌ Chat tiempo real

---

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_BASICO_ID=   # Price ID del plan Básico 46€/mes
STRIPE_PRICE_PRO_ID=      # Price ID del plan Pro 89€/mes (fuente de verdad para isPro)
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
PLAN_TOKEN_SECRET=    # HMAC-SHA256 para tokens /p/[token]
```

---

## Rutas

### Dashboard (auth requerida)
`/dashboard` · `/dashboard/patients/new` · `/dashboard/patients/[id]` (tabs: Ficha, Cuestionario, Progreso, Seguimientos) · `/dashboard/plans/[id]` · `/dashboard/intercambios` · `/dashboard/agenda` · `/dashboard/recetas` · `/dashboard/ajustes` · `/dashboard/derechos-datos` · `/dashboard/admin/beta`

### Paciente (público)
`/p/[token]` (plan PWA) · `/p/intake/[token]` · `/p/seguimiento/[token]`

### API (21 endpoints)
`POST /api/plans/generate` (SSE stream) · `GET /api/plans/[id]/status` · `POST /api/plans/[id]/pdf` · `POST /api/plans/[id]/pwa-pdf` · `POST /api/plans/swap-meal` · `POST /api/plans/confirm-swap` · `POST /api/plans/swap-action` · `POST /api/pdf/preview` · `POST /api/intake/submit` · `POST /api/followup/submit` · `DELETE /api/patients/[id]/delete` · `GET /api/patients/[id]/export` · `POST /api/data-rights` · `POST /api/meal-image` · `POST /api/stripe/checkout` · `POST /api/stripe/portal` · `POST /api/stripe/webhook` · `GET /api/health`

### Marketing / legal
`/` · `/pricing` · `/login` · `/signup` · `/onboarding` · `/legal/terminos` · `/legal/privacidad`

---

## Estructura de código

```
src/
├── app/
│   ├── (auth)/         login, signup, reset
│   ├── (marketing)/    landing, legal, cookie banner
│   ├── dashboard/      panel protegido (patients, plans, agenda, recetas, ajustes, admin)
│   ├── p/              rutas públicas paciente
│   └── api/            17 endpoints
├── components/
│   ├── ui/             shadcn/ui
│   ├── pdf/            NutritionPlanPDF.tsx
│   ├── skeletons/      loading states reutilizables
│   ├── patients/       ConsentForm.tsx
│   └── PaywallModal.tsx  muro freemium (createPatient, generate, swap-meal)
├── features/
│   ├── account/        get-user, get-session, get-customer-id, get-or-create-customer, get-user-subscription
│   ├── pricing/        plans-config.ts (DIETLY_PLANS, SoT), components/pricing-section.tsx
│   └── emails/         welcome, beta-welcome, onboarding-welcome, patient-welcome, plan-ready
├── libs/
│   ├── ai/             plan-prompts, pseudonymize, resilience, logger
│   ├── anthropic/      client.ts (singleton)
│   ├── auth/           intake-tokens.ts, plan-tokens.ts (HMAC-SHA256)
│   ├── supabase/       server-client, middleware-client, admin, types.ts
│   ├── stripe/         stripe-admin.ts
│   ├── resend/         resend-client.ts
│   ├── validation/     nutrition-validator.ts (19 checks clínicos)
│   └── shopping-list.ts
├── types/dietly.ts
└── utils/              cn, calc-targets, get-env-var
```

---

## Migraciones (41 en `supabase/migrations/`)

init→Stripe boilerplate (legacy, mayoría obsoleto tras Sprint 5) · 001→schema core · 002→subscription_status · 003→appointments · 004→intake_forms · 005→plan_status_enum · 006→logo_url · 007→meeting_url · 008→professional_identity · 009→onboarding · 010→patient_progress · 011→beta_whitelist · 014→brand_settings · 015→brand_visited · 016→ai_request_logs · 017/024→patient_consents · 018→data_rights_requests · 019→validation_acked · 020→audit_logs · 021→rls_hardening+followup · 022→plan_rate_limit · 023→ai_literacy · 025/029→fix_audit_trigger · 026→phone+recipes · 027→plan_views · 028→intake_filled_by · 030→dietary_restrictions_array · 031→primary_color · 032→plan_views_rls · 033→pdf_cache · 034→meal_swaps · 035→allow_meal_swaps · 036→nutritionist_photos_bucket · 037→meal_swaps_status · 038→progress_enhancements · **039→stripe_customer_id a profiles** · **040→stripe_price_id a profiles**

---

## Estado actual

**Semana**: 13+ (post-beta, launch-ready)
**Estado**: Stripe LIVE operativo, Modelo B freemium funcionando, 0 clientes de pago reales todavía (pre-lanzamiento, outreach pendiente). Sprints 1-5 completados. Último commit: b0dbc28.

**Completado**: Auth + onboarding (2-3 pasos, sin primer paciente) · CRUD pacientes + intake + seguimiento · Generación IA día a día · Intercambio de platos (paciente → nutricionista, `meal_swaps`) · Editor plan + validación clínica (19 checks) · PDF server-side + caché · Email Resend (templates ES) · PWA paciente `/p/[token]` · Panel admin beta · RGPD (consentimientos, ARCO, audit logs, rate limiting) · **Modelo B freemium + PaywallModal** · **Stripe LIVE con `profiles` como SoT** · Auditoría completa Sprints 1–5 (abr 2026)

**Deuda técnica**:
- ~46 `as any` restantes (no críticos)
- 92 queries Supabase sin abstracción
- Art. 28.3 T&Cs incompleta (ok para beta, no para escalar)

**Próximos pasos**:
1. Cláusula Art. 28.3 RGPD completa en T&Cs
2. Plantilla consentimiento informado descargable
3. Fotos de comida con Nano Banana 2 (post-launch)
4. BEDCA integrada (post-launch)

---

## Sesión 1 abril 2026 — Auditoría y fixes aplicados

**Sprint 1 — Seguridad**: `/api/health` no expone keys · XSS sanitizado en emails (`escapeHtml`) · HMAC-SHA256 en tokens `/p/[token]` · RLS en `plan_views` (migración 032) · Auth en `/api/meal-image` · Endpoints test bloqueados en producción · Headers HSTS + CSP en `next.config.js`

**Sprint 2 — Rendimiento**: `force-dynamic` eliminado del root layout · `error.tsx` creados (global, dashboard, PWA) · Storage downloads en `Promise.all` · Caché PDF con `pdf_generated_at` (migración 033)

**Sprint 3 — Validación**: Zod en 5 rutas API críticas · Rate limiting real (10 planes/día Básico, 30/día Pro) · Verificación consentimiento `ai_processing` antes de Claude · AbortController + timeout 5 min + reconexión SSE

**Sprint 4 — UX**: 4 `loading.tsx` con skeletons · Header branding nutricionista en PWA · Cookie banner no bloqueante (slide-up, 600ms delay) · 8 queries dashboard → `Promise.all` paralelo

**Sprint 5 — Monetización + limpieza**: Modelo B freemium (límite 2 pacientes sin suscripción) · `PaywallModal` integrado en `createPatient`, `/api/plans/generate` y `/api/plans/swap-meal` · Banner de bienvenida en `/dashboard` · Stripe LIVE · Webhook refactor (escribe `stripe_customer_id` + `subscription_status` + `stripe_price_id` en `profiles`) · Migraciones 039 (stripe_customer_id) y 040 (stripe_price_id) · `get-user-subscription.ts` nuevo (deriva `isActive`/`isPro` de `profiles`) · Erradicación del boilerplate `next-supabase-stripe-starter`: eliminadas tablas `customers`/`products`/`prices`/`subscriptions` nunca usadas, rutas `(account)/`, 3 archivos `upsert-*.ts`, `get-products.ts`, `get-subscription.ts`, `price-card.tsx`, `create-checkout-action.ts`, `product-metadata.ts`, `types.ts` · `DIETLY_PLANS` como fuente única (`features/pricing/plans-config.ts`) · `autoComplete` añadido a todos los formularios auth · Resend como SMTP de Supabase Auth con templates en español · Logos actualizados (`logo.png`, `logo-email.png`, `favicon.svg`) · Onboarding reducido (paso "primer paciente" eliminado)

**Infra**: bucket `plan-pdfs` (privado) · `PLAN_TOKEN_SECRET` · `STRIPE_PRICE_BASICO_ID` + `STRIPE_PRICE_PRO_ID` en Vercel + .env.local

---

## GTM — Primeros 10 clientes

1. **Lista de espera** dietly.es — copy: "¿Tardas >30 min en un plan? Dietly lo genera en 2 min. Únete a los primeros 50."
2. **LinkedIn outreach** — 20-30 conexiones/día, ofrecer 6 meses gratis a cambio de 15 min feedback
3. **CODiNuCoVa** — 1.226 colegiados Valencia, licencias gratuitas a cambio de newsletter
4. **Instagram DM** — nutricionistas 10K-100K seguidores, acceso vitalicio a cambio de story
5. **Grupos FB/WhatsApp** nutricionistas — 10 beta testers

No hacer en fase early: Google Ads, SEO, Product Hunt.

Análisis competitivo (12 softwares): `.agents/product-marketing-context.md`

---

## Scripts npm

```bash
npm run dev            # Turbopack
npm run build          # Build estricto
npm run generate-types # Regenerar types.ts desde Supabase
npm run migration:up   # Migraciones + regenerar types
npm run test:e2e       # Playwright
npm run stripe:listen  # Webhooks local
```

---

## Skills UI — LEER SIEMPRE antes de tocar cualquier componente visual

1. `.agents/skills/UI UX Pro Max/SKILL.md`
2. `.agents/skills/frontend-design/SKILL.md`
3. `.agents/skills/polish/SKILL.md`
4. `.agents/skills/animate/SKILL.md` — si hay animaciones
5. `.agents/skills/colorize/SKILL.md` — si hay cambios de color

Marketing: `.agents/skills/competitive-ads-extractor.md` · `.agents/skills/lead-research-assistant.md` · `.agents/skills/meta-ads-analyzer.md`

---

## Verificación obligatoria en cada endpoint nuevo

Antes de hacer commit de cualquier API route o server action nueva, verificar siempre:

1. **Rate limiting**: ¿tiene límite de peticiones por usuario/IP? Si no, añadirlo usando el patrón existente (consulta a Supabase con ventana de tiempo).

2. **Cuellos de botella DB**:
   - ¿Hay queries N+1? (queries dentro de loops)
   - ¿Se usa select('*') cuando solo hacen falta algunos campos?
   - ¿Las columnas filtradas en WHERE tienen índice en Supabase?
