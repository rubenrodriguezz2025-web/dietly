# architecture.md — Arquitectura técnica de Dietly

---

## Estructura de carpetas

```
dietly/
├── CLAUDE.md                    # Contexto para Claude Code (LEER PRIMERO)
├── architecture.md              # Este archivo
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Login, signup, reset password
│   │   ├── (marketing)/         # Landing, legal pages, cookie banner
│   │   ├── dashboard/           # Panel protegido (requiere auth)
│   │   │   ├── patients/        # CRUD pacientes
│   │   │   │   ├── new/
│   │   │   │   └── [id]/        # Tabs: Ficha, Cuestionario, Progreso, Seguimientos
│   │   │   ├── plans/[id]/      # Editor de planes + validación
│   │   │   ├── intercambios/    # Gestión de swaps pendientes
│   │   │   ├── agenda/          # Calendario de citas
│   │   │   ├── recetas/         # Recetario personal
│   │   │   ├── ajustes/         # Perfil + branding + billing
│   │   │   ├── derechos-datos/  # Solicitudes ARCO (RGPD)
│   │   │   └── admin/beta/      # Panel admin beta
│   │   ├── p/                   # Rutas públicas paciente
│   │   │   ├── [token]/         # PWA plan del paciente
│   │   │   ├── intake/[token]/  # Cuestionario intake
│   │   │   └── seguimiento/[token]/
│   │   ├── api/                 # 21 endpoints (ver CLAUDE.md)
│   │   │   ├── plans/           # generate (SSE), status, pdf, pwa-pdf, swap-meal, confirm-swap, swap-action
│   │   │   ├── patients/[id]/   # delete, export
│   │   │   ├── stripe/          # checkout, portal, webhook
│   │   │   ├── intake/submit/
│   │   │   ├── followup/submit/
│   │   │   ├── pdf/preview/
│   │   │   ├── data-rights/
│   │   │   ├── meal-image/
│   │   │   └── health/
│   │   └── layout.tsx
│   ├── features/
│   │   ├── account/             # User, session, subscription controllers
│   │   ├── pricing/             # Checkout + pricing section
│   │   └── emails/              # welcome.tsx, beta-welcome.tsx
│   ├── libs/
│   │   ├── supabase/            # server-client, middleware-client, admin, types.ts
│   │   ├── anthropic/           # client.ts (singleton)
│   │   ├── ai/                  # plan-prompts, pseudonymize, resilience, logger
│   │   ├── auth/                # intake-tokens.ts, plan-tokens.ts (HMAC-SHA256)
│   │   ├── validation/          # nutrition-validator.ts (19 checks clínicos)
│   │   ├── resend/              # resend-client.ts
│   │   └── stripe/              # stripe-admin.ts
│   ├── components/
│   │   ├── ui/                  # shadcn/ui
│   │   ├── pdf/                 # NutritionPlanPDF.tsx
│   │   ├── skeletons/           # Loading states reutilizables
│   │   └── patients/            # ConsentForm.tsx
│   ├── config/                  # demo-mode.ts
│   ├── types/                   # dietly.ts
│   └── utils/                   # cn, calc-targets, get-env-var
├── supabase/
│   └── migrations/              # 38 SQL migrations (init → 038)
│       ├── 20240115041359_init.sql
│       ├── 001_initial_schema.sql → 033_pdf_cache.sql
│       ├── 034_meal_swaps.sql → 037_meal_swaps_status.sql
│       └── 038_progress_enhancements.sql
└── public/
    ├── fonts/                   # Fonts TTF para @react-pdf/renderer
    └── sitemap.xml              # 7 URLs indexadas
```

---

## Flujo de autenticación

```
Usuario → /login → Supabase Auth (email+password)
       → Supabase crea sesión → cookie httpOnly
       → middleware.ts verifica cookie en cada request protegida
       → Si no autenticado → redirect /login
       → Si autenticado → acceso a /dashboard/*
```

Middleware protege todas las rutas bajo `/(dashboard)/`.

RLS en Supabase asegura que aunque alguien manipule tokens, solo ve sus propios datos.

---

## Flujo de generación de plan con IA

```
1. Usuario click "Generar plan" en /patients/[id]
2. Frontend llama POST /api/plans/generate con { patientId }
3. API route:
   a. Obtiene datos del paciente desde Supabase
   b. Calcula TMB (Harris-Benedict) y TDEE según actividad
   c. Calcula objetivos de macros según objetivo del paciente
   d. Crea registro en nutrition_plans con status='generating'
   e. Para cada día (1-7):
      - Construye prompt con datos del paciente + días anteriores (resumen)
      - Llama a Claude API con Structured Outputs
      - Valida macros del día generado
      - Guarda día en plan_data (acumulativo)
      - Registra tokens en plan_generations
   f. Actualiza nutrition_plans con plan_data completo y status='draft'
4. Frontend muestra streaming de progreso (día 1/7, día 2/7...)
5. Plan aparece en /plans/[id] para revisión
```

**Manejo de errores**: si falla la generación de un día → reintentar hasta 2 veces ese día → si sigue fallando → status='error' + mensaje específico del día fallido.

---

## Flujo de PDF

```
1. Usuario aprueba plan → status='approved'
2. Usuario click "Generar PDF"
3. Frontend llama POST /api/plans/pdf con { planId }
4. API route:
   a. Obtiene plan_data y datos del nutricionista (logo, colores)
   b. Renderiza <NutritionPlanDocument> con renderToBuffer()
      → Si falla en Vercel: usar usePDF() hook client-side (plan B)
   c. Sube buffer a Supabase Storage en bucket privado
      Path: plans/{nutritionist_id}/{plan_id}.pdf
   d. Genera signed URL con expiración 7 días
   e. Guarda pdf_url en nutrition_plans
5. Frontend muestra botón "Descargar PDF" y "Enviar al paciente"
```

### Configuración crítica para @react-pdf/renderer en Next.js 15

```javascript
// next.config.js
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  // ...
}
```

Los componentes PDF NO pueden usar:
- Directiva `"use client"`
- React Context
- Hooks de React

---

## Flujo de email

```
1. Usuario click "Enviar al paciente"
2. Frontend llama POST /api/email/send-plan con { planId, patientEmail }
3. API route:
   a. Obtiene PDF de Supabase Storage (buffer)
   b. Envía email con Resend:
      - From: nutricionista@dietly.es (o dominio custom futuro)
      - To: email del paciente
      - Subject: "Tu plan nutricional de [nombre nutricionista]"
      - Body: React Email template con branding de Dietly
      - Attachment: PDF (base64, max 40MB)
   c. Actualiza nutrition_plans con sent_at
```

---

## Cálculo de macros (macro-calculator.ts)

```typescript
// TMB Harris-Benedict revisada (Mifflin-St Jeor más precisa)
function calculateBMR(weight: number, height: number, age: number, sex: 'male' | 'female'): number {
  if (sex === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  }
  return 10 * weight + 6.25 * height - 5 * age - 161
}

// Factor de actividad
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
}

// Distribución de macros por objetivo
const MACRO_DISTRIBUTION = {
  lose_weight:         { protein: 0.30, carbs: 0.40, fat: 0.30, caloric_deficit: -400 },
  maintain:            { protein: 0.25, carbs: 0.50, fat: 0.25, caloric_deficit: 0 },
  gain_muscle:         { protein: 0.30, carbs: 0.45, fat: 0.25, caloric_deficit: +300 },
  eat_healthy:         { protein: 0.25, carbs: 0.50, fat: 0.25, caloric_deficit: 0 },
  sports_performance:  { protein: 0.25, carbs: 0.55, fat: 0.20, caloric_deficit: 0 },
}
```

---

## RLS Policies (SQL)

```sql
-- Patrón base para todas las tablas del nutricionista
-- Usar (select auth.uid()) en lugar de auth.uid() para mejor performance

-- patients
CREATE POLICY "Nutricionistas ven sus propios pacientes" ON patients
  FOR ALL USING ((select auth.uid()) = nutritionist_id);

-- nutrition_plans
CREATE POLICY "Nutricionistas ven sus propios planes" ON nutrition_plans
  FOR ALL USING ((select auth.uid()) = nutritionist_id);

-- profiles (el nutricionista solo ve y edita su propio perfil)
CREATE POLICY "Usuario ve su propio perfil" ON profiles
  FOR ALL USING ((select auth.uid()) = id);
```

---

## Sistema de branding en PDFs

El nutricionista sube:
- **Logo**: imagen PNG/JPG → Supabase Storage bucket `logos/` → URL pública
- **Color primario**: hex color picker en settings
- **Nombre de la clínica**: texto

El PDF usa estos valores para:
- Header con logo + nombre clínica
- Color principal en títulos de sección y separadores
- Footer con nombre del nutricionista
- Página de portada personalizada

Si el plan es `básico` → logo de Dietly (no custom branding)
Si el plan es `profesional` → branding completo del nutricionista

---

## Decisiones técnicas tomadas y por qué

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Generar día por día (7 llamadas) | Una llamada plan completo | Evita truncamiento, mejor calidad en días finales |
| Structured Outputs (JSON garantizado) | Parsear JSON de texto libre | Cero errores de parsing, tipos TypeScript directos |
| Server Actions para mutaciones | API routes para todo | Menos boilerplate, mejor DX con Next.js 15 |
| Supabase Storage para PDFs | Cloudinary, S3 | Ya en el stack, signed URLs nativas, más simple |
| @react-pdf/renderer | Puppeteer/Playwright | Sin Chromium, funciona en Vercel serverless, PDFs vectoriales |
| Resend para emails | SendGrid, Nodemailer | Mejor DX, React Email nativo, ya en boilerplate |
| Plan básico limitado a 30 pacientes | Sin límite en básico | Incentiva upgrade, límite razonable para autónomos pequeños |

---

## Semanas de desarrollo planificadas

| Semana | Foco | Entregable |
|--------|------|------------|
| 1 | Setup: boilerplate + DB + auth + **test PDF en Vercel** | Proyecto deployado |
| 2 | CRUD pacientes completo | Dashboard con pacientes |
| 3 | Integración Claude API + generación planes | Primer plan generado |
| 4 | UI visualización/edición planes + PDF prototipo | Plan editable |
| 5 | PDF profesional con branding + Resend email | Flujo completo |
| 6 | Stripe subscriptions + gating de features | Pagos funcionales |
| 7 | Testing E2E + bug fixes + responsive | MVP estable |
| 8 | Producción + dominio + Stripe live + landing | **LAUNCH** |

---

## Test crítico semana 1: @react-pdf/renderer en Vercel

Crear API route mínima:
```typescript
// src/app/api/test-pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text } from '@react-pdf/renderer'

export async function GET() {
  const pdf = await renderToBuffer(
    <Document><Page><Text>Test PDF Dietly</Text></Page></Document>
  )
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  })
}
```

Deploy → hit `/api/test-pdf` → si devuelve PDF: ✅ continuar.
Si error React #31 o PDFDocument error → activar plan B (client-side `usePDF`).

**No construir nada más hasta confirmar esto funciona en producción.**
