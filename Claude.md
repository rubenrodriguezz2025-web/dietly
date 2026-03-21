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
IA:          Anthropic Claude API (claude-sonnet-4-5)
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

## Schema de base de datos (tablas principales)

### `profiles` (extensión de auth.users)
```sql
id uuid references auth.users
full_name text
specialty text  -- 'weight_loss' | 'sports' | 'clinical' | 'general'
clinic_name text
logo_url text
primary_color text  -- hex, para PDF branding
subscription_tier text  -- 'basic' | 'professional'
stripe_customer_id text
created_at timestamptz
```

### `patients`
```sql
id uuid
nutritionist_id uuid references profiles(id)
full_name text
email text
birth_date date
sex text  -- 'male' | 'female'
weight_kg numeric
height_cm numeric
activity_level text  -- 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
goal text  -- 'lose_weight' | 'gain_muscle' | 'maintain' | 'eat_healthy' | 'sports_performance'
dietary_restrictions text[]  -- ['gluten_free', 'lactose_free', 'vegan', 'vegetarian', ...]
allergies text[]
intolerances text[]
preferences text  -- texto libre: "no le gusta el pescado azul"
medical_notes text  -- texto libre: "hipertensión controlada"
target_calories int
target_protein_g int
target_carbs_g int
target_fat_g int
created_at timestamptz
updated_at timestamptz
```

### `nutrition_plans`
```sql
id uuid
patient_id uuid references patients(id)
nutritionist_id uuid references profiles(id)
title text  -- "Plan semanal mayo 2026"
status text  -- 'generating' | 'draft' | 'approved' | 'sent'
plan_data jsonb  -- el plan completo en JSON (ver structure.md)
pdf_url text  -- Supabase Storage signed URL
generated_at timestamptz
approved_at timestamptz
sent_at timestamptz
claude_tokens_used int  -- para monitorizar costes
```

### `plan_generations` (log de costes IA)
```sql
id uuid
plan_id uuid references nutrition_plans(id)
nutritionist_id uuid references profiles(id)
day_generated int  -- 1-7, se genera día por día
tokens_input int
tokens_output int
cost_usd numeric
created_at timestamptz
```

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

**Modelo**: `claude-sonnet-4-5` con Structured Outputs (JSON garantizado)
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
- Usar `claude-sonnet-4-5` siempre (no cambiar sin consenso)
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

### PWA para el paciente (Semana 5 — obligatorio)
En lugar de app nativa, construir una **Progressive Web App** para que el paciente vea su plan:
- URL única por plan: `/p/[token]` — sin login requerido para el paciente
- El paciente recibe el link por email y puede "añadir a pantalla de inicio" desde Safari/Chrome
- Muestra: plan semanal con kcal/macros **visibles por comida** (el pain #1 de Nutrium), recetas con fotos, lista de compra
- Stack: página Next.js con `manifest.json` + `service-worker` básico → se comporta como app
- Coste de desarrollo: 1-2 días, no semanas de app nativa
- **No es opcional** — los testimonios de Dietopro confirman que la app del paciente es lo que más ayuda a conseguir clientes nuevos

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

---

## Estado actual del proyecto

## Estado actual del proyecto

**Semana**: 0 (setup inicial)
**Estado**: Listo para arrancar desarrollo

**Decisiones tomadas en investigación previa:**
- ✅ Análisis competitivo completo (Nutrium, NutriAdmin, Dietopro, INDYA)
- ✅ Legal verificado — producto viable, añadir T&Cs con cláusula RGPD encargado del tratamiento
- ✅ GTM definido — lista de espera + LinkedIn outreach + CODiNuCoVa
- ✅ App paciente → PWA en Semana 5 (no app nativa)

**Próximo paso**: Fork del boilerplate → test de @react-pdf/renderer en Vercel → schema de DB

Consultar `architecture.md` para diagramas de flujo y decisiones técnicas detalladas.
