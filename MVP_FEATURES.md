# Dietly — Features MVP priorizadas
## Basadas en quejas reales de usuarios de la competencia

> **Criterio de priorización**: cada feature responde a una queja documentada de usuarios reales
> de Nutrium, NutriAdmin, Dietopro o INDYA. Si no responde a una queja real, no está en el MVP.
>
> **Imágenes y logos**: se abordan en fase post-MVP. El MVP usa placeholders genéricos.

---

## BLOQUE 1 — Generación de planes con IA
*Diferenciador principal. Ningún competidor lo hace bien.*

### F-01 · Generación plan semanal completo en <2 minutos
**Queja que resuelve**: NutriAdmin solo genera recetas sueltas. Dietopro tarda 20+ minutos arrastrando alimentos. Nutrium es 100% manual.
**Comportamiento esperado**: el nutricionista pulsa "Generar plan" → Claude API genera los 7 días con comidas, ingredientes en gramos y preparación → aparece en pantalla con progreso visible (día 1... día 2... día 3...).
**Criterio de éxito**: plan completo generado en menos de 3 minutos desde que se pulsa el botón.
**Notas técnicas**: 7 llamadas separadas a Claude API (una por día). Structured Outputs JSON garantizado. Si un día falla, reintentar ese día solo.

### F-02 · Comidas con kcal y macros visibles siempre
**Queja que resuelve**: *"Clients have no clue what their kcal level is for each meal nor the macros"* — reviewer Nutrium, queja #1. Dietopro tampoco muestra totales por comida.
**Comportamiento esperado**: cada comida muestra siempre: kcal totales + proteínas + carbohidratos + grasas. Tanto en la vista del nutricionista como en la PWA del paciente. Sin necesidad de hacer clic.
**Criterio de éxito**: un nutricionista que ve el plan por primera vez entiende los macros de cada comida sin tocar nada.

### F-03 · Ingredientes con cantidades siempre visibles
**Queja que resuelve**: *"Al hacer clic en una receta de Dietopro no se ven las cantidades de ingredientes"*.
**Comportamiento esperado**: cada comida lista sus ingredientes con cantidad en gramos y medida casera ("200g de pechuga de pollo — aprox. 1 filete mediano"). Sin clics adicionales.

### F-04 · Sin comidas en blanco
**Queja que resuelve**: Dietopro a veces deja comidas vacías cuando el SEA no encuentra recetas que encajen.
**Comportamiento esperado**: el LLM siempre genera algo, aunque sea una comida sencilla. Si Claude devuelve una comida vacía o con menos ingredientes de los esperados, la UI lo marca en rojo y permite regenerar esa comida concreta.
**Notas técnicas**: validar en backend que cada comida tenga mínimo 2 ingredientes y calorías > 0 antes de guardar.

---

## BLOQUE 2 — Experiencia del nutricionista
*El software que el profesional usa cada día. Si frustra, se va.*

### F-05 · Onboarding en menos de 5 minutos
**Queja que resuelve**: todos los competidores tienen curva de aprendizaje alta. Dietopro necesita formación. NutriAdmin tiene documentación extensa.
**Comportamiento esperado**: registro → 3 pasos de onboarding (nombre + especialidad + primer paciente de prueba) → primer plan generado → todo en menos de 5 minutos. Sin configuración técnica requerida.
**Criterio de éxito**: un nutricionista que nunca ha visto Dietly genera su primer plan en la primera sesión sin pedir ayuda.

### F-06 · Ficha de paciente con anamnesis estructurada
**Queja que resuelve**: Ley 41/2002 obliga a mantener historia clínica por paciente. Los competidores que no la tienen bien estructurada generan trabajo manual.
**Campos obligatorios**: nombre, email, fecha nacimiento, sexo, peso, altura, nivel actividad, objetivo principal.
**Campos opcionales**: restricciones dietéticas, alergias, intolerancias, preferencias (texto libre), notas médicas (texto libre).
**Campos calculados automáticamente**: TMB (Mifflin-St Jeor), TDEE, distribución macro según objetivo.

### F-07 · Editor de plan post-generación
**Queja que resuelve**: ningún competidor permite editar el plan generado automáticamente de forma sencilla. O es manual desde cero o no se puede tocar.
**Comportamiento esperado**: el nutricionista puede editar el texto de cualquier comida directamente (nombre, preparación, notas). Los macros se marcan como "editados manualmente" si cambia ingredientes.
**Notas técnicas**: edición de texto libre en Semana 4. Recálculo automático de macros al editar ingredientes está fuera del MVP.

### F-08 · Dashboard con lista de pacientes y estado de planes
**Comportamiento esperado**: pantalla de inicio muestra: pacientes activos, planes en estado `draft` pendientes de revisar, planes enviados este mes. Acceso rápido al paciente más reciente.
**Criterio de éxito**: un nutricionista con 20 pacientes sabe de un vistazo qué tiene pendiente.

---

## BLOQUE 3 — Entrega al paciente
*Donde el nutricionista "vende" el valor de su servicio. Si el paciente no lo percibe, cancela.*

### F-09 · PWA del paciente (vista móvil del plan)
**Queja que resuelve**: *"La App móvil para los pacientes es lo que más me ha ayudado a conseguir clientes"* — usuario Dietopro. NutriAdmin no tiene app y los revisores lo señalan como su mayor debilidad.
**Comportamiento esperado**: el paciente recibe un email con un link único (`/p/[token]`). Abre en el móvil y ve:
- Plan semanal navegable por días
- Cada comida con nombre, hora sugerida, kcal + macros visibles (resuelve F-02)
- Ingredientes con cantidades (resuelve F-03)
- Instrucciones de preparación
- Lista de compra agrupada por categoría
- Puede "añadir a pantalla de inicio" (PWA manifest)
**Sin login requerido** para el paciente — solo el link con token único.
**Notas técnicas**: página Next.js `/app/p/[token]/page.tsx` + `manifest.json` + service worker básico. 1-2 días de desarrollo, no app nativa.

### F-10 · PDF con marca del nutricionista
**Queja que resuelve**: todos los competidores ofrecen PDF pero la personalización es limitada o requiere plan premium.
**Comportamiento esperado**:
- **Plan Básico (€46/mes, 30 pacientes)**: PDF con logo genérico de Dietly + nombre del nutricionista + nombre de la clínica
- **Plan Profesional (€89/mes, ilimitado)**: PDF con logo propio del nutricionista + color primario personalizado en cabeceras
- El PDF incluye: portada, resumen semanal (kcal + macros objetivo), plan día por día, lista de compra
**Notas técnicas**: `@react-pdf/renderer` server-side. Testar en Vercel el DÍA 1 del proyecto. Si falla, activar plan B: `usePDF` hook client-side.
**Imágenes en PDF**: placeholder genérico en MVP. Fotos de comidas en versión post-MVP.

### F-11 · Envío de plan por email al paciente
**Comportamiento esperado**: botón "Enviar al paciente" → genera PDF si no existe → envía email con Resend con PDF adjunto + link a la PWA. El nutricionista ve confirmación de envío y la fecha queda registrada.
**Notas técnicas**: Resend attachment en base64, máximo 40MB (el PDF no debería superar 2MB).

---

## BLOQUE 4 — Operaciones de la consulta
*Lo que el nutricionista necesita para gestionar su negocio. La combinación que ningún competidor resuelve completa.*

### F-12 · Cobros integrados con Stripe
**Queja que resuelve**: ni Nutrium, ni Dietopro, ni INDYA tienen procesamiento de pagos integrado. El nutricionista usa Bizum + Excel o un TPV separado.
**Comportamiento esperado**: el nutricionista puede crear un "enlace de pago" para cada paciente → el paciente paga online → queda registrado en su ficha. Opcional en MVP — si Stripe checkout ya viene en el boilerplate, incluirlo; si requiere trabajo extra, mover a Sprint 2.
**Notas técnicas**: el boilerplate `next-supabase-stripe-starter` ya incluye Stripe. Reutilizar para pagos de pacientes, no solo para la suscripción de Dietly.

### F-13 · Agenda / calendario de citas
**Queja que resuelve**: INDYA no tiene agenda. Los usuarios de otros competidores usan Google Calendar por separado.
**Comportamiento esperado**: vista calendario mensual/semanal. El nutricionista crea citas vinculadas a pacientes. El paciente recibe recordatorio por email automático 24h antes.
**Notas técnicas**: calendario propio básico en Semana 6. Sin integración Google Calendar en MVP (próxima versión).

### F-14 · Cuestionario de intake automatizado
**Queja que resuelve**: el nutricionista dedica tiempo de consulta a preguntar datos básicos que el paciente podría rellenar antes.
**Comportamiento esperado**: el nutricionista envía un link al nuevo paciente → el paciente rellena sus datos (los mismos campos de F-06) → se crea su ficha automáticamente → el nutricionista solo revisa y confirma.
**Notas técnicas**: formulario público `/intake/[token]` que escribe en la tabla `patients`. Semana 7.

---

## BLOQUE 5 — Confianza y compliance
*Lo que hace que el nutricionista no tenga miedo de usar el producto con sus pacientes.*

### F-15 · Posicionamiento siempre como herramienta profesional
**Queja que resuelve**: el mayor riesgo legal y de adopción. Si parece que la IA "hace el trabajo del nutricionista", los colegios profesionales pueden oponerse y los propios nutricionistas no confiarán.
**Comportamiento esperado**: en cada pantalla donde aparece un plan generado, el UI muestra: *"Borrador generado por IA · Revisado y aprobado por [nombre nutricionista]"*. El botón de envío al paciente solo está activo cuando el plan está en status `approved` (no `draft`).
**Copy en toda la app**: "Dietly genera el borrador. Tú lo revisas y lo firmas."

### F-16 · Gestión RGPD básica
**Queja que resuelve**: Ley 41/2002 + LOPDGDD. Los datos de salud son categoría especial. El nutricionista necesita cobertura legal.
**Comportamiento esperado**:
- Botón "Borrar paciente y todos sus datos" (derecho al olvido, RGPD Art. 17)
- Exportar ficha completa de paciente en PDF (RGPD Art. 20)
- T&Cs con cláusula de encargado del tratamiento visible en el registro
- Plantilla de consentimiento informado descargable para que el nutricionista lo dé a firmar a sus pacientes

### F-17 · 100% español nativo
**Queja que resuelve**: NutriAdmin solo en inglés. Nutrium tiene traducciones parciales.
**Comportamiento esperado**: toda la UI, emails, PDFs, PWA del paciente y mensajes de error en español. Opción de cambiar a inglés en configuración (para mercado LATAM futuro, no MVP).

---

## Resumen de prioridades por semana

| Semana | Features | Objetivo |
|--------|----------|----------|
| 1 | Setup + test PDF Vercel + schema DB + auth | Infraestructura lista |
| 2 | F-06 Ficha paciente + F-08 Dashboard | Gestión pacientes |
| 3 | F-01 Generación IA + F-02 Macros visibles + F-03 Ingredientes + F-04 Sin blancos | Core del producto |
| 4 | F-07 Editor plan + F-15 Posicionamiento + F-17 Español | Revisión y polish |
| 5 | F-09 PWA paciente + F-10 PDF + F-11 Email | Entrega al paciente |
| 6 | F-12 Cobros Stripe + F-05 Onboarding | Operaciones |
| 7 | F-13 Agenda + F-14 Cuestionario intake + F-16 RGPD | Consulta completa |
| 8 | Testing + bugs + F-16 RGPD + landing page + launch | Lanzamiento |

**Timeline realista: 10-12 semanas** si hay imprevistos (y siempre los hay).
Las semanas 3 y 5 son las más críticas — si se atascan, el resto se desplaza.

---

## Features descartadas del MVP (con razón)

| Feature | Razón |
|---------|-------|
| App nativa iOS/Android | PWA (F-09) resuelve el 80% del valor con el 5% del esfuerzo |
| Base datos BEDCA/USDA integrada | Claude API genera macros con ~1.5% error, suficiente para MVP |
| Recálculo automático de macros al editar | Complejidad alta, bajo impacto en adopción inicial |
| Integración wearables (Strava, Apple Health) | Nicho deportivo, no es el target principal |
| ~~Historial de progreso del paciente~~ | ✅ Implementado (patient_progress + migraciones 010, 038) |
| OAuth social (Google, Apple) | Email/password suficiente en MVP |
| Plan anual Stripe | Optimización de revenue, no de adopción |
| Templates de dieta preconfigurados | La IA los hace dinámicos, los templates son el workaround del problema |
| Imágenes de comidas y logos personalizados | Pospuesto explícitamente. Se aborda en fase post-MVP |
| Chat en tiempo real | Email + PWA suficiente para MVP |
| Cuentas de equipo multi-nutricionista | Clínicas grandes, no el target inicial |
| Módulo vademécum fármacos-nutrientes | Moat de Dietopro, requiere datos y tiempo |

---

*Última actualización: 8 abril 2026 (precios actualizados: 46€/89€, límite 30 pacientes en Básico)*
*Documento original de Semana 0 — los features F-01 a F-17 están mayoritariamente implementados (ver AUDIT_BETA_FINAL.md)*
