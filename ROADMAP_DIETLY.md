# 🗺️ ROADMAP DIETLY
> Última actualización: 31 marzo 2026

---

## ESTADO ACTUAL

- **Fase**: Beta cerrada
- **Usuarios beta**: 4 contactadas, objetivo 8
- **DEMO_MODE**: true (precios ocultos)
- **Modelo**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

---

## 🔴 PRIORIDAD MÁXIMA — ANTES DE CERRAR BETA

### 1. Intercambio de platos
**Por qué**: pedido explícitamente por sanalu_nutricion (beta user). Todos los competidores establecidos lo tienen (Nutrium, INDYA, Dietopro, ICNS). Sin esto Dietly pierde en la conversación de ventas.
**Qué es**: sustituir una comida del plan por otra alternativa con macros equivalentes (mismas kcal ±5%, mismo grupo de alimento principal).
**Complejidad**: alta — requiere base de recetas etiquetadas + algoritmo de matching + UI en editor de planes.

### 2. Verificar migraciones 024/025 en producción
**Por qué**: pueden estar pendientes de aplicar en Supabase producción.
**Qué es**: ejecutar `024_patient_consents.sql` y `025_fix_audit_trigger.sql` en Supabase SQL Editor si no están aplicadas.

### 3. Añadir STRIPE_PRICE_PRO_ID a Vercel y .env.local
**Por qué**: necesario para que la detección Pro por price_id funcione correctamente.
**Valor**: `price_1I8Mp81JVMxXq3vxcbxAv1CN`

### 4. Cláusula Art. 28.3 RGPD completa en T&Cs
**Por qué**: obligatorio para procesar datos de salud como encargado del tratamiento.
**Qué es**: añadir las letras a-h del Art. 28.3 RGPD en los Términos y Condiciones.

### 5. Plantilla consentimiento informado descargable
**Por qué**: el nutricionista necesita darlo a firmar a sus pacientes (obligación legal).
**Qué es**: PDF descargable con plantilla de consentimiento informado para que el nutricionista lo use con sus pacientes.

---

## 🟠 POST-BETA — ANTES DEL LANZAMIENTO PÚBLICO

### 6. Fotos de platos con Gemini Imagen 3
**Por qué**: diferenciador visual único vs todos los competidores. Solo INDYA tiene fotos (9.000 recetas manuales).
**Estado**: código implementado en `/api/meal-image`, pausado por billing de Gemini API.
**Coste estimado**: ~0.03-0.04$/imagen cuando se active. Con 10 usuarios activos generando planes: céntimos al mes.
**Acción**: activar billing en Google AI Studio y descomentar el bloque en `approvePlan()`.

### 7. BEDCA integrada
**Por qué**: base de datos oficial española de composición de alimentos. Solo Almendra y ICNS la tienen. Argumento de venta clínico importante.
**Complejidad**: alta — requiere acceso a la API de BEDCA o importación masiva de datos.

### 8. Micronutrientes básicos en el plan
**Por qué**: Nutrium, ICNS y Nutriolift los muestran. Argumento clínico relevante.
**Qué incluir**: vitaminas principales (A, C, D, B12), minerales (hierro, calcio, zinc), fibra.

### 9. Warm-up dominio email
**Por qué**: emails de Dietly pueden ir a spam por ser dominio nuevo sin reputación.
**Herramientas**: Warmup Inbox, Mailreach o Lemwarm (~20-50$/mes).
**Alternativa gratis**: añadir beta users como contactos en Resend y pedirles que marquen el email como "No es spam".

### 10. Security-reviewer audit
**Por qué**: antes de lanzamiento público con datos de salud reales.
**Cómo**: `curl -o ~/.claude/agents/security-reviewer.md https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/security-reviewer.md`

---

## 🟡 ROADMAP POST-BETA (por orden de impacto)

### Producto

| # | Feature | Impacto | Complejidad | Notas |
|---|---------|---------|-------------|-------|
| 1 | Intercambio de platos desde PWA del paciente | Alto | Media | Extensión del intercambio del dashboard |
| 2 | Diario alimentario con fotos del paciente | Alto | Alta | Competidor: Nutrium, ICNS |
| 3 | Gestión de pagos integrada | Alto | Media | Stripe + facturación fiscal española |
| 4 | Agenda: estados de cita y recordatorios | Medio | Baja | Bug actual 5/10 |
| 5 | PWA offline (Service Worker) | Medio | Media | Cuando no hay conexión |
| 6 | Caché PDF en Supabase Storage | Medio | Baja | No regenerar si no hay cambios |
| 7 | Pliegues cutáneos y composición corporal | Medio | Baja | Competidor: Nutrium, Nutrify |
| 8 | Tracking adherencia (marcar comidas) | Medio | Media | El paciente marca comidas completadas |
| 9 | Objetivo peso con fecha y gráfico | Medio | Baja | Motivación del paciente |
| 10 | Etiquetas/tags de pacientes | Bajo | Baja | Organización consulta grande |
| 11 | Suplementos en el plan | Bajo | Media | Competidor: INDYA, Nutrify |
| 12 | Alimentos a evitar con chips visuales | Bajo | Baja | UX mejora |
| 13 | Aprendizaje continuo de planes | Alto | Muy Alta | Requiere 500+ usuarios + 500+ planes aprobados |
| 14 | Verificación colegiación CGCODN | Medio | Alta | Integración con colegio oficial |
| 15 | Ampliar acceso: técnicos, estudiantes, farmacéuticos | Alto | Baja | Solo cambio de validación |

### Técnico

| # | Tarea | Prioridad | Notas |
|---|-------|-----------|-------|
| 1 | Consolidar /lib/ y /libs/ | Media | Deuda técnica |
| 2 | 92 queries duplicadas en 42 archivos | Media | Deuda técnica |
| 3 | ISR en /p/[token] | Baja | Performance |
| 4 | White-label URL paciente | Alta | Feature Pro — subdominio propio por nutricionista |

### Marketing y distribución

| # | Acción | Timing | Notas |
|---|--------|--------|-------|
| 1 | Crear @dietly.es en Instagram | Inmediato | Logo árbol verde |
| 2 | Post 1: carrusel dolor (Canva/Gemini) | Esta semana | Plantilla preparada |
| 3 | Contactar Nuttralia/Ibilbidea | Esta semana | Telegram D-N emprendedoras |
| 4 | Contactar CODiNuCoVa | Este mes | 1.226 colegiados Valencia |
| 5 | Cerrar 8 beta users | Urgente | 4 contactadas, 4 pendientes |

---

## 🔵 FASE 3 — DIFERENCIADORES ÚNICOS (500+ usuarios)

### Ajuste dinámico por feedback WhatsApp
El nutricionista manda un WhatsApp con cambios del paciente ("bajó 2kg, más energía") y la IA ajusta el plan automáticamente.

### Contestador automático WhatsApp con IA
El paciente pregunta por WhatsApp y la IA responde basándose en su plan nutricional. El nutricionista supervisa y puede intervenir.

### Lectura de analíticas con PDF de sangre
El nutricionista sube el PDF de análisis de sangre del paciente y la IA lo interpreta nutricional​mente y ajusta el plan.

---

## 🟣 REBRANDING — POST-BETA

### Nombre: SABEA
- **Significado**: hebreo "satisfecho/lleno" — narrativa perfecta para nutrición
- **TMview**: verificado sin conflictos en EUIPO clases 9, 42, 44
- **sabea.es**: disponible (~10€/año) — registrar antes del lanzamiento
- **sabea.app**: disponible (~15$/año) — para LATAM e internacional
- **sabea.com**: registrado desde 2002 — negociar cuando haya caja (~500-5.000$)
- **sabea.io / sabea.co**: alternativas disponibles

### Estrategia de dominios
```
sabea.app → dominio principal (internacional, SEO)
sabea.es  → redirige a sabea.app (mercado español)
```

### Timing
- Mantener "Dietly" durante toda la beta
- Registrar sabea.es + sabea.app antes del lanzamiento público (~25€ total)
- Cambiar nombre, logo y dominio en el lanzamiento público

---

## 💰 PROYECCIONES FINANCIERAS

| Período | MRR | Usuarios | Neto en mano |
|---------|-----|----------|--------------|
| Mes 3 | 920€ | ~10-15 | ~500€ |
| Mes 6 | 2.945€ | ~35-40 | ~1.793€ |
| Mes 12 | 8.500€ | ~95-100 | ~5.031€ |

**EBITDA margin**: ~90-95%
**Precio**: 46€/mes Básico (30 pacientes) / 89€/mes Pro (ilimitado)
**Trial**: 14 días gratis sin tarjeta

---

## 📊 MÉTRICAS DE ÉXITO BETA

| Métrica | Objetivo |
|---------|----------|
| Beta users activas | 8 |
| Planes generados por user/semana | ≥2 |
| NPS beta users | ≥8/10 |
| Bugs críticos | 0 |
| Tiempo onboarding (registro → primer plan) | <10 min |

---

*Actualizado: 31 marzo 2026*
