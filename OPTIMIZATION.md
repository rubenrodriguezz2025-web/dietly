# Auditoría de Optimización — Dietly

**Fecha**: 2026-03-25
**Alcance**: 171 archivos TypeScript/TSX | 26.611 líneas de código
**Branch**: main

---

## 1. ESTRUCTURA ACTUAL

### Organización general: 7/10

El proyecto sigue un patrón **híbrido** App Router + feature-based que funciona bien para el tamaño actual. La estructura es clara y navegable.

**Lo que está bien:**
- Separación clara entre rutas públicas (`/p/`, marketing) y privadas (`/dashboard/`)
- Clientes centralizados en `/libs/` (Supabase, Anthropic, Stripe, Resend)
- Tipos compartidos en `/types/dietly.ts`
- Validación centralizada en `/lib/validation/nutrition-validator.ts`
- Prompts de IA centralizados en `/libs/ai/plan-prompts.ts`

**Lo que necesita mejora:**
- `/src/lib/` y `/src/libs/` coexisten — debería ser uno solo
- `/src/features/` solo tiene 3 módulos (account, pricing, emails) mientras que la lógica principal vive en `/src/app/dashboard/` — inconsistencia de patrón
- No hay capa de queries compartida para Supabase

### Archivos demasiado grandes (top 10)

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `(marketing)/page.tsx` | 883 | Landing monolítica |
| `pdf/NutritionPlanPDF.tsx` | 788 | Todo el PDF en un archivo |
| `api/plans/generate/route.ts` | 754 | Generación IA compleja |
| `patients/[id]/progress-tab.tsx` | 695 | Gráficos + formularios inline |
| `plans/[id]/plan-actions-bar.tsx` | 683 | 5 iconos SVG inline + lógica |
| `patients/[id]/PatientFichaTab.tsx` | 594 | Formulario médico completo |
| `plans/[id]/actions.ts` | 581 | Server actions del editor |
| `plan/[planId]/page.tsx` | 580 | Vista de plan |
| `ajustes/brand-settings.tsx` | 553 | Configuración de marca |
| `plans/[id]/send-plan-button.tsx` | 506 | Modal de envío |

**Total: 52 archivos superan las 200 líneas.**

### Código duplicado detectado

1. **Queries de Supabase repetidas**: 92 `.select()` dispersos en 42 archivos con patrones idénticos:
   - `.eq('nutritionist_id', user.id)` repetido 42+ veces
   - `.order('created_at', { ascending: false })` repetido 27+ veces
   - Misma query de paciente+planes en 10+ archivos

2. **Instanciación de Anthropic**: `new Anthropic()` creado en 5 archivos en vez de usar el singleton exportado en `/libs/anthropic/client.ts`

3. **Iconos SVG inline**: 5 iconos definidos inline en `plan-actions-bar.tsx` (líneas 16-66)

### Imports

- ESLint con `simple-import-sort` configurado — imports ordenados correctamente
- No se detectaron imports sin usar

---

## 2. OPTIMIZACIÓN DE TOKENS PARA CLAUDE CODE

### CLAUDE.md: 352 líneas — se puede reducir ~30%

**Secciones que se pueden extraer a archivos separados:**
- Ejemplo JSON de `plan_data` (40 líneas) → mover a `docs/PLAN_STRUCTURE.md`
- Sección "Go-to-market" (15 líneas) → no relevante para desarrollo, mover a `docs/GTM.md`
- Sección "Compliance legal" (45 líneas) → resumir en 10 líneas con enlace a `docs/LEGAL.md`
- Header "Estado actual" duplicado → eliminar redundancia

**Resultado estimado**: CLAUDE.md de ~250 líneas, más enfocado en lo que Claude necesita para codificar.

### Componentes que deberían dividirse para reducir contexto

Cuando Claude lee un archivo grande para editar 5 líneas, se gastan tokens innecesarios:

| Archivo actual | División propuesta |
|---|---|
| `NutritionPlanPDF.tsx` (788) | `PDFCover.tsx`, `PDFDayPage.tsx`, `PDFShoppingList.tsx`, `PDFStyles.ts` |
| `(marketing)/page.tsx` (883) | `HeroSection.tsx`, `FeaturesSection.tsx`, `TestimonialsSection.tsx`, `PricingSection.tsx` |
| `plan-actions-bar.tsx` (683) | Extraer iconos SVG a `/components/icons/`, separar lógica de estado |
| `progress-tab.tsx` (695) | `ProgressChart.tsx`, `ProgressForm.tsx`, `ProgressHistory.tsx` |
| `PatientFichaTab.tsx` (594) | `FichaPersonal.tsx`, `FichaNutricional.tsx`, `FichaMedica.tsx` |

**Impacto estimado**: Reducción de ~40% en tokens consumidos en tareas de edición sobre estos archivos.

---

## 3. OPTIMIZACIÓN DE RENDIMIENTO

### Supabase — Queries

| Problema | Archivo | Impacto | Esfuerzo |
|----------|---------|---------|----------|
| N+1: email del nutricionista | `followup/submit/route.ts` | +50ms/request | 30 min |
| Queries de conteo separadas | `dashboard/page.tsx` | +10-20ms | 1h |
| Reminder queries duplicables | `patients/[id]/page.tsx` | +10ms | 15 min |

**Recomendación**: Crear `/libs/supabase/queries/` con funciones tipadas reutilizables:
```typescript
getPatientWithPlans(supabase, patientId, nutritionistId)
getNutritionistPatients(supabase, userId, options?)
getNutritionistStats(supabase, userId)
```

### React — Re-renders

| Problema | Archivo | Impacto | Esfuerzo |
|----------|---------|---------|----------|
| Sin `React.memo()` en editor de plan | `plans/[id]/page.tsx` | ~20% re-renders innecesarios | 30 min |
| Sin `React.memo()` en tabs de paciente | `patient-tabs.tsx` | Re-render al cambiar tab | 30 min |
| Sin `useCallback` en day-editor | `day-editor.tsx` | Re-renders en edición | 15 min |

**Lo que SÍ está bien:**
- `patients-section.tsx`: excelente uso de `useMemo()` para filtrado/ordenamiento
- `send-plan-button.tsx`: `useCallback()` en todos los handlers
- `plan-actions-bar.tsx`: handlers correctamente memoizados

### PDF — Quick win

**Problema**: Descargas secuenciales de logo, firma y foto en `api/plans/[id]/pdf/route.ts`
**Fix**: Usar `Promise.all()` para paralelizar — ahorra ~250ms por generación de PDF.

### Suspense — No utilizado

- **0 boundaries `<Suspense>`** en el proyecto
- Los 4 archivos `loading.tsx` existentes solo se muestran durante navegación, no durante carga de datos
- El dashboard ejecuta 6+ queries bloqueantes antes de mostrar contenido

**Recomendación**: Añadir Suspense boundaries en dashboard y vistas de plan.

### Caching

- ❌ No se usa `unstable_cache()` — el perfil del usuario se re-fetcha en cada request
- ❌ La vista pública del paciente (`/p/[token]`) no usa ISR
- ✅ `revalidatePath()` se usa correctamente tras mutaciones

---

## 4. DEUDA TÉCNICA

### CRÍTICO — Arreglar antes del lanzamiento

| # | Issue | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 1 | **144 `as any`** en 42 archivos | Mayormente queries Supabase | 4-6h |
| 2 | **`typescript.ignoreBuildErrors: true`** en next.config.js | next.config.js | 5 min + fix errores |
| 3 | **Sin Suspense boundaries** — UX de carga pobre | Dashboard, plan editor | 2-3h |
| 4 | **Singleton Anthropic no usado** | 5 archivos crean `new Anthropic()` | 30 min |
| 5 | **`architecture.md` referenciado pero no existe** | CLAUDE.md línea 352 | 1h |

### IMPORTANTE — Arreglar pronto

| # | Issue | Impacto |
|---|-------|---------|
| 6 | Queries Supabase duplicadas sin capa de abstracción | Mantenibilidad |
| 7 | Console.log/error inconsistente (61 instancias, sin logger) | Debugging en producción |
| 8 | PDF monolítico (788 líneas) difícil de mantener | Velocidad de desarrollo |
| 9 | Landing page monolítica (883 líneas) | Velocidad de desarrollo |
| 10 | `classnames` + `clsx` redundantes en package.json | Bundle size |

### PUEDE ESPERAR — Post-lanzamiento

| # | Issue | Notas |
|---|-------|-------|
| 11 | Consolidar `/lib/` y `/libs/` en una sola carpeta | Refactor cosmético |
| 12 | Mover lógica de dashboard a `/features/` | Refactor de estructura |
| 13 | `recharts` en dependencies pero sin uso visible | Verificar si se usa realmente |
| 14 | Añadir `unstable_cache()` para perfil | Optimización menor |
| 15 | ISR en vista pública del paciente | Optimización menor |

---

## 5. RECOMENDACIÓN DE CONFIGURACIÓN

### Modelo por tipo de tarea

| Tarea | Modelo recomendado | Razón |
|-------|-------------------|-------|
| Edición de código, bugs, features | **Sonnet** (default) | Balance coste/calidad, suficiente para 95% de tareas |
| Refactors grandes (dividir componentes) | **Sonnet** | Entiende estructura, buen output |
| Auditorías, arquitectura, planning | **Opus** | Mejor razonamiento para decisiones complejas |
| Fixes rápidos, typos, ajustes CSS | **Haiku** | Rápido y barato para tareas simples |
| Generación de planes nutricionales (API) | **claude-sonnet-4-5** | Ya configurado, buen balance calidad/coste |

### CLAUDE.md optimizado

Recomendaciones concretas:

1. **Extraer** el ejemplo JSON de plan_data a `docs/PLAN_STRUCTURE.md` y referenciar
2. **Mover** sección GTM a `docs/GTM.md`
3. **Resumir** sección legal a 10 líneas con enlace
4. **Eliminar** header duplicado "Estado actual del proyecto"
5. **Añadir** sección "Patrones de código" con los patterns aprobados (query helpers, error handling)

### Quick wins de configuración

1. **Cambiar `ignoreBuildErrors` a `false`** en `next.config.js` — esto es crítico
2. **Eliminar `recharts`** si no se usa — `npm uninstall recharts`
3. **Eliminar `classnames`** — ya existe `clsx` que hace lo mismo

---

## RESUMEN EJECUTIVO

### Estado general: BUENO con deuda técnica manejable

El proyecto está bien estructurado para su tamaño (~27K líneas). La arquitectura es sólida, la seguridad (RLS, HMAC tokens, rate limiting) está bien implementada, y la integración con Claude API tiene un excelente sistema de resiliencia.

### Top 5 acciones por impacto

1. **Eliminar `as any`** (144 instancias) — tipo safety es la base de todo
2. **Desactivar `ignoreBuildErrors`** — una línea que puede prevenir bugs en producción
3. **Dividir los 5 componentes > 500 líneas** — mejora mantenibilidad Y reduce tokens de Claude Code
4. **Añadir Suspense boundaries** — mejora UX percibida significativamente
5. **Crear capa de queries Supabase** — elimina duplicación y facilita testing

### Métricas de referencia

- **171 archivos** TypeScript/TSX
- **26.611 líneas** de código
- **52 archivos** > 200 líneas (30% del total)
- **144 `as any`** en 42 archivos
- **92 queries** Supabase sin abstracción
- **0 Suspense** boundaries
- **61 console** statements sin logger

---

*Generado por Claude Code — auditoría completa del proyecto Dietly*
