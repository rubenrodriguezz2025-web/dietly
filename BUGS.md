# BUGS.md — Auditoría de bugs Dietly

> Auditoría realizada el 2026-03-23. Solo documenta bugs con evidencia directa de código.
> No arreglar hasta priorizar. Ver sección "Orden de prioridad" al final.

---

## 🔴 CRÍTICOS (rompen el flujo principal)

---

### BUG-001 — Variable de entorno equivocada en el middleware de Supabase

**Archivo**: `src/libs/supabase/supabase-middleware-client.ts:15`
**Flujo**: Todos (auth, middleware)

**Código**:
```typescript
const supabase = createServerClient(
  getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_URL'), // ← BUG
```

**Problema**: El segundo argumento de `getEnvVar` es el nombre de la variable que se imprime si falta.
Se pasa `'NEXT_PUBLIC_SUPABASE_URL'` en vez de `'NEXT_PUBLIC_SUPABASE_ANON_KEY'`.
Si la anon key falta en producción, el error dice "Missing NEXT_PUBLIC_SUPABASE_URL" (confuso),
y la causa real (anon key) queda oculta. Supabase recibirá la URL como anon key → sesiones rotas.

**Fix**: Cambiar `'NEXT_PUBLIC_SUPABASE_URL'` por `'NEXT_PUBLIC_SUPABASE_ANON_KEY'` en línea 15.

---

### BUG-002 — Query de suscripción sin filtro de usuario en la generación del PDF

**Archivo**: `src/app/api/plans/[id]/pdf/route.ts:75-87`
**Flujo**: Descargar PDF

**Código**:
```typescript
const { data: subscription } = await (supabase as any)
  .from('subscriptions')
  .select('status, price_id, prices(unit_amount, products(name))')
  .in('status', ['trialing', 'active'])
  .maybeSingle(); // ← Falta .eq('user_id', user.id)

const is_pro =
  subscription != null &&
  (productName.toLowerCase().includes('pro') || productName === ''); // ← '' = Pro
```

**Problema**: La query no filtra por `user_id`. Devuelve cualquier suscripción activa en la BD.
Consecuencia 1: Un usuario Basic puede ser detectado como Pro si otro usuario tiene suscripción activa.
Consecuencia 2: `productName === ''` es `true` cuando el nombre no se puede leer — cualquier usuario
con una suscripción activa (aunque sea de otro) queda clasificado como Pro automáticamente.
Con pocos usuarios esto puede no manifesarse; con más clientes romperá el modelo de negocio (Basic → PDF Pro gratis).

**Fix**: Añadir `.eq('user_id', user.id)` a la query.

---

### BUG-003 — Migraciones de BD sin aplicar pueden romper flujos de creación de pacientes y consentimientos

**Archivos**: `supabase/migrations/024_patient_consents.sql`, `supabase/migrations/025_fix_audit_trigger.sql`
**Flujo**: Crear paciente, Intake form

**Problema**: Ambos archivos están en el repo pero **sin commitear** (aparecen como `??` en `git status`).
Si la tabla `patient_consents` no existe en producción (migración 024 no aplicada), el INSERT de
consentimiento en `createPatient` (línea 131) y en `intake/submit` (línea 61) lanzará un error de BD.
El flujo de creación de paciente sí funciona (el error de consentimiento es no bloqueante),
pero los registros RGPD de consentimiento no se guardan → incumplimiento legal potencial.
Migration 025 contiene correcciones al trigger de auditoría; sin ella el trigger puede seguir roto.

**Fix**: Confirmar que ambas migraciones han sido aplicadas en Supabase. Commitear los archivos.

---

## 🟡 IMPORTANTES (dificultan el uso pero no lo impiden completamente)

---

### BUG-004 — Notificación de intake va a Dietly, no al nutricionista

**Archivo**: `src/app/api/intake/submit/route.ts:91-93`
**Flujo**: Enviar cuestionario de intake

**Código**:
```typescript
await resendClient.emails.send({
  from: 'Dietly <noreply@dietly.es>',
  to: 'hola@dietly.es', // ← ¡Va al equipo de Dietly, no al nutricionista!
  subject: `Paciente ha completado su cuestionario — ${paciente.name}`,
```

**Problema**: Cuando un paciente rellena el cuestionario de intake, la notificación llega
al email de Dietly (`hola@dietly.es`) pero NO al nutricionista responsable.
Contrasta con `followup/submit/route.ts` donde SÍ se notifica al nutricionista.
El nutricionista nunca sabe que su paciente ha completado el intake → tiene que revisar manualmente.

**Fix**: Obtener el email del nutricionista con `supabaseAdminClient.auth.admin.getUserById(paciente.nutritionist_id)`
y enviar la notificación a él (igual que hace followup/submit).

---

### BUG-005 — Consulta de paciente sin filtro de nutritionist_id (depende solo de RLS)

**Archivo**: `src/app/dashboard/patients/[id]/page.tsx:22-26`
**Flujo**: Vista de paciente

**Código**:
```typescript
const { data: patient } = (await (supabase as any)
  .from('patients')
  .select('*')
  .eq('id', id)   // ← Falta .eq('nutritionist_id', user.id)
  .single()) as { data: Patient | null };

if (!patient) notFound();
```

**Problema**: La query no valida que el paciente pertenece al nutricionista autenticado.
Si la RLS policy falla o está mal configurada, un nutricionista podría ver datos de pacientes de otro.
El comportamiento actual depende completamente de RLS para la seguridad.
Si la query devuelve `null` (porque RLS filtra), `notFound()` da un 404 genérico sin log — bugs de RLS
son difíciles de diagnosticar.

**Fix**: Añadir `.eq('nutritionist_id', user.id)` y log explícito cuando no se encuentra.

---

### BUG-006 — `dietary_restrictions` se guarda como string, esquema espera `text[]`

**Archivo**: `src/app/dashboard/patients/new/actions.ts:74`
**Flujo**: Crear paciente

**Código**:
```typescript
const dietary_restrictions =
  (formData.getAll('dietary_restrictions') as string[]).join(', ') || null;
```

**Problema**: El campo se convierte a string uniendo con `', '` (ej: `"gluten_free, vegan"`).
La CLAUDE.md documenta `dietary_restrictions text[]` (array de PostgreSQL).
El tipo TypeScript `Patient` lo define como `string | null`.
Hay inconsistencia: si el schema de BD es `text[]`, guardar un string puede fallar silenciosamente
o guardarse como un array de 1 elemento con toda la cadena. Si el schema es `text`, la UI que
lo muestra como tags puede no parsear correctamente.
**Impacto**: Las restricciones dietéticas podrían no enviarse correctamente al prompt de la IA.

**Fix**: Verificar el tipo real en Supabase y hacer coherente el insert (array vs string).

---

### BUG-007 — `font_preference` — error de tipo TypeScript que puede romper el PDF

**Archivo**: `src/app/api/plans/[id]/pdf/route.ts:59-70`
**Flujo**: Descargar PDF

**Error TypeScript** (confirmado con `tsc --noEmit`):
```
Type 'string | null | undefined' is not assignable to type 'FontPreference | null | undefined'.
```

**Problema**: El perfil se obtiene de Supabase como `string | null`, pero el componente PDF
espera `FontPreference` (enum/union type). Si la BD contiene un valor de fuente no reconocido
por el enum, el PDF renderer puede comportarse inesperadamente o lanzar error.
El `(supabase as any)` oculta el error en runtime.

**Fix**: Validar/castear `font_preference` antes de pasarlo al componente PDF.

---

### BUG-008 — La ruta `/derechos-datos` (pública para pacientes) apunta a una URL incorrecta

**Archivo**: `src/app/dashboard/derechos-datos/page.tsx:53`
**Flujo**: RGPD

**Código**:
```tsx
<a href='/derechos-datos' target='_blank' rel='noopener noreferrer'>
  Ver página del paciente →
</a>
```

**Problema**: El botón apunta a `/derechos-datos` pero esa ruta probablemente no existe como
página pública (está en `/dashboard/derechos-datos`). La página pública del paciente para ejercer
derechos RGPD podría estar en otra ruta o no estar implementada. El enlace daría 404 en producción.

**Fix**: Verificar qué ruta existe para la página pública de derechos, o implementarla si falta.

---

## 🟢 MENORES (detalles o mejoras)

---

### BUG-009 — Guards de ruta del middleware comentados (sin protección a nivel de middleware)

**Archivo**: `src/libs/supabase/supabase-middleware-client.ts:49-55`
**Flujo**: Auth

**Código**:
```typescript
// Add route guards here
// const guardedRoutes = ['/dashboard'];
// if (!user && guardedRoutes.includes(...)) { ... redirect('/login') }
```

**Problema**: El middleware no redirige a `/login` si el usuario no está autenticado.
La protección depende de cada página individualmente (`if (!user) redirect('/login')`).
Si se añade una nueva página en `/dashboard/` y se olvida el guard, queda pública.
No es un bug activo (todas las páginas actuales tienen su guard), pero es un riesgo latente.

**Fix** (menor): Descomentar y activar el guard de middleware para `/dashboard`.

---

### BUG-010 — Animaciones CSS inline en PWA del paciente con `both` fill-mode

**Archivo**: `src/app/p/[token]/page.tsx:184-192`
**Flujo**: PWA del paciente

**Código**:
```tsx
.anim-header   { animation: fadeIn  0.5s ease both; }
.anim-summary  { animation: fadeUp  0.5s 0.15s ease both; }
// ... etc
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }  // ← transform en 'to' con fill-mode: both
}
```

**Problema**: El mismo problema que se corrigió en `globals.css` (`both` → `backwards`):
`fill-mode: both` con `transform: translateY(0)` en `to` crea un stacking context.
Si en el futuro se añade un modal/toast a la PWA del paciente, aparecerá desplazado.
Actualmente no hay modales en la PWA, así que no es crítico.

**Fix**: Cambiar `both` por `backwards` en las animaciones de la PWA del paciente.

---

### BUG-011 — Posible XSS en emails de seguimiento (sin escapar HTML)

**Archivo**: `src/app/api/followup/submit/route.ts:93`
**Flujo**: Seguimientos

**Código**:
```typescript
const displayValue = value !== null && value !== ''
  ? String(value)
  : '<em ...>Sin respuesta</em>';
return `<tr><td>${label}</td><td>${displayValue}</td></tr>`;
```

**Problema**: Las respuestas del paciente se inyectan directamente en HTML del email sin escapar.
Un paciente malintencionado podría poner `<b>texto</b>` o incluso `<img src=x onerror=...>`.
Los clientes de email suelen sanitizar HTML, pero no todos.

**Fix**: Escapar `displayValue` con una función HTML-escape antes de interpolarlo.

---

### BUG-012 — La semana del plan siempre es "la próxima semana", incluso los lunes

**Archivo**: `src/app/api/plans/generate/route.ts:483-486`
**Flujo**: Generar plan

**Código**:
```typescript
const daysUntilMonday = ((8 - now.getDay()) % 7) || 7;
```

**Problema**: Cuando `now.getDay() === 1` (lunes), `((8 - 1) % 7) || 7` = `0 || 7` = `7`.
Si hoy es lunes, el plan se genera para el lunes siguiente (7 días después), no para esta semana.
Un nutricionista que genera un plan el lunes por la mañana verá la semana correcta,
pero puede causar confusión si lo genera el propio lunes.

**Fix** (muy menor, posiblemente intencional): Verificar si el comportamiento es deseado.
Si se quiere "esta semana" los lunes, cambiar `|| 7` por `|| 0`.

---

### BUG-013 — `intake/submit` guarda el cuestionario aunque falte el consentimiento RGPD

**Archivo**: `src/app/api/intake/submit/route.ts:15-48`
**Flujo**: Cuestionario de intake

**Código**:
```typescript
const { patient_id, answers, consent } = body;

if (!patient_id || !answers) {
  return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
}
// ← No valida que `consent === true`

const { error } = await (supabaseAdminClient as any).from('intake_forms').insert({...});
// El cuestionario se guarda aunque consent sea false/undefined
```

**Problema**: `consent` no se valida como campo obligatorio. El cuestionario se guarda
aunque el paciente no haya dado consentimiento. El registro de consentimiento es
condicional (`if (consent) { ... insert patient_consents ... }`), pero debería ser obligatorio
para cumplir RGPD (datos de salud = categoría especial, Art. 9 RGPD).

**Fix**: Añadir validación `if (!consent) return { error: 'El consentimiento es obligatorio.' }`.

---

## Resumen ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico | 3 |
| 🟡 Importante | 5 |
| 🟢 Menor | 5 |
| **Total** | **13** |

---

## Orden de prioridad para arreglar

### Semana 1 — Críticos (bloquean negocio o compliance legal)
1. **BUG-001** — Variable env anon key errónea en middleware (30 min)
2. **BUG-002** — Subscription sin user_id → usuarios Basic obtienen PDF Pro gratis (30 min)
3. **BUG-003** — Confirmar migraciones 024/025 aplicadas en Supabase (verificación manual)

### Semana 2 — Importantes (UX o datos)
4. **BUG-004** — Notificación intake al nutricionista, no a Dietly (1h)
5. **BUG-006** — `dietary_restrictions` string vs array (verificar schema + fix 30 min)
6. **BUG-005** — Añadir `nutritionist_id` filter en query de paciente (15 min)
7. **BUG-007** — Validar/castear `font_preference` antes del PDF (30 min)
8. **BUG-008** — Verificar/crear ruta pública `/derechos-datos` (1h)

### Backlog — Menores
9. **BUG-013** — Validar consent obligatorio en intake submit (15 min) ← más importante de los menores por RGPD
10. **BUG-009** — Activar guards de middleware (15 min)
11. **BUG-011** — Escapar HTML en emails de seguimiento (15 min)
12. **BUG-010** — Fix animaciones PWA del paciente (15 min)
13. **BUG-012** — Fecha de plan en lunes (verificar si es intencional)

---

## Flujos auditados sin bugs detectados

| Flujo | Estado |
|-------|--------|
| Auth (login, registro, onboarding) | ✅ OK |
| Cuestionario inline en dashboard | ✅ OK |
| Generación de plan (lógica IA, pseudonimización, resiliencia) | ✅ OK |
| Aprobar plan (server action, RLS, toast) | ✅ Corregido en sesión actual |
| Compartir por WhatsApp | ✅ OK (wa.me link correcto) |
| PWA del paciente `/p/[token]` | ✅ OK (sin bugs críticos) |
| Recetario CRUD | ✅ OK (RLS con nutritionist_id correcto) |
| Seguimientos (envío + email nutricionista) | ✅ OK |
| Borrado RGPD paciente (cascade, auditoría) | ✅ OK |
| Derechos de datos (dashboard) | ✅ Parcial (ver BUG-008) |
| Enviar plan al paciente por email | ✅ OK |
