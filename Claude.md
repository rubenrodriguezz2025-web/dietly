# CLAUDE.md — Contexto del proyecto Dietly

Lee este archivo COMPLETO antes de escribir cualquier código. Es tu memoria entre sesiones.

---

## ¿Qué es Dietly?

**Dietly** es un SaaS web para nutricionistas y dietistas autónomos españoles.

El nutricionista introduce los datos del paciente → la IA genera el plan nutricional completo en 2-5 minutos → el profesional revisa, ajusta y entrega un PDF con su marca.

**Propuesta de valor**: "Dietly genera el borrador del plan nutricional en 2 minutos. Tú lo revisas, ajustas y lo entregas con tu marca."

> ⚠️ **El copy SIEMPRE menciona revisión profesional.** Nunca decir que la IA "hace el plan" — es un requisito de posicionamiento Y legal. El flujo `draft → approved` no es solo UX, es la cobertura legal del producto.

---

## Público objetivo

- Nutricionistas y dietistas autónomos en España
- Especialidades: pérdida de peso, alimentación saludable, nutrición deportiva básica
- Perfil: trabajan solos, 20-60 pacientes activos, sensibles al precio
- Dolor: crear planes manualmente toma 1-3 horas por paciente
- Mercado: ~8.075 dietistas-nutricionistas colegiados en España (CGCODN, 2024)

---

## Stack técnico

```
Frontend:    Next.js 15 (App Router)
Auth + DB:   Supabase (PostgreSQL + Row Level Security)
Pagos:       Stripe (suscripciones mensuales)
IA:          Anthropic Claude API (claude-sonnet-4-6)
PDF:         @react-pdf/renderer
Email:       Resend + React Email
UI:          shadcn/ui + Tailwind CSS
Deploy:      Vercel
```

**Boilerplate base**: `github.com/KolbySisk/next-supabase-stripe-starter`
Ya incluye: auth, Stripe webhooks, sincronización Stripe↔Supabase, React Email + Resend.

---

## Planes de precio

| Plan | Precio | Límite |
|------|--------|--------|
| Básico | €46/mes | 30 pacientes activos |
| Profesional | €89/mes | Ilimitado + PDF branding personalizado (logo propio) |

> Precios confirmados en código (T&Cs, landing) y en Stripe. IVA incluido al 21%.
> El campo `subscription_status` en `profiles` refleja el estado Stripe via webhook.
> La distinción Básico/Pro en el PDF se detecta por el nombre del producto Stripe
> (contiene "pro" o "profesional"). TODO: comparar por price_id cuando estén en `.env`.

---

## Schema de base de datos (tablas reales — 22 tablas)

> Tipos generados automáticamente en `src/libs/supabase/types.ts` con `npm run generate-types`.

### `profiles` (extensión de auth.users)
```sql
id uuid references auth.users
full_name text
specialty specialty_type  -- 'weight_loss' | 'sports' | 'clinical' | 'general'
clinic_name text
logo_url text
primary_color text  -- hex, default '#1a7a45', para PDF branding
college_number text  -- nº colegiado
signature_url text
subscription_status text  -- synced from Stripe webhook
onboarding_completed_at timestamptz  -- NULL = onboarding pendiente
show_macros boolean
show_shopping_list boolean
welcome_message text
font_preference text  -- 'clasica' | 'moderna' | 'minimalista'
profile_photo_url text
brand_settings_visited_at timestamptz
ai_literacy_acknowledged_at timestamptz  -- RGPD Art. 22 LSSI
created_at timestamptz
updated_at timestamptz
```

### `patients`
```sql
id uuid
nutritionist_id uuid references profiles(id)
name text
email text
phone text
date_of_birth date
sex text  -- 'male' | 'female'
weight_kg numeric
height_cm numeric
activity_level activity_level_type  -- 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
goal patient_goal_type  -- 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'health'
dietary_restrictions text[]  -- ['gluten_free', 'lactose_free', 'vegan', 'vegetarian', ...]
allergies text[]
intolerances text[]
preferences text  -- texto libre
medical_notes text  -- texto libre
tmb numeric  -- tasa metabólica basal (Mifflin-St Jeor)
tdee numeric  -- gasto energético total
intake_token uuid  -- token público para cuestionario
created_at timestamptz
updated_at timestamptz
```

### `nutrition_plans`
```sql
id uuid
patient_id uuid references patients(id)
nutritionist_id uuid references profiles(id)
status plan_status_type  -- 'generating' | 'draft' | 'approved' | 'sent' | 'error'
content jsonb  -- el plan completo en JSON (ver estructura abajo)
week_start_date date
patient_token uuid  -- token público para vista paciente /p/[token]
sent_at timestamptz
approved_at timestamptz
approved_by uuid  -- audit trail
generated_at timestamptz
ai_model text
validation_acked_blocks text[]  -- alertas reconocidas antes de aprobar
created_at timestamptz
updated_at timestamptz
```

### `plan_generations` (log de costes IA por día)
```sql
id uuid
plan_id uuid references nutrition_plans(id)
nutritionist_id uuid references profiles(id)
day_number int  -- 1-7
status generation_status_type  -- 'pending' | 'generating' | 'completed' | 'failed'
content jsonb
error text
created_at timestamptz
updated_at timestamptz
```

### Tablas adicionales implementadas

| Tabla | Migración | Propósito |
|-------|-----------|-----------|
| `appointments` | 003 | Agenda del nutricionista (presencial/online) |
| `intake_forms` | 004 | Cuestionarios de pacientes (filled_by: patient/nutritionist) |
| `patient_progress` | 010 | Seguimiento antropométrico (peso, grasa, cintura) |
| `beta_whitelist` | 011 | Lista de acceso beta con plan_limit |
| `ai_request_logs` | 016 | Log de llamadas a Anthropic (pseudonymized, sin PII) |
| `patient_consents` | 017/024 | Consentimiento RGPD Art. 9 (ai_processing) |
| `data_rights_requests` | 018 | Solicitudes ARCO (acceso, rectificación, supresión...) |
| `audit_logs` | 020 | Audit trail RGPD con triggers automáticos (5 años retención) |
| `followup_forms` | 021 | Formularios de seguimiento |
| `followup_reminders` | 021 | Recordatorios de seguimiento |
| `plan_access_attempts` | 022 | Rate limiting por IP (10 intentos/15 min) |
| `recipes` | 026 | Recetario personal del nutricionista |
| `plan_views` | 027 | Lectura de recepción (first_opened, open_count) |
| `customers` / `products` / `prices` / `subscriptions` | init | Stripe sync (del boilerplate) |

---

## Compliance legal — RGPD y Ley 44/2003

### Marco legal relevante
- **Ley 44/2003 (LOPS)**: regula quién puede ejercer nutrición clínica (D-N titulado + colegiado). Dietly como herramienta para profesionales **no tiene ningún problema legal** — igual que un CRM médico.
- **LOPDGDD + RGPD**: los datos de salud son "categoría especial" — máximo nivel de protección. Dietly actúa como **encargado del tratamiento**; el nutricionista es el **responsable**.
- **Ley 41/2002**: obliga al nutricionista a mantener historia clínica por paciente (Dietly lo cubre con la ficha de paciente).

### Estado de los documentos legales (revisado marzo 2026)

**T&Cs** (`/legal/terminos`): 10 secciones. La sección 8 referencia Art. 28 RGPD.
**Privacidad** (`/legal/privacidad`): 11 secciones. La sección 2 establece la relación encargado/responsable.

**LO QUE ESTÁ CUBIERTO ✅**
- Art. 28 RGPD mencionado en T&Cs (sección 8) y desarrollado en Privacidad (sección 2)
- Sub-encargados listados (Supabase, Stripe, Resend, Anthropic, Vercel)
- Derechos RGPD del usuario: acceso, rectificación, supresión, portabilidad, oposición
- Reclamación ante la AEPD
- Plazo de conservación (30 días tras cancelación)
- IVA 21% mencionado en T&Cs (sección 4)
- Precios correctos: 46€ Básico / 89€ Pro

**LO QUE FALTA PARA Art. 28.3 RGPD COMPLETO ⚠️ (antes de escalar)**
El Art. 28.3 exige que el contrato responsable→encargado especifique **explícitamente**:
- a) Tratar datos solo por instrucciones documentadas del responsable
- b) Confidencialidad del personal autorizado
- c) Implementar medidas de seguridad (Art. 32)
- d) No subcontratar sin autorización previa por escrito del responsable
- e) Asistir al responsable para atender derechos ARCO de los interesados
- f) Asistir al responsable en obligaciones Arts. 32-36 (notificación brechas, EIPD)
- g) Devolver o destruir datos al finalizar el contrato
- h) Facilitar auditorías e inspecciones
→ TODO: añadir sección "Cláusula de encargado del tratamiento (Art. 28.3 RGPD)" en T&Cs
  con las letras a-h. Para primeros 10 clientes es suficiente el estado actual.

### Obligaciones del producto
1. **Cláusula Art. 28.3 completa** en T&Cs — añadir antes de escalar (ver ⚠️ arriba).
2. **Consentimiento RGPD del paciente** — el nutricionista es responsable de obtenerlo; Dietly debe facilitar una plantilla de consentimiento informado descargable.
3. **Derecho al olvido** — endpoint o botón para borrar todos los datos de un paciente (RGPD Art. 17).
4. **Exportación de datos** — exportar ficha completa de paciente en JSON/PDF (RGPD Art. 20).
5. **Cifrado en reposo** — Supabase lo gestiona por defecto. Documentarlo en Privacy Policy.

### IVA
- La **suscripción a Dietly** tributa al **21% IVA** (software SaaS, tipo general).
- Los servicios del nutricionista a sus pacientes están exentos de IVA — no es problema de Dietly.

---



```
1. Nutricionista se registra → onboarding (nombre, especialidad, logo, colores)
2. Crea paciente → formulario con datos básicos y nutricionales
3. Genera plan → llama a Claude API → streaming UI muestra progreso
4. Revisa plan en editor → puede editar texto de comidas manualmente
5. Genera PDF → @react-pdf/renderer server-side → se guarda en Supabase Storage
6. Envía al paciente → email con Resend con PDF adjunto
```

---

## Generación de planes con IA

**Modelo**: `claude-sonnet-4-6` con Structured Outputs (JSON garantizado)
**Estrategia**: generar **día por día** (7 llamadas separadas), no el plan completo de golpe
**Estimación de coste**: ~$0.10-0.50 por plan completo

### Estructura JSON del plan (plan_data en DB)
```json
{
  "week_summary": {
    "target_daily_calories": 1800,
    "target_macros": { "protein_g": 130, "carbs_g": 200, "fat_g": 65 },
    "weekly_averages": { "calories": 1785, "protein_g": 128, "carbs_g": 198, "fat_g": 64 }
  },
  "days": [
    {
      "day_number": 1,
      "day_name": "Lunes",
      "total_calories": 1790,
      "total_macros": { "protein_g": 129, "carbs_g": 199, "fat_g": 63 },
      "meals": [
        {
          "meal_type": "desayuno",
          "meal_name": "Tostadas con aguacate y huevo",
          "time_suggestion": "08:00",
          "calories": 420,
          "macros": { "protein_g": 22, "carbs_g": 38, "fat_g": 18 },
          "ingredients": [
            { "name": "Pan de centeno", "quantity": 60, "unit": "g" },
            { "name": "Aguacate", "quantity": 80, "unit": "g" },
            { "name": "Huevo", "quantity": 2, "unit": "unidades" }
          ],
          "preparation": "Tostar el pan, aplastar el aguacate con sal y limón, colocar los huevos pochados encima.",
          "notes": ""
        }
      ]
    }
  ],
  "shopping_list": {
    "produce": ["Aguacate x4", "Tomates cherry 500g", "Espinacas bolsa 300g"],
    "protein": ["Pechuga de pollo 600g", "Huevos docena", "Salmón 400g"],
    "dairy": ["Yogur griego 0% x6", "Queso fresco 250g"],
    "grains": ["Pan de centeno 400g", "Avena 500g", "Arroz integral 1kg"],
    "pantry": ["Aceite de oliva virgen extra", "Legumbres cocidas bote"]
  }
}
```

---

## Reglas de desarrollo

### Convenciones de código
- **TypeScript estricto** en todo. Sin `any`.
- **Zod** para validación de todos los inputs (formularios y API routes)
- **Server Actions** de Next.js 15 para mutaciones, no fetch desde cliente cuando sea posible
- Estructura de carpetas: feature-based (`src/features/patients/`, `src/features/plans/`, etc.)
- Cada feature tiene: `components/`, `actions/`, `models/`, `utils/`

### Supabase y seguridad
- **RLS activado en TODAS las tablas** desde el primer día
- Patrón RLS: `(select auth.uid()) = nutritionist_id` (usar select para performance)
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- Usar `@supabase/ssr` para cookies en App Router

### IA y Claude API
- Usar `claude-sonnet-4-6` siempre (no cambiar sin consenso)
- Structured Outputs con Pydantic/Zod para JSON garantizado
- Generar día por día (7 llamadas), no el plan completo
- Siempre capturar `tokens_used` y guardar en `plan_generations`
- Timeout de API: 30 segundos por día generado
- Manejar errores de API gracefully (reintentar día fallido, no el plan completo)

### PDF
- **CRÍTICO**: testar `@react-pdf/renderer` en Vercel desplegado el DÍA 1
- Si falla server-side, usar `usePDF` hook client-side como fallback
- Fonts locales en `/public/fonts/` (nunca Google Fonts CDN en PDF)
- Generar PDF solo cuando el plan esté en status `approved`
- Cachear PDF en Supabase Storage (no regenerar si no hay cambios)

### No hacer en el MVP
- ❌ Recálculo automático de macros al editar ingredientes
- ❌ Base de datos USDA/BEDCA integrada (próxima versión)
- ❌ App móvil nativa (iOS/Android) — ver PWA abajo
- ❌ Cuentas de equipo / multi-nutricionista
- ❌ Historial de progreso del paciente
- ❌ OAuth social (solo email/password en MVP)
- ❌ Plan anual en Stripe
- ❌ Templates de dieta preconfigurados (keto, vegano, etc.)
- ❌ Integración con wearables (Strava, Apple Health)
- ❌ Chat en tiempo real con paciente

### PWA para el paciente ✅ IMPLEMENTADA
- URL única por plan: `/p/[token]` — sin login requerido para el paciente
- El paciente recibe el link por email y puede "añadir a pantalla de inicio" desde Safari/Chrome
- Muestra: plan semanal con kcal/macros por comida, lista de compra interactiva, botón compartir (WhatsApp/email)
- Dark mode automático (detecta preferencia del sistema), swipe entre días en móvil
- `public/manifest.json` + `public/sw.js` con estrategia network-first para planes, cache-first para assets estáticos
- Archivos: `pwa-shell.tsx`, `visor-dias.tsx`, `navegador-dias.tsx`, `lista-compra.tsx`, `boton-compartir.tsx`

---

## Variables de entorno necesarias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=

# Seguridad tokens
PLAN_TOKEN_SECRET=          # HMAC-SHA256 para tokens /p/[token]
```

---

## Go-to-market — primeros 10 clientes

**Canales validados por orden de prioridad:**

1. **Lista de espera en dietly.es** — abrir YA, antes de lanzar. Copy: *"¿Tardas más de 30 min en un plan nutricional? Dietly lo genera en 2 minutos. Únete a los primeros 50 nutricionistas que lo probarán gratis."* Límite artificial de 50 plazas.

2. **LinkedIn outreach directo** — buscar "dietista-nutricionista" en España, conectar con 20-30/día, mensaje de 3 líneas ofreciendo 15 min de feedback a cambio de 6 meses gratis.

3. **CODiNuCoVa** (Colegio Oficial Valencia) — ventaja local directa. Contactar para presentar Dietly a sus 1.226 colegiados. Ofrecer licencias gratuitas permanentes a cambio de visibilidad en newsletter.

4. **Instagram nutricionistas** — DM a nutricionistas españoles con 10K-100K seguidores ofreciendo acceso gratuito vitalicio a cambio de un story.

5. **Grupos Facebook/WhatsApp** de nutricionistas españoles — post auténtico buscando 10 beta testers.

**No hacer en fase early**: Google Ads, SEO, Product Hunt (mercado anglosajón, demasiado lento).

> **Análisis competitivo**: 12 softwares analizados en `.agents/product-marketing-context.md`. Competidores principales: Nutrium (Portugal, sin IA), NutriAdmin (España/UK, UX anticuada), Dietopro (España, IA básica), INDYA (España, foco en seguimiento). Ventaja diferencial de Dietly: IA generativa real + PDF branding desde básico + PWA con macros por comida + precio para autónomos españoles.

---

## Migraciones de base de datos

Total: **34 migraciones** en `supabase/migrations/`.

| # | Archivo | Descripción |
|---|---------|-------------|
| init | `20240115041359_init.sql` | Schema Stripe del boilerplate (customers, products, prices, subscriptions) |
| 001 | `001_initial_schema.sql` | Schema core: profiles, patients, nutrition_plans, plan_generations + enums + RLS |
| 002 | `002_subscription_status.sql` | Campo subscription_status en profiles (sync Stripe) |
| 003 | `003_appointments.sql` | Tabla appointments (agenda nutricionista) |
| 004 | `004_intake_forms.sql` | intake_token en patients + tabla intake_forms |
| 005 | `005_plan_status_enum.sql` | Añade 'generating' y 'error' a plan_status_type |
| 006 | `006_logo_url.sql` | Campo logo_url + bucket Storage nutritionist-logos |
| 007 | `007_appointments_meeting_url.sql` | Campo meeting_url en appointments |
| 008 | `008_professional_identity.sql` | college_number, signature_url + bucket nutritionist-signatures |
| 009 | `009_onboarding.sql` | Campo onboarding_completed_at en profiles |
| 010 | `010_patient_progress.sql` | Tabla patient_progress (seguimiento antropométrico) |
| 011 | `011_beta_access.sql` | Tabla beta_whitelist |
| 014 | `014_brand_settings.sql` | Campos de branding: show_macros, show_shopping_list, welcome_message, font_preference |
| 015 | `015_brand_visited.sql` | Campo brand_settings_visited_at |
| 016 | `016_ai_request_logs.sql` | Tabla ai_request_logs (audit IA, pseudonymized) |
| 017 | `017_patient_consents.sql` | Tabla patient_consents (RGPD Art. 9) |
| 018 | `018_data_rights_requests.sql` | Tabla data_rights_requests (ARCO) |
| 019 | `019_plan_validation_acked.sql` | Campo validation_acked_blocks en nutrition_plans |
| 020 | `020_audit_logs.sql` | Tabla audit_logs + trigger fn_audit_log() en 4 tablas |
| 021 | `021_rls_hardening.sql` | Hardening RLS + RPC get_plan_by_patient_token + followup_forms/reminders |
| 022 | `022_plan_rate_limit.sql` | Tabla plan_access_attempts (rate limiting) |
| 023 | `023_ai_literacy.sql` | Campo ai_literacy_acknowledged_at (RGPD Art. 22) |
| 024 | `024_patient_consents.sql` | Recreación idempotente de patient_consents |
| 025 | `025_fix_audit_trigger.sql` | Fix BEGIN/EXCEPTION en fn_audit_log() |
| 026a | `026_patient_phone.sql` | Campo phone en patients |
| 026b | `026_recipes.sql` | Tabla recipes (recetario personal) |
| 027 | `027_plan_views.sql` | Tabla plan_views (lectura de recepción) |
| 028 | `028_intake_filled_by.sql` | Campos filled_by + filled_at en intake_forms |
| 029 | `029_fix_audit_trigger_safe.sql` | Fix nested exceptions en fn_audit_log() |
| 030 | `030_dietary_restrictions_array.sql` | Conversión dietary_restrictions de text a text[] |
| 031 | `031_profiles_primary_color.sql` | Campo primary_color en profiles (default '#1a7a45') |
| 032 | `032_plan_views_rls.sql` | RLS en plan_views (A-01) |
| 033 | `033_pdf_cache.sql` | Columna pdf_generated_at en nutrition_plans (caché PDF) |

---

## Rutas de la aplicación

### Dashboard (protegido — requiere auth)
| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel principal con pacientes y métricas |
| `/dashboard/patients/new` | Crear paciente |
| `/dashboard/patients/[id]` | Ficha de paciente (tabs: Ficha, Cuestionario, Progreso, Seguimientos) |
| `/dashboard/plans/[id]` | Editor de plan nutricional (día a día, macros, comidas) |
| `/dashboard/agenda` | Agenda de citas (presencial/online) |
| `/dashboard/recetas` | Recetario personal del nutricionista |
| `/dashboard/ajustes` | Configuración: perfil, marca, logo, firma |
| `/dashboard/derechos-datos` | Panel RGPD: solicitudes ARCO |
| `/dashboard/admin/beta` | Panel admin: métricas beta, whitelist, costes en € |

### Rutas públicas del paciente
| Ruta | Descripción |
|------|-------------|
| `/p/[token]` | Vista del plan nutricional (sin login) |
| `/p/intake/[token]` | Cuestionario de intake |
| `/p/seguimiento/[token]` | Formulario de seguimiento |

### API routes (17 endpoints)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/plans/generate` | POST | Genera plan con Claude API (día por día, SSE stream) |
| `/api/plans/[id]/status` | GET | Poll estado de generación |
| `/api/plans/[id]/pdf` | POST | Genera PDF con @react-pdf/renderer |
| `/api/pdf/preview` | POST | Preview del PDF |
| `/api/intake/submit` | POST | Envío de cuestionario paciente |
| `/api/followup/submit` | POST | Envío de seguimiento |
| `/api/patients/[id]/delete` | DELETE | Borrar paciente (RGPD Art. 17) |
| `/api/patients/[id]/export` | GET | Exportar datos paciente (RGPD Art. 20) |
| `/api/data-rights` | POST | Solicitudes ARCO |
| `/api/stripe/checkout` | POST | Crear sesión Stripe |
| `/api/stripe/portal` | POST | Portal de facturación |
| `/api/stripe/webhook` | POST | Webhook Stripe |
| `/api/webhooks` | POST | Webhooks generales |
| `/api/health` | GET | Health check |
| `/api/e2e-setup` | POST | Setup tests E2E |
| `/api/test-pdf` | POST | Test endpoint PDF (dev) |
| `/api/test-stream` | GET | Test SSE stream (dev) |

### Marketing y legal
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/pricing` | Página de precios |
| `/login` / `/signup` | Auth |
| `/forgot-password` / `/reset-password` | Recuperación |
| `/onboarding` | Onboarding post-registro |
| `/legal/terminos` | Términos y Condiciones |
| `/legal/privacidad` | Política de Privacidad |

---

## Funcionalidades implementadas

### Semana 1 — Auth y estructura
- ✅ Auth email/password con Supabase (login, signup, forgot/reset password)
- ✅ Onboarding post-registro (nombre, especialidad, clínica, logo, colores)
- ✅ RLS en todas las tablas
- ✅ Dashboard con sidebar navigation
- ✅ Stripe checkout + webhook sync (subscription_status)
- ✅ Banner de upgrade para plan básico

### Semana 2 — Pacientes
- ✅ CRUD completo de pacientes con validación Zod
- ✅ Ficha del paciente con tabs (Ficha, Cuestionario, Progreso, Seguimientos)
- ✅ Cuestionario de intake público (`/p/intake/[token]`) + pre-fill desde dashboard
- ✅ Formulario de seguimiento público (`/p/seguimiento/[token]`)
- ✅ Seguimiento antropométrico con gráficos (Recharts)
- ✅ Recordatorios de seguimiento (followup_reminders)
- ✅ Consentimiento RGPD del paciente (ai_processing)
- ✅ Campo `filled_by` en intake (patient vs nutritionist)
- ✅ Campo `phone` en pacientes
- ✅ Conversión `dietary_restrictions` de text a text[]

### Semana 3 — Generación IA
- ✅ Generación de planes día por día (7 llamadas a Claude API)
- ✅ Modelo: `claude-sonnet-4-6` con Structured Outputs (JSON garantizado)
- ✅ Pseudonymización de PII antes de enviar a Anthropic
- ✅ Log de tokens y costes en `ai_request_logs` y `plan_generations`
- ✅ Validación clínica con 19 checks (nutrition-validator.ts)
- ✅ Editor de plan: editar comidas, macros, ingredientes por día
- ✅ Aprobar plan con acknowledgement de alertas bloqueantes
- ✅ Regenerar día individual
- ✅ AI literacy acknowledgement (RGPD Art. 22)
- ✅ Resilience: reintentos, timeouts, error handling

### Semana 4 — PDF, email, beta
- ✅ PDF con @react-pdf/renderer server-side en Vercel (funciona)
- ✅ 3 fuentes: Inter (minimalista), Lora (clásica), Poppins (moderna)
- ✅ PDF personalizado: logo, firma, foto, color primario, nº colegiado
- ✅ show_macros / show_shopping_list configurables
- ✅ Vista pública del plan `/p/[token]` con navegador de días
- ✅ Envío de plan por email (Resend + PDF adjunto)
- ✅ Email de bienvenida beta automático al añadir a whitelist
- ✅ Panel admin beta (`/dashboard/admin/beta`): métricas por usuario (planes, tokens, coste €), whitelist
- ✅ Lectura de recepción (`plan_views`: first_opened, last_opened, open_count)
- ✅ Recetario personal (`/dashboard/recetas`): CRUD de recetas propias
- ✅ Agenda de citas (`/dashboard/agenda`): presencial/online, meeting_url
- ✅ Panel de derechos de datos (`/dashboard/derechos-datos`): solicitudes ARCO
- ✅ Audit logs automáticos con triggers en patients, plans, consents, intake
- ✅ Rate limiting en acceso a planes (10 intentos/15 min por IP)
- ✅ Cookie banner RGPD compliant: opt-in explícito, Vercel Analytics condicional

### Post-semana 4 — UX, transparencia clínica y calidad
- ✅ **PWA completa**: manifest.json + sw.js, dark mode automático, swipe entre días en móvil
- ✅ **Suspense skeletons reutilizables**: `src/components/skeletons/` + loading.tsx en dashboard, patients/[id], plans/[id], agenda
- ✅ **MacroTransparencyCard**: tarjeta colapsable en ficha de paciente con TMB/TDEE/objetivo calórico/balance y distribución de macros por objetivo
- ✅ **CalcTargets extendido**: campos `tmb`, `tdee`, `calorie_balance` para transparencia en UI
- ✅ **Corrección clínica TMB**: bug sexo 'other' corregido en new/actions.ts y update-actions.ts (usaba fórmula femenina, ahora usa promedio no binario base−78)
- ✅ **Revisión día a día con progreso visual** en generación de planes
- ✅ **Email beta mejorado**: copy renovado + pre-fill de email en URL de signup

### Optimizaciones de rendimiento
- ✅ **System prompt optimizado**: instrucciones fijas movidas a system prompt (reduce tokens ~20-30%)
- ✅ **Pre-filtrado de recetas**: recetas del nutricionista pre-filtradas antes de generar
- ✅ **Caché lista de compra por fingerprint**: no regenera si ingredientes no cambian
- ✅ **ignoreBuildErrors eliminado** de next.config.js (build estricto)
- ✅ **90+ `as any` corregidos** en rutas críticas (type safety)
- ✅ **Types.ts actualizado**: 22 tablas del schema generadas con `supabase gen types`

---

## Estructura de código

```
src/
├── app/
│   ├── (auth)/           # Login, signup, forgot/reset password
│   ├── (marketing)/      # Landing, legal, cookie banner
│   ├── dashboard/        # Panel principal (protegido)
│   │   ├── patients/     # CRUD pacientes + ficha con tabs
│   │   ├── plans/        # Editor de plan + acciones
│   │   ├── agenda/       # Agenda de citas
│   │   ├── recetas/      # Recetario personal
│   │   ├── ajustes/      # Configuración perfil + marca
│   │   ├── derechos-datos/ # Panel RGPD
│   │   └── admin/beta/   # Panel admin beta
│   ├── p/                # Rutas públicas paciente (plan, intake, seguimiento)
│   ├── plan/             # Vista de plan legacy
│   ├── api/              # 17 API routes
│   └── onboarding/       # Onboarding post-registro
├── components/
│   ├── ui/               # shadcn/ui (button, input, tabs, toast, sheet, etc.)
│   ├── pdf/              # NutritionPlanPDF.tsx (823 líneas)
│   ├── skeletons/        # dashboard-skeleton, patient-detail-skeleton, plan-viewer-skeleton
│   └── patients/         # ConsentForm.tsx
├── features/
│   ├── account/          # Controladores: user, session, subscription
│   ├── pricing/          # Componentes + acciones de checkout
│   └── emails/           # Templates: welcome.tsx, beta-welcome.tsx
├── lib/
│   ├── auth/             # intake-tokens.ts, plan-tokens.ts (HMAC-SHA256)
│   └── validation/       # nutrition-validator.ts (19 checks clínicos)
├── libs/
│   ├── ai/               # plan-prompts.ts, pseudonymize.ts, resilience.ts, logger.ts
│   ├── anthropic/        # client.ts (singleton SDK)
│   ├── supabase/         # server-client, middleware-client, admin, types.ts
│   ├── stripe/           # stripe-admin.ts
│   ├── resend/           # resend-client.ts
│   └── shopping-list.ts  # Agregación lista de compra por categoría
├── types/
│   └── dietly.ts         # Tipos compartidos del dominio
└── utils/                # cn.ts, calc-targets.ts, get-env-var.ts, etc.
```

---

## Herramientas de desarrollo

### Claude Code
- **Modelo por defecto**: Sonnet (rápido para tareas del día a día)
- **Opus** (`/model opus`): para auditorías complejas, refactors grandes, revisión legal
- **Skills de marketing** instaladas en `.agents/skills/` (37 skills)
- **Skills de UI/UX** en `.claude/skills/`: animate, colorize, frontend-design, polish
- **Skills adicionales**: nano-banana-2-skill (fotos de comida con IA), gsap-skills (animaciones GSAP)
- **Análisis competitivo**: `.agents/product-marketing-context.md` — 12 softwares analizados (Nutrium, NutriAdmin, Dietopro, INDYA y 8 más)
- **Lock file**: `skills-lock.json` (4 skills de pbakaus/impeccable)

### Scripts npm
```bash
npm run dev              # Next.js con Turbopack
npm run build            # Build de producción (estricto, sin ignoreBuildErrors)
npm run lint             # ESLint
npm run email:dev        # Preview emails en localhost:3001
npm run generate-types   # Regenerar types.ts desde Supabase
npm run migration:up     # Aplicar migraciones + regenerar types
npm run test:e2e         # Playwright E2E tests
npm run stripe:listen    # Escuchar webhooks Stripe en local
```

### Testing
- **E2E**: Playwright configurado (`playwright.config.ts`, `e2e/pdf.spec.ts`)
- **RLS**: `npm run test:rls` (tests de Row Level Security)

---

## Documentación adicional

| Archivo | Contenido |
|---------|-----------|
| `architecture.md` | Diagramas de flujo y decisiones técnicas |
| `OPTIMIZATION.md` | Auditoría de código (25 marzo 2026): 171 archivos, 26.611 LOC |
| `AUDITORIA_EXPERTOS.md` | Auditoría de 4 agentes: clínica, seguridad, UX, arquitectura |
| `AUDIT_COMPLETO.md` | Auditoría completa (35 hallazgos, 1 abril 2026) |
| `BUGS.md` | Lista de bugs conocidos |
| `MVP_FEATURES.md` | Checklist de features MVP |

---

## Estado actual del proyecto

**Semana**: 5 (post-launch beta)
**Estado**: MVP funcional desplegado en Vercel. Beta privada activa, objetivo 8 usuarios beta.

**Completado:**
- ✅ Semana 1: Auth, onboarding, Stripe, dashboard base
- ✅ Semana 2: CRUD pacientes, intake, seguimiento, progreso, RGPD
- ✅ Semana 3: Generación IA día por día, editor de plan, validación clínica
- ✅ Semana 4: PDF server-side, email, beta admin, recetario, plan_views
- ✅ Post-semana 4: PWA completa, Suspense skeletons, MacroTransparencyCard, corrección clínica TMB
- ✅ Auditoría de optimización (OPTIMIZATION.md)
- ✅ Auditoría de expertos (AUDITORIA_EXPERTOS.md)
- ✅ 90+ `as any` corregidos, ignoreBuildErrors eliminado
- ✅ 34 migraciones aplicadas
- ✅ Auditoría completa 1 abril 2026 (seguridad, rendimiento, validación, UX)

**Decisiones tomadas:**
- ✅ Análisis competitivo completo: 12 softwares analizados (ver `.agents/product-marketing-context.md`)
- ✅ Legal verificado — producto viable
- ✅ GTM definido — lista de espera + LinkedIn outreach + CODiNuCoVa
- ✅ PWA paciente en /p/[token] completamente implementada (manifest.json + sw.js + dark mode + swipe)
- ✅ @react-pdf/renderer funciona server-side en Vercel
- ✅ Fuentes locales en /public/fonts/ (Inter, Lora, Poppins, Merriweather)
- ✅ Bloqueo de menores < 18 años implementado (con mensaje de consentimiento parental)

**Deuda técnica conocida (ver OPTIMIZATION.md y AUDIT_COMPLETO.md):**
- ~46 `as any` restantes (reducidos desde 90+)
- `/src/lib/` y `/src/libs/` deberían consolidarse
- 52 archivos > 200 líneas (top: landing 883, PDF 788, generate 754)
- 92 queries Supabase sin capa de abstracción
- Sin tracking de micronutrientes (señalado en auditoría clínica)
- Detección plan Pro hardcoded por nombre Stripe (TODO: comparar por price_id)
- Art. 28.3 T&Cs incompleta (suficiente para beta, no para escalar)

**Próximos pasos (por prioridad):**
1. **Intercambio de platos** — el nutricionista puede sustituir una comida del plan por otra equivalente calórica/nutricionalmente (prioridad máxima, feature más demandada)
2. **Cláusula Art. 28.3 RGPD completa** en T&Cs (antes de escalar a 10+ clientes)
3. **Plantilla de consentimiento informado descargable** para que el nutricionista la entregue al paciente
4. **Fotos de comida con Nano Banana 2** (post-beta — skill instalada)
5. **BEDCA integrada** — base de datos española de composición de alimentos (post-beta)
6. **Rebranding a sabea.es / sabea.com** — nombre alternativo en evaluación (dominios pendientes de decisión)

Consultar `architecture.md` para diagramas de flujo y decisiones técnicas detalladas.

---

## Sesión 1 abril 2026 — Auditoría y fixes

Auditoría completa ejecutada en 4 sprints (ver `AUDIT_COMPLETO.md` para los 35 hallazgos originales).

### Migraciones ejecutadas
- `032_plan_views_rls.sql` ✅ — RLS en plan_views (A-01)
- `033_pdf_cache.sql` ✅ — columna `pdf_generated_at` en nutrition_plans

### Variables de entorno añadidas
- `PLAN_TOKEN_SECRET` — HMAC-SHA256 para tokens `/p/[token]` (Vercel + .env.local)

### Bucket Storage creado
- `plan-pdfs` (privado) — caché de PDFs generados

### Sprint 1 — Seguridad (commit `460e344`)
- C-03: `/api/health` no expone API keys
- C-02: XSS sanitizado en emails (`escapeHtml`)
- C-04: HMAC-SHA256 en tokens `/p/[token]` (plan-tokens.ts)
- A-01: RLS en `plan_views` (migración 032)
- A-06: Auth en `/api/meal-image`
- M-03: Endpoints test bloqueados en producción
- A-05: Headers HSTS + CSP en `next.config.js`

### Sprint 2 — Rendimiento (commit `ab4b7c4`)
- C-01: `force-dynamic` eliminado del root layout
- C-05: `error.tsx` creados (global, dashboard, PWA)
- A-10: Storage downloads en `Promise.all` (PDF paralelo)
- A-12: Caché PDF con `pdf_generated_at` (migración 033)

### Sprint 3 — Validación y protección (commit `f54e40f`)
- A-02: Zod en 5 rutas API críticas (generate, pdf, intake, followup, data-rights)
- A-03 + A-07: Rate limiting real (10 planes/día Básico, 30/día Pro)
- A-08: Verificación consentimiento `ai_processing` antes de llamar a Claude
- A-11: AbortController + timeout 5 min + reconexión SSE en generación

### Sprint 4 — UX/UI (commit `db6720c`)
- M-06: 4 `loading.tsx` con skeletons (patients/new, recetas, derechos-datos, admin/beta)
- M-08: Header branding nutricionista en PWA paciente (logo/inicial + clínica + primaryColor)
- M-07: Cookie banner no bloqueante con animación slide-up (ease-out-expo, 600ms delay)
- M-11: 8 queries secuenciales del dashboard → `Promise.all` paralelo
- B-07: No aplica (landing sin imágenes raster)

### Pendiente roadmap (no bloqueante para beta)
- ~46 `as any` restantes, consolidar `/src/lib/` + `/src/libs/`, centralizar detección plan Pro
- Art. 28.3 RGPD completa en T&Cs, audit logs en todas las tablas, retención `ai_request_logs` 90d
- Refactorizar archivos >400 líneas, logger estructurado, limpiar datos E2E en producción
