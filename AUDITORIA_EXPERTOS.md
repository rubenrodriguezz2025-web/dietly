# AUDITORÍA EXPERTOS — DIETLY
**Fecha:** 22 de marzo de 2026
**Metodología:** 4 agentes especializados analizando en paralelo + síntesis conjunta
**Alcance:** Código fuente completo, migraciones SQL, flujos UX y cumplimiento normativo

---

## ÍNDICE

1. [Agente 1 — Estándares Clínicos (SENC / SEEN / ISSN)](#agente-1)
2. [Agente 2 — Seguridad y RGPD datos sanitarios](#agente-2)
3. [Agente 3 — UX y comparativa con competidores](#agente-3)
4. [Agente 4 — Arquitectura y rendimiento SaaS](#agente-4)
5. [Tabla comparativa Dietly vs Competidores](#comparativa)
6. [Top 10 — Cambios prioritarios antes del lanzamiento](#top10)
7. [Veredicto final](#veredicto)

---

<a name="agente-1"></a>
## AGENTE 1 — Estándares Clínicos de Nutrición

> Revisó: `calc-targets.ts`, `prompt-builder.ts` / `generate/route.ts`, `nutrition-validator.ts`

### Resumen ejecutivo

El sistema implementa **cálculos clínicamente correctos** en su mayor parte, pero presenta **4 hallazgos críticos** que deben resolverse antes de operar con nutricionistas reales. La validación pre-aprobación es excelente; el prompt builder carece de adaptaciones por patología.

---

### 1.1 Cálculos de macros — CORRECTO

**TMB (Tasa Metabólica Basal):**
- ✅ Fórmula Mifflin-St Jeor completa (`10 × peso + 6.25 × talla − 5 × edad ± 5/161`)
- ✅ Manejo de sexo "other" con promedio conservador
- ✅ Factores de actividad alineados con SENC 2022: 1.2–1.9

**Proteína:**
- ✅ Escalonada por objetivo: weight_loss 2.0 g/kg, muscle_gain 2.2 g/kg, health 1.4 g/kg (en rango ESPEN/ISSN)
- ✅ Ajuste de peso en obesidad (IBW + 0.25 × exceso) según consenso ASPEN
- ✅ Caps de seguridad: min 50 g, max(240 g, 40% kcal)

**Distribución carbs/grasa:**
- ✅ Ratios por objetivo alineados con patrón mediterráneo SENC 2022
- ✅ Floor calórico: 1 200 kcal mujeres / 1 400 kcal hombres

**Ajuste calórico por IMC:**
- ✅ EXCELENTE — déficit adaptado escalonadamente:
  - IMC < 18.5 → 0 kcal déficit (normocalórico)
  - IMC 22–25 → −350 kcal
  - IMC 25–30 → −500 kcal
  - IMC > 30 → −600 kcal (dentro del límite SENC)

---

### 1.2 Prompt a Claude — BIEN, CON GAPS CRÍTICOS

**Incluido correctamente:** edad, sexo, macros calculados, restricciones, alergias, intolerancias, preferencias, notas médicas, horarios del intake form, días ya generados (variedad).

**Excluido correctamente:** nombre, email, fecha de nacimiento exacta, ID real.

**CRÍTICO #1 — PII en `medical_notes` y `preferences`:**
```typescript
// pseudonymize.ts — comentario propio del código:
// "Pueden contener referencias informales a nombres"
preferences: string | null;
medical_notes: string | null;
```
Si el nutricionista escribe "María tiene alergia a…", ese texto sale a la API de Anthropic sin anonimizar. Responsabilidad del profesional, pero el sistema no lo detecta ni advierte.

**CRÍTICO #2 — Sin adaptación del prompt por patología:**
El validador detecta diabetes, embarazo, ERC… pero el prompt a Claude es genérico para todos. Un paciente con DM2 recibe el mismo prompt que uno sano.

---

### 1.3 Casos edge peligrosos

| Caso | IMC/Condición | Detectado | Bloquea | Riesgo |
|------|--------------|-----------|---------|--------|
| Bajo peso severo | < 16 | ✅ | ✅ BLOQUEA | Síndrome realimentación |
| Bajo peso | 16–20 | ✅ | ❌ Solo aviso | Desnutrición secundaria |
| Obesidad severa | > 35 | ✅ | ❌ Solo aviso | Comorbilidades |
| Menor de 14 | age < 14 | ⚠️ warning | ❌ Solo aviso | Yatrogenia pediátrica |
| Embarazo | any | ✅ warning | ❌ Solo aviso | Déficit micronutrientes |
| Diabetes Tipo 1 | DM1 | ⚠️ genérico | ❌ No bloquea | Requiere endocrino |
| ERC estadio 3–5 | ERC 3-5 | ✅ | ✅ BLOQUEA | Correcto |
| TCA | keywords | ✅ | ✅ BLOQUEA | Correcto |

**CRÍTICO #3 — Menores de edad:**
- `age < 18` emite `warning` pero no bloquea la aprobación del plan
- El protocolo ESPGHAN requiere +10% kcal para crecimiento en menores de 14
- RGPD Art. 8: menores de 16 requieren consentimiento parental explícito
- **No hay ninguna solicitud de consentimiento parental en el flujo**

**CRÍTICO #4 — Ausencia total de micronutrientes:**
El sistema no contempla vitaminas ni minerales en ninguna capa. Ejemplos de riesgo:
- Paciente vegana + déficit calórico → riesgo crítico de B12, hierro, yodo sin aviso
- Embarazada con restricción de lácteos → hipocalcemia fetal, sin alerta
- El validator no cubre ningún riesgo de micronutrientes

---

### 1.4 Comparativa con práctica clínica manual

| Aspecto | Dietly | D-N Manual |
|---------|--------|------------|
| Fórmula TMB | ✅ Mifflin-St Jeor | Calculadora o estimación |
| Proteína | ✅ Escalada + caps | Ad-hoc por experiencia |
| Validación clínica | ✅ 19 checks automáticos | Revisión subjetiva |
| Detección alérgenos | ✅ Match en ingredientes | Revisión manual |
| **Micronutrientes** | ❌ Ninguno | ✅ Checklist mental |
| **Medicación-interacción** | ⚠️ 4 fármacos | ✅ Exhaustivo |
| **Contexto por patología** | ⚠️ Solo detección | ✅ Protocolo especializado |
| **Educación nutricional** | ❌ | ✅ Coaching de hábitos |
| **Contexto económico** | ❌ | ✅ Presupuesto familiar |

---

### 1.5 Recomendaciones del Agente 1

| Prioridad | Acción |
|-----------|--------|
| 🔴 Semana 1 | Bloquear (no warning) pacientes < 14 años; exigir protocolo pediátrico |
| 🔴 Semana 1 | Bloquear planes para Diabetes Tipo 1 (exige endocrino) |
| 🔴 Semana 1 | Añadir alerta visual cuando se detecten combos de riesgo de micronutrientes (vegano+déficit, embarazo+restricción, mujer+bajo peso) |
| 🟠 Semana 2 | Adaptar prompt por patología: DM2 → instruir IG bajo; embarazo → ajustar por trimestre; vegetariano → mencionar B12, hierro |
| 🟠 Semana 2 | Cambiar IMC 16–20 de `warning` a `block` |
| 🟡 Semana 3 | Ampliar fármacos detectados: estatinas, IBP, anticonceptivos |

---

<a name="agente-2"></a>
## AGENTE 2 — Seguridad y RGPD para Datos Sanitarios

> Revisó: todas las API routes, server actions, middleware, migraciones SQL, libs de Supabase

### Resumen ejecutivo

Arquitectura defensiva en profundidad con **1 vulnerabilidad ALTA, 3 MEDIAS y 2 BAJAS**. La pseudonimización, RLS, audit logs y tokens HMAC están bien implementados. Los gaps críticos son el intake token sin HMAC y la ausencia de la cláusula Art. 28.3 en los T&Cs.

---

### 2.1 Protección de datos de salud — SÓLIDO

- ✅ Pseudonimización completa antes de enviar a Anthropic (`pseudonymize.ts`): nombre, email, ID real y fecha de nacimiento exacta nunca salen del servidor
- ✅ Se envía edad en años (derivada), no DOB
- ✅ Session UUID efímero por petición (no el ID real del paciente)
- ✅ `ai_request_logs` append-only, pseudonimizados, inmutables desde cliente

---

### 2.2 RLS — COMPLETO

RLS habilitado explícitamente en las 13 tablas relevantes (migración 021). Patrón optimizado `(SELECT auth.uid()) = nutritionist_id` en todas las políticas. Verificado aislamiento entre nutricionistas.

La función `get_plan_by_patient_token()` usa SECURITY DEFINER correctamente: solo devuelve planes `approved`/`sent`, LIMIT 1, sin exponer datos de otros pacientes.

---

### 2.3 Audit logs — INMUTABLES ✅

```sql
-- 020_audit_logs.sql
-- Sin políticas UPDATE ni DELETE para 'authenticated'
-- El borrado solo es ejecutable por service_role bajo petición documentada
```

Trigger `fn_audit_log()` registra INSERT/UPDATE/DELETE en patients, nutrition_plans, intake_forms, patient_consents. Metadata sin datos de salud (solo nombres de campos modificados). IP y User-Agent capturados.

---

### 2.4 Derechos RGPD — IMPLEMENTADOS

- ✅ **Art. 17 (olvido):** `/api/patients/[id]/delete` con cascade en FK
- ✅ **Art. 20 (portabilidad):** `/api/patients/[id]/export` exporta JSON completo con schema_version
- ✅ **Art. 12.3 (plazos):** `data_rights_requests` con `response_due_at = now() + 30 days`
- ✅ **Consentimientos:** `patient_consents` con versión del texto, IP, soft delete con `revoked_at`

---

### 2.5 Vulnerabilidades identificadas

**ALTA — CVE-001: Intake/Followup tokens sin validación HMAC ni expiración**

```typescript
// /src/app/api/intake/submit/route.ts
// El token es un UUID simple — sin firma HMAC, sin expiración
.eq('intake_token', token)  // cualquiera con el UUID puede enviar respuestas
```

Un atacante que conozca el UUID de `intake_token` puede enviar respuestas falsas en nombre del paciente, corrompiendo datos clínicos. Ya existe infraestructura HMAC en `plan-tokens.ts` — aplicarla aquí requeriría 4–6 horas.

**MEDIA — CVE-002: Enumeración de emails en `/api/data-rights`**

```typescript
// Sin autenticación, sin rate limiting
if (!patients || patients.length === 0) {
  return NextResponse.json({ error: 'No se encontraron datos para ese email' }, { status: 404 });
}
```
Respuesta diferente para email existente vs no existente → enumeración de usuarios del sistema.

**MEDIA — CVE-003: Falta Zod en varias API routes**

`/api/intake/submit`, `/api/followup/submit`, `/api/data-rights` validan manualmente pero sin schema Zod. Inconsistente con el stack declarado en CLAUDE.md.

**MEDIA — CVE-004: PII potencial en prompts IA**

`preferences` y `medical_notes` son texto libre. El código incluye comentario admitiendo el riesgo. (Ver también Agente 1, CRÍTICO #1.)

**BAJA — CVE-005: Emails de notificación con respuestas del cuestionario en plaintext**

`/api/followup/submit` incluye las respuestas completas en HTML. Si Resend es comprometido, la información es legible. Recomendación: enviar solo resumen + enlace autenticado.

**COMPLIANCE — COMP-001: Falta cláusula Art. 28.3 RGPD en T&Cs**

El contrato responsable→encargado no especifica los 8 apartados obligatorios del Art. 28.3 (tratamiento por instrucción documentada, confidencialidad, medidas Art. 32, prohibición de subcontratación sin autorización, asistencia ARCO, asistencia brechas/EIPD, devolución/destrucción de datos, auditorías). **Bloquea escalar a clientes de producción.**

---

### 2.6 Recomendaciones del Agente 2

| Severidad | ID | Acción | Esfuerzo |
|-----------|----|---------|---------:|
| 🔴 ALTA | CVE-001 | Aplicar HMAC a intake_token y followup_token (reutilizar `plan-tokens.ts`) | 4–6 h |
| 🔴 LEGAL | COMP-001 | Añadir cláusula Art. 28.3 RGPD (8 apartados) en T&Cs | 2–4 h |
| 🟠 MEDIA | CVE-002 | Rate limiting (5 req/IP/día) + respuesta genérica `{ ok: true }` en `/api/data-rights` | 2–3 h |
| 🟠 MEDIA | CVE-003 | Implementar Zod en intake/submit, followup/submit, data-rights | 6–8 h |
| 🟡 BAJA | CVE-005 | Reemplazar respuestas completas por resumen + link autenticado en email notificación | 2–3 h |

---

<a name="agente-3"></a>
## AGENTE 3 — UX y Comparativa con Competidores

> Revisó: todos los componentes del dashboard, flujos principales, PWA del paciente, onboarding

### Resumen ejecutivo

Dietly tiene **la mejor PWA del paciente del sector** y un diferencial claro en generación IA + validación clínica. Los gaps principales están en la gestión de pacientes (sin filtros/búsqueda), el editor de planes (sin macros visuales por comida) y funcionalidades ausentes que los competidores tienen como estándar.

---

### 3.1 Onboarding del nutricionista

**Fortalezas:**
- ✅ Modal de AI Literacy profesional y detallado — explica qué puede y no puede hacer la IA
- ✅ Número de colegiado obligatorio (cobertura legal LOPS)
- ✅ Reconocimiento RGPD Art. 9 con checkbox explícito

**Gaps:**
- ❌ Número de colegiado no se valida contra CGCODN (acepta cualquier string de 4+ chars)
- ❌ No explica los límites del plan (30 pacientes en Básico) durante onboarding
- ❌ No hay confirmación de email post-registro

---

### 3.2 Creación de paciente

**Fortalezas:** Formulario completo en 4 secciones con RLS, RGPD, TMB/TDEE calculados.

**Gaps vs competidores:**

| Campo | Dietly | Nutrium | Dietopro |
|-------|--------|---------|----------|
| Medicamentos/suplementos | ❌ | ✅ (dropdown + dosis) | ✅ |
| Patologías estructuradas | ⚠️ texto libre | ✅ dropdown | ✅ |
| Múltiples objetivos | ❌ (solo 1) | ✅ | ✅ |
| Biomarcadores (colesterol, glucosa) | ❌ | ✅ | ✅ |

El campo `medical_notes` captura patologías como texto libre, lo que además impacta en la calidad del prompt a Claude (ver Agente 1).

---

### 3.3 Generación de plan

**Fortalezas:**
- ✅ UI de confirmación con macros en tiempo real
- ✅ Indicador de cuestionario intake completado
- ✅ Streaming día por día con feedback de progreso
- ✅ Manejo de errores con retry por día fallido

**Gaps:**
- ❌ Si el plan falla en el día 5, el nutricionista pierde todo — no existe `/api/plans/[id]/regenerate-day`
- ❌ No hay preview de las respuestas del intake antes de generar
- ❌ Modal de confirmación con `w-72` fijo — se corta en tablet

---

### 3.4 Dashboard y gestión de pacientes

**Fortalezas:**
- ✅ Ficha de paciente con 5 tabs (Ficha, Planes, Progreso, Cuestionario, Seguimiento)
- ✅ Recordatorios con alerta visual si están vencidos

**Gaps:**
- ❌ **Sin búsqueda ni filtros** en la lista de pacientes — carga todos con `select('*')`
- ❌ Progreso se muestra en tabla (no gráfica) — Nutrium y Dietopro tienen gráfica de línea peso/IMC
- ❌ No hay "Notas del nutricionista" separadas de `medical_notes` del paciente (problema RGPD: mezcla datos clínicos del paciente con anotaciones privadas del profesional)
- ❌ No hay edición inline en ficha de paciente

---

### 3.5 Editor de plan

**Fortalezas:**
- ✅ Validación clínica integrada con semáforo rojo/amarillo
- ✅ Editor día a día con campos editables
- ✅ Resumen semanal con macros reales vs objetivo

**Gaps:**
- ❌ No se puede editar ingredientes ni recalcular macros
- ❌ No hay "sugerir alternativa" para una comida concreta
- ❌ No hay audit trail de ediciones al plan (¿qué cambió el nutricionista antes de aprobar?)

---

### 3.6 PWA del paciente — EXCELENTE ✅

Es el mayor diferencial de Dietly. Diseño superior a todos los competidores analizados:
- ✅ Header con macros objetivo en píldoras de color
- ✅ Navegación sticky de días
- ✅ Tarjetas de comida con macros por comida (el pain #1 según brief)
- ✅ Lista de compra categorizada
- ✅ Footer de transparencia con nombre del nutricionista + número colegiado
- ✅ PWA-ready con manifest.json + service-worker
- ✅ Accesibilidad: aria-labels, prefers-reduced-motion

**Gaps menores:**
- ❌ No hay CTA "Instalar en pantalla de inicio" visible para el paciente
- ❌ `/p/seguimiento/[token]` usa paleta oscura (bg-zinc-950) vs la PWA light — inconsistencia visual
- ❌ El paciente no puede ver planes anteriores

---

### 3.7 Features que tienen competidores y Dietly no (priorizado para roadmap)

| Feature | Nutrium | Dietopro | INDYA | NutriAdmin | Prioridad MVP |
|---------|---------|----------|-------|-----------|---------------|
| Búsqueda/filtros pacientes | ✅ | ✅ | ✅ | ✅ | 🔴 Alta |
| Gráfica progreso peso | ✅ | ✅ | ✅ | ✅ | 🟠 Media |
| Medicamentos estructurados | ✅ | ✅ | ✅ | ✅ | 🟠 Media |
| Regenerar día fallido | ⚠️ | ✅ | ✅ | ⚠️ | 🟠 Media |
| Notas privadas nutricionista | ✅ | ✅ | ✅ | ✅ | 🟡 Baja |
| Videoconsulta | ✅ | ⚠️ | ❌ | ⚠️ | ❌ No MVP |
| Base datos BEDCA/alimentos | ❌ | ✅ | ✅ | ⚠️ | ❌ No MVP |
| Facturación integrada | ✅ | ✅ | ✅ | ✅ | ❌ No MVP |

---

### 3.8 Recomendaciones del Agente 3

| Prioridad | Acción | Esfuerzo |
|-----------|--------|----------|
| 🔴 Alta | Añadir búsqueda por nombre + filtros en lista pacientes | 3–4 h |
| 🔴 Alta | Añadir campo "Medicamentos/suplementos" al formulario de paciente | 3–4 h |
| 🟠 Media | Gráfica de progreso con peso/IMC en tiempo | 2–3 h |
| 🟠 Media | Endpoint regenerar día fallido (`/api/plans/[id]/regenerate-day`) | 6–8 h |
| 🟡 Baja | CTA "Añadir a pantalla de inicio" en PWA del paciente | 1 h |
| 🟡 Baja | Unificar paleta de `/p/seguimiento` con el resto de la PWA | 2 h |
| 🟡 Baja | "Notas del nutricionista" separadas de medical_notes en patient_tabs | 2–3 h |

---

<a name="agente-4"></a>
## AGENTE 4 — Arquitectura y Rendimiento SaaS

> Revisó: next.config.js, tsconfig, package.json, generate/route.ts, libs, middleware, migraciones

### Resumen ejecutivo

Arquitectura bien estructurada con patrones maduros de resiliencia IA. **3 problemas CRÍTICOS** que afectan a CI/CD y escalabilidad, y **5 problemas ALTOS** de rendimiento que se manifestarán con 100+ usuarios. La mayor deuda es `ignoreBuildErrors: true` que invalida toda la seguridad de tipos.

---

### 4.1 CRÍTICO C1: `ignoreBuildErrors: true` en `next.config.js`

```javascript
// next.config.js línea 6
typescript: {
  ignoreBuildErrors: true,  // ← código roto se despliega a producción sin warning
},
```

Con 94 usos de `(supabase as any)` en el codebase, esto significa que cualquier cambio de schema en Supabase puede romper funcionalidad en producción sin que el build lo detecte. **Contradice directamente la regla "TypeScript estricto" de CLAUDE.md.**

---

### 4.2 CRÍTICO C2: Modelo IA hardcodeado sin validación de disponibilidad

```typescript
// generate/route.ts líneas 485, 524, 611
model: 'claude-sonnet-4-6',
```

Si Anthropic depreca el modelo (como hizo con claude-3.5-sonnet), el producto se rompe sin aviso. Los costes también están hardcodeados (`COST_PER_INPUT_TOKEN = 0.000003`) — si Anthropic cambia precios, los dashboards de costes mostrarán datos incorrectos.

**Solución:** `ANTHROPIC_MODEL_ID` como variable de entorno + health check de disponibilidad.

---

### 4.3 CRÍTICO C3: Fallback TDEE=2000 sin validación clínica

```typescript
// calc-targets.ts línea 149
const baseTdee = tdee ?? 2000; // fallback cuando no hay datos suficientes
```

2.000 kcal es un promedio genérico. Para un atleta de 120 kg es −37% de sus necesidades reales. Esto puede producir planes clínicamente incorrectos cuando el perfil del paciente está incompleto. **Debe bloquearse la generación si TDEE es null.**

---

### 4.4 ALTO H1: Falta validación de plan completo antes de marcar como `draft`

```typescript
// generate/route.ts línea 680
// Se actualiza a 'draft' sin verificar que content.days.length === 7
const { error } = await supabaseAdminClient.from('nutrition_plans').update({
  status: 'draft', content, ...
```

En situaciones de estrés (timeouts, fallos parciales), un plan puede quedar con 4–5 días marcado como "listo". El nutricionista lo aprueba sin saberlo.

---

### 4.5 ALTO H2: `patient_token` sin índice en la tabla `nutrition_plans`

La función `get_plan_by_patient_token()` (SECURITY DEFINER, usada por la PWA) hace un full table scan en cada carga del paciente. Sin índice, con 10.000 planes el tiempo de query crece linealmente.

```sql
-- Migración pendiente:
CREATE UNIQUE INDEX idx_nutrition_plans_patient_token ON nutrition_plans(patient_token);
```

---

### 4.6 ALTO H3: Timeout Claude (45 s) vs keepalive SSE (15 s)

Con conexiones lentas o móviles, el stream SSE puede cerrarse entre keepalives. Con 7 días × 45 s = 315 s, además se excede el `maxDuration: 300` de Vercel en el peor caso.

```typescript
// Ajuste recomendado:
setInterval(keepalive, 10_000);  // cada 10 s
timeout: 60_000;                  // 60 s por día
export const maxDuration = 360;   // 6 min margen
```

---

### 4.7 ALTO H4: `checkAndAlertErrorRate()` sin cooldown — riesgo de cascada

Cada generación fallida dispara 2 queries adicionales a Supabase para calcular tasa de error. En una tormenta de errores: 100 fallos × 2 queries = 200 queries/5 min saturando el connection pool. La monitorización se convierte en factor de fallo.

---

### 4.8 ALTO H5: Rate limiting solo por IP, no por usuario autenticado

`/api/plans/generate` no tiene rate limiting propio. Un nutricionista puede agotar su cuota de API de Anthropic en minutos generando en bucle. El rate limiting del middleware solo protege la ruta pública `/plan/[token]`.

---

### 4.9 Deuda técnica acumulada

| Tipo | Cantidad | Impacto |
|------|----------|---------|
| `(supabase as any)` en código | 94 usos | Tipos no validados en runtime |
| `console.log/error` en APIs | 24 ocurrencias | Coste I/O + logs ruidosos en Vercel |
| `select('*')` en queries | Varios | Ancho de banda innecesario |
| Migraciones sin IF EXISTS | 25 archivos | Fallos silenciosos en entornos inconsistentes |
| TODOs en CLAUDE.md | 3 items | Cláusula RGPD, validación colegiado, comparación price_id |

---

### 4.10 Lo que funciona bien en arquitectura

- ✅ Queries paralelas con `Promise.all` en todas las páginas del dashboard
- ✅ Resiliencia IA: reintentos exponenciales, circuit breaker, alertas de tasa de error
- ✅ `maxDuration = 300` para routes de generación
- ✅ Streaming SSE con keepalive
- ✅ Pseudonimización en capa de servicio (no en route handler)
- ✅ Separación limpia: Server Actions para mutaciones, API routes para streaming/webhooks

---

### 4.11 Recomendaciones del Agente 4

| Criticidad | ID | Acción | Esfuerzo |
|------------|----|---------|---------:|
| 🔴 CRÍTICO | C1 | Cambiar `ignoreBuildErrors: false` + generar tipos Supabase | 4–8 h |
| 🔴 CRÍTICO | C2 | Migrar modelo a `ANTHROPIC_MODEL_ID` env var | 1 h |
| 🔴 CRÍTICO | C3 | Bloquear generación si TDEE === null | 2 h |
| 🟠 ALTO | H1 | Validar `days.length === 7` antes de marcar `draft` | 1 h |
| 🟠 ALTO | H2 | Migración: índice UNIQUE en `patient_token` | 30 min |
| 🟠 ALTO | H3 | Ajustar keepalive 10 s + timeout 60 s + maxDuration 360 | 30 min |
| 🟠 ALTO | H4 | Cooldown 60 s en `checkAndAlertErrorRate()` | 1 h |
| 🟠 ALTO | H5 | Rate limit por user_id en `/api/plans/generate` (máx 5/hora) | 2 h |

---

<a name="comparativa"></a>
## TABLA COMPARATIVA — Dietly vs Competidores

| Funcionalidad | Dietly | Nutrium | Dietopro | INDYA | NutriAdmin |
|---------------|--------|---------|----------|-------|-----------|
| **Generación IA de planes** | ✅ | ⚠️ básico | ❌ | ❌ | ❌ |
| **Validación clínica automática** | ✅ 19 checks | ❌ | ⚠️ | ⚠️ | ❌ |
| **PWA paciente** | ✅ excelente | ✅ | ⚠️ | ❌ | ❌ |
| **Cuestionario intake digital** | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **RGPD explícito en onboarding** | ✅ | ❌ | ⚠️ | ⚠️ | ❌ |
| **Consentimiento versionado** | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| **Audit logs inmutables** | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| **Derecho al olvido implementado** | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| **PDF con marca del nutricionista** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Búsqueda/filtros pacientes** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Gráfica de progreso** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Campo medicamentos** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Patologías estructuradas** | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Micronutrientes** | ❌ | ⚠️ | ✅ | ✅ | ⚠️ |
| **Videoconsulta** | ❌ | ✅ | ⚠️ | ❌ | ⚠️ |
| **Chat nutricionista-paciente** | ❌ | ✅ | ✅ | ❌ | ⚠️ |
| **Base datos alimentos (BEDCA)** | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| **Facturación integrada** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Precio base (€/mes)** | 46€ | 79€ | 69€ | 99€ | 39€ |
| **Ratio valor/precio** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**Diferencial competitivo de Dietly:** Generación IA + validación clínica + RGPD explícito + PWA paciente de primer nivel — ningún competidor tiene los 4 combinados. El precio (46€ vs 69–99€) es un argumento adicional para los primeros clientes.

**Mayor debilidad vs competidores:** ausencia de búsqueda/filtros, campo de medicamentos y gráfica de progreso — funcionalidades consideradas estándar en el sector.

---

<a name="top10"></a>
## TOP 10 — CAMBIOS PRIORITARIOS ANTES DEL LANZAMIENTO

Ordenados por impacto clínico × riesgo legal × facilidad de implementación:

---

### #1 — Intake token con HMAC *(Seguridad ALTA)*
**Problema:** El token de acceso al cuestionario del paciente es un UUID simple sin firma ni expiración. Cualquiera que lo conozca puede enviar respuestas falsas que contaminarán datos clínicos.
**Acción:** Reutilizar `plan-tokens.ts` para firmar el intake_token con HMAC-SHA256 + expiración 90 días.
**Impacto:** Integridad de datos clínicos | **Esfuerzo:** 4–6 h

---

### #2 — Cláusula Art. 28.3 RGPD en T&Cs *(Legal BLOQUEANTE)*
**Problema:** Sin los 8 apartados del Art. 28.3 en el contrato, Dietly no puede operar legalmente como encargado del tratamiento. Cualquier cliente grande puede rechazarlo en due diligence.
**Acción:** Añadir sección "Cláusula de encargado del tratamiento" en `/legal/terminos`.
**Impacto:** Cumplimiento legal | **Esfuerzo:** 2–4 h + revisión legal

---

### #3 — Bloquear menores de 14 años + protocolo de consentimiento parental *(Clínico + Legal CRÍTICO)*
**Problema:** Menores de 14 años reciben solo un `warning` que el nutricionista puede ignorar. Los planes generados no incluyen ajuste de crecimiento. RGPD Art. 8 exige consentimiento parental para menores de 16.
**Acción:** Cambiar `severity: 'warning'` a `'block'` para age < 14; añadir checkbox de consentimiento parental para 14–16; adaptar prompt con factor de crecimiento ESPGHAN.
**Impacto:** Seguridad clínica + cobertura legal | **Esfuerzo:** 3–4 h

---

### #4 — `ignoreBuildErrors: false` + generación de tipos Supabase *(Arquitectura CRÍTICO)*
**Problema:** El build de Vercel no detecta errores de TypeScript. Con 94 `as any` en producción, cualquier cambio de schema puede romper funcionalidad sin aviso.
**Acción:** Cambiar flag en `next.config.js`; ejecutar `npm run generate-types`; corregir errores en sprint.
**Impacto:** Estabilidad en producción | **Esfuerzo:** 4–8 h inicial + gradual

---

### #5 — Bloquear generación si TDEE es nulo *(Clínico + Arquitectura CRÍTICO)*
**Problema:** El fallback TDEE=2.000 kcal puede ser ±30% de la realidad del paciente, produciendo planes clínicamente incorrectos que el nutricionista puede no detectar.
**Acción:** En `generate/route.ts`, devolver error `400` si `patient.tdee === null`; en UI, mostrar qué campos del paciente faltan para calcular el TDEE.
**Impacto:** Calidad clínica | **Esfuerzo:** 2 h

---

### #6 — Búsqueda y filtros en lista de pacientes *(UX + Rendimiento)*
**Problema:** El dashboard carga todos los pacientes sin paginación. Con 30+ pacientes, la UX es inaceptable. Es la funcionalidad de gestión más básica que tienen todos los competidores.
**Acción:** Input de búsqueda por nombre + filtros ("sin plan en 30 días", "revisión vencida") + paginación en la query de Supabase.
**Impacto:** Usabilidad diaria | **Esfuerzo:** 3–4 h

---

### #7 — Campo "Medicamentos/suplementos" en formulario de paciente *(Clínico + UX)*
**Problema:** El validador detecta 4 fármacos en `medical_notes` (texto libre), pero los nutricionistas no siempre los escriben en formato detectables. La lista estructurada mejora la detección y la calidad del plan.
**Acción:** Añadir campo array `medications` al formulario de paciente y a la tabla; pasar al pseudonimizador para incluirlo en el prompt.
**Impacto:** Seguridad clínica + UX | **Esfuerzo:** 3–4 h + migración DB

---

### #8 — Índice UNIQUE en `patient_token` *(Rendimiento)*
**Problema:** La PWA del paciente llama a `get_plan_by_patient_token()` en cada carga. Sin índice, es un full table scan que crece con el tiempo.
**Acción:** Nueva migración `026_patient_token_index.sql` con `CREATE UNIQUE INDEX`.
**Impacto:** Rendimiento a escala | **Esfuerzo:** 30 min

---

### #9 — Alertas de micronutrientes en combos de riesgo *(Clínico CRÍTICO)*
**Problema:** El sistema no tiene ninguna capa de micronutrientes. Combinaciones como vegano+déficit o embarazada+restricción lácteos presentan riesgo clínico real sin ningún aviso.
**Acción:** Añadir al validador checks de riesgo nutricional: `if (isVegan && deficit > 20%) → block`; `if (pregnant && dairy_restricted) → block`; adaptar prompt para incluir instrucciones de micronutrientes específicos.
**Impacto:** Seguridad clínica | **Esfuerzo:** 4–6 h

---

### #10 — Rate limiting por usuario en `/api/plans/generate` *(Arquitectura + Costes)*
**Problema:** Un nutricionista puede generar planes sin límite, agotando la cuota de Anthropic y generando costes no previstos. No hay ningún control.
**Acción:** Verificar en la route que el usuario no ha superado N generaciones en las últimas X horas; devolver error `429` con mensaje claro.
**Impacto:** Control de costes + abuso | **Esfuerzo:** 2 h

---

<a name="veredicto"></a>
## VEREDICTO FINAL

### ¿Está Dietly listo para beta con nutricionistas reales?

---

### ✅ LO QUE ESTÁ LISTO

**Técnicamente sólido:**
- Core de generación IA con resiliencia completa (reintentos, circuit breaker, streaming)
- Cálculos nutricionales correctos según guías SENC/ESPEN/ISSN
- Validador clínico con 19 checks (7 bloqueantes, 12 warnings)
- RLS completo en todas las tablas con aislamiento entre nutricionistas
- Pseudonimización antes de Anthropic API
- Audit logs inmutables para RGPD Art. 30
- Derechos RGPD implementados: olvido (Art. 17), portabilidad (Art. 20), plazos (Art. 12.3)
- Flujo draft → approved con responsabilidad profesional explícita (LOPS 44/2003)
- PWA del paciente de primer nivel — mejor que todos los competidores
- Onboarding con AI Literacy y número de colegiado
- PDF con marca del nutricionista

**Producto diferenciado:**
Dietly es el único software del sector que combina generación IA + validación clínica + RGPD explícito + PWA de calidad. A 46€/mes frente a 69–99€ de la competencia, el argumento de venta es sólido.

---

### ⚠️ LO QUE BLOQUEA EL LANZAMIENTO

Hay **4 issues que deben resolverse antes de incorporar el primer cliente de pago:**

1. **Intake token sin HMAC** — compromete integridad de datos clínicos (#1)
2. **Cláusula Art. 28.3 RGPD ausente** — bloqueo legal para cualquier cliente (#2)
3. **Menores de edad sin protocolo** — riesgo clínico + legal (#3)
4. **TDEE=2000 fallback** — puede generar planes clínicamente incorrectos (#5)

Estos 4 items tienen un esfuerzo combinado estimado de **12–18 horas**.

---

### 📊 PUNTUACIÓN POR DIMENSIÓN

| Dimensión | Puntuación | Justificación |
|-----------|-----------|---------------|
| Cálculos clínicos | 7/10 | Fórmulas correctas; micronutrientes ausentes |
| Seguridad y RGPD | 7.5/10 | RLS + pseudonimización + audit logs; intake token vulnerable |
| UX y flujos | 7/10 | PWA excelente; dashboard sin búsqueda ni gráficas |
| Arquitectura | 6.5/10 | Resiliencia IA excelente; ignoreBuildErrors + deuda de tipos |
| **Media global** | **7/10** | |

---

### 🎯 RECOMENDACIÓN

> **Listo para beta cerrada (5–10 nutricionistas piloto conocidos) con las correcciones #1–#5 aplicadas. No escalar a lista de espera ni marketing activo hasta resolver los 10 puntos del Top 10.**

**Plan de acción:**
- **Esta semana (≈18 h):** Issues #1, #2, #3, #5 → beta privada con 5 nutricionistas
- **Semana 2 (≈15 h):** Issues #4, #6, #7, #8, #9, #10 → beta ampliada a 20 nutricionistas
- **Mes 2:** Gráfica de progreso, medicamentos estructurados, endpoint regenerar día → lista de espera pública

El producto tiene la columna vertebral correcta. Los competidores no tienen la combinación de IA + validación + RGPD. Las correcciones identificadas son todas incrementales — no requieren rediseño arquitectónico.

---

*Auditoría realizada el 22 de marzo de 2026 por 4 agentes especializados analizando el código fuente completo de Dietly.*
