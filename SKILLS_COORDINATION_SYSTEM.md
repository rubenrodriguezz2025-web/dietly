\# Dietly — Sistema de coordinación de skills



> Guía ejecutable para coordinar las 40+ skills instaladas en `.agents/skills/` y automatizar de forma sensata 4 frentes simultáneos: \*\*Landing, Software interno, Outreach, Contenido\*\*.

>

> \*\*Fecha\*\*: 14 abril 2026

> \*\*Versión\*\*: v1 (post-instalación Karpathy + Vercel React Best Practices + Google Ads Spain)

> \*\*Para\*\*: Rubén, ejecución cuando vuelva



\---



\## 0. Filosofía del sistema — leer primero



Este documento NO es un sistema de orquestación automática. Es un \*\*manual de activación coordinada de skills según fase del negocio\*\*.



\*\*Por qué no orquestación automática\*\* (la decisión más importante de este doc):

\- Tienes \*\*0 clientes de pago\*\*. Automatizar tareas que aún no has hecho manualmente = optimizar prematuramente.

\- Claude Code ya activa skills solo si están instaladas y bien descritas. No necesitas un meta-sistema encima.

\- La coordinación real entre áreas la haces \*\*tú\*\* con este doc como guía, no un agente.



\*\*Qué SÍ automatizamos\*\*:

\- El orden mental y cronológico de activación de skills

\- Prompts maestros listos para copiar-pegar

\- Reglas de "esta skill siempre se activa con esta otra"

\- Criterios claros de cuándo pasar a la siguiente fase



\*\*Qué NO automatizamos\*\* (y por qué):

\- Ejecución sin supervisión humana (riesgo de romper producción)

\- Decisiones de estrategia de producto (las tomas tú)

\- Outreach automatizado (Instagram te banea)

\- Publicación de contenido (riesgo reputacional)



\---



\## 1. Inventario consolidado de skills



Total: \*\*43 skills\*\* agrupadas por función (no por ubicación filesystem).



\### 1.1 Skills técnicas (código / arquitectura)



| Skill | Función | Cuándo se activa |

|-------|---------|------------------|

| `karpathy-guidelines` (en `CLAUDE.md`) | Evitar supuestos, simplicity first, surgical changes, goal-driven | \*\*Siempre\*\* — es base de comportamiento |

| `vercel-react-best-practices` | 64 reglas Next.js/React performance | Cualquier código Next.js, API routes, SSR, re-renders |

| `frontend-design` | Crear UI landing / componentes creativos con alto craft | Landing, componentes marketing, páginas nuevas |

| `UI UX Pro Max` | Principios UI/UX generales | Pre-trabajo a cualquier pantalla |

| `polish` | Acabado fino de UI existente | Pasada final a una pantalla antes de demo/launch |

| `animate` | Animaciones + transiciones | Si la pantalla necesita movimiento |

| `colorize` | Cambios de color / branding | Ajustes de paleta (primary\_color por nutri, etc.) |

| `GSAP` | Animaciones complejas GSAP | Landing hero, transiciones avanzadas |

| `nano-banana-2` | Generación imágenes AI para interfaces | Placeholders, hero images, fotos de comida |

| `Pixel Perfect UI` | Medición exacta, spacing, alineación | Refinamiento pre-launch |

| `google-ads-spain` | Google Ads España: IVA 21%, CC.AA., pujas, copy | \*\*Fase 3 only\*\* — cuando vayas a Google Ads |



\### 1.2 Skills de marketing (copy, estrategia, outreach)



| Skill | Función | Cuándo se activa |

|-------|---------|------------------|

| `copywriting` | Redacción persuasiva | Landing copy, emails, DMs, posts |

| `social-content` | Contenido redes sociales (IG, TikTok, LinkedIn) | Posts Instagram, reels, carousels |

| `content-strategy` | Plan editorial, calendario contenido | Diseñar calendario 4-6 semanas Instagram |

| `cold-email` | Emails fríos B2B | Outreach email a nutricionistas + partnerships CODiNuCoVa |

| `sales-enablement` | Scripts de demo, objeciones, pitch | Preparar demo 15 min cuando empiecen a responder |

| `marketing-psychology` | Principios Cialdini, sesgos cognitivos | Revisión final de cualquier copy crítico |

| `lead-magnets` | Crear assets para capturar leads | Plantilla consentimiento RGPD (pendiente tuyo), guía nutricionista |

| `lead-research-assistant` | Research de prospects | Fase 2 outreach (siguientes 50 leads post-primeros 10) |

| `competitor-alternatives` | Páginas "X vs Y" SEO | Post-rebrand Sabea: "Sabea vs Nutrium" |

| `competitive-ads-extractor` | Espiar ads de competencia en Meta Ad Library | Research periódico de Nutrium/Dietopro |

| `meta-ads-analyzer` | Análisis de campañas Meta propias | \*\*No aplica\*\* hasta que tengas campaigns |

| `ad-creative` | Diseño creatividades para ads | Cuando toque creatividades para Google Ads |

| `paid-ads` | Estrategia general paid | Fase 3 |

| `launch-strategy` | Estrategia de lanzamiento público | Pre-launch Sabea |



\### 1.3 Skills de conversión / funnel



| Skill | Función | Cuándo se activa |

|-------|---------|------------------|

| `page-cro` | Optimización conversión landing | Post primeros 10 DMs, con datos reales de visitantes |

| `signup-flow-cro` | Optimización flujo signup | Cuando analytics muestren dónde cae gente |

| `onboarding-cro` | Optimización onboarding post-signup | Cuando tengas 5+ nutri onboardeando |

| `churn-prevention` | Reducir cancelaciones | \*\*No aplica\*\* hasta tener 10+ pagos |

| `referral-programs` | Programa de referidos | \*\*No aplica\*\* hasta tener 10+ clientes contentos |

| `email-sequence` | Secuencias email automatizadas | Cuando configures Resend para nurturing post-trial |

| `pricing-strategy` | Estrategia de precios | Cuando validar si subes/bajas Pro 89€ |



\### 1.4 Skills SEO (post-launch Sabea)



| Skill | Función | Cuándo se activa |

|-------|---------|------------------|

| `seo-audit` | Auditoría SEO técnica | Post-migración Sabea |

| `ai-seo` / `programmatic-seo` | SEO generativo + automatizado | Post-Sabea, creación masiva de landings |

| `schema-markup` | Structured data JSON-LD | Landing principales Sabea |

| `geo-seo-claude` (recomendado post-launch) | GEO para ChatGPT/Perplexity/Claude | Tras migrar a sabea.app |



\### 1.5 Skills de producto (documentos, deliverables)



| Skill | Función | Cuándo se activa |

|-------|---------|------------------|

| `docx` | Crear Word | Plantilla consentimiento RGPD descargable |

| `pptx` | Crear PowerPoint | Proyecto académico CEI Valencia (ya usas Gamma en su lugar) |

| `pdf` | Manipular PDFs | Plantilla consentimiento, exportaciones |

| `xlsx` | Crear spreadsheets | Tracker de leads, dashboards de métricas |

| `file-reading` | Leer archivos subidos | Procesar PDFs de analíticas (feature futura) |

| `pdf-reading` | Leer PDFs específicamente | Feature blood test PDF reading (post-launch) |



\---



\## 2. Arquitectura de coordinación — las 4 áreas

&#x20;                     DIETLY

&#x20;                       |

&#x20;   +-------------------+-------------------+

&#x20;   |          |                |           |

&#x20;LANDING   SOFTWARE        OUTREACH     CONTENIDO

&#x20;(público) INTERNO         (directo)    (Instagram)

&#x20;   |          |                |           |

&#x20;copywrtg  karpathy          cold-email  social-content

&#x20;frontend  vercel-react      copywriting content-strategy

&#x20;page-cro  frontend-design   sales-enab  copywriting

&#x20;colorize  polish            marketing-  marketing-psychology

&#x20;nano-ban  UI UX Pro Max      psychology ad-creative (cuando aplique)

&#x20;GSAP      animate           lead-resrch

&#x20;PPU       colorize           competitor-ads-ext



Cada una tiene su \*\*núcleo de skills\*\* (siempre activas en esa área) y \*\*skills satélite\*\* (se activan según tarea específica).



\---



\## 3. LANDING — coordinación completa



\### 3.1 Estado actual

\- `/` landing genérica del boilerplate

\- `/pricing` con `DIETLY\_PLANS` como SoT

\- Sin tráfico real (0 clientes pago)

\- Dominio `dietly.es` (temporal hasta Sabea)



\### 3.2 Objetivo

Que un nutricionista que llega desde DM/post entienda en 10 segundos qué hace Dietly, decida si le vale, y pida la demo.



\### 3.3 Orden de skills a activar (secuencial, no paralelo)



\*\*Paso 1 — Estrategia\*\* (antes de escribir nada)

\- Skills: copywriting + marketing-psychology

\- Input: análisis competitivo + arquetipos CSV leads-v1

\- Output: nuevo headline + subheadline + value prop de 3 líneas



\*\*Paso 2 — Estructura UI\*\*

\- Skills: frontend-design + UI UX Pro Max

\- Input: headline aprobado + arquetipos destilados

\- Output: wireframe secciones (hero, social proof, features, pricing, CTA)



\*\*Paso 3 — Implementación visual\*\*

\- Skills: frontend-design + colorize + GSAP (si aplica animación)

\- Input: wireframe aprobado + primary\_color Dietly (#1a7a45)

\- Output: componentes React de cada sección



\*\*Paso 4 — Pulido final\*\*

\- Skills: polish + Pixel Perfect UI + animate

\- Input: landing funcional

\- Output: detalles, micro-interacciones, spacing perfecto



\*\*Paso 5 — CRO\*\* (solo cuando tengas ≥50 visitantes/semana reales)

\- Skills: page-cro + copywriting

\- Input: analytics de dónde cae la gente

\- Output: ajustes específicos con hipótesis medibles



\### 3.4 Prompt maestro — rediseño landing

/model opus

Lee en este orden:



CLAUDE.md (incluye karpathy-guidelines al final)

.agents/skills/copywriting/SKILL.md

.agents/skills/marketing-psychology/SKILL.md

.agents/skills/frontend-design/SKILL.md

.agents/skills/UI UX Pro Max/SKILL.md

outreach/leads-v1-analysis.md (arquetipos y copy real)

.agents/product-marketing-context.md



TAREA: Rediseñar la landing de Dietly (src/app/(marketing)/page.tsx

y componentes asociados) partiendo de estos principios:



HEADLINE: no inventes — úsalo derivado de la cita literal

de David Baena archivada en leads-v1-analysis.md sección 7.

El pitch literal en boca de un nutricionista real es:

"Tú decides cómo quieres preparar los platos cada semana,

dentro de los márgenes establecidos."

ARQUETIPO PRINCIPAL: Arquetipo 1 del analysis.md (autónoma

individual con abanico amplio + web activa). Secundario:

Arquetipo 2 (deportivo técnico).

SECCIONES EN ESTE ORDEN:



Hero: headline + subheadline + 1 CTA principal

Problema (3 pain points de top 5 dolores del analysis)

Cómo funciona (3 pasos: IA genera / tú ajustas / paciente recibe)

Pruebas (testimonios si existen, si no, datos: 2 min vs 1-3h)

Pricing (reusar PricingSection existente)

CTA final (demo 15 min)





RESTRICCIONES DE DISEÑO:



Primary color Dietly: #1a7a45

Dark + light mode

Typography distintiva (no Inter, no Roboto — elige una

característica)

Sin "AI slop aesthetic": no purple gradients, no genérico

Animaciones: usa frontend-design + animate skills juntas





PRINCIPIOS KARPATHY OBLIGATORIOS:



Pregúntame cualquier supuesto no resuelto ANTES de codear

Simplicity first: si 200 líneas pueden ser 50, hazlas 50

Surgical changes: no toques código de /dashboard ni /api

Success criteria: "landing pasa el squint test de frontend-design"





REGLAS VERCEL REACT BEST PRACTICES:



Server Components por defecto

"use client" solo donde hay interactividad real

Si hay data fetch, usar Promise.all si son independientes

Lazy load de imágenes hero







ANTES DE CODEAR:

Propón los 3 headlines candidatos (con argumentos de por qué

cada uno) + la estructura general. Espera mi OK.

DESPUÉS DE CODEAR:

Ejecuta:



npm run build (sin errores)

npm run lint (sin warnings nuevos)

Test visual: muestra el markup de cada sección



git commit message: "feat(landing): redesign with Baena headline + Karpathy principles"



\### 3.5 Automatización razonable



\- \*\*NO automatizar\*\*: el copy. Cada versión hay que criticarla con ojos humanos.

\- \*\*SÍ automatizar\*\*: el linting, el build check, el deploy preview (ya lo hace Vercel auto).

\- \*\*Automatización futura\*\*: A/B tests con Vercel Edge Config cuando tengas 500+ visitantes/mes.



\---



\## 4. SOFTWARE INTERNO — coordinación completa



\### 4.1 Estado actual

\- Dashboard nutri funcional (1-5/10 UX según área)

\- PWA paciente funcional

\- 21 endpoints API

\- Deuda técnica conocida: 46 `as any`, 92 queries sin abstracción



\### 4.2 Objetivo realista

Que el nutricionista que entre en demo quede convencido en los primeros 5 min de uso. No un dashboard perfecto — uno que no frustre.



\### 4.3 Prioridades de intervención (orden correcto)



\*\*Prioridad alta — afecta demo directamente\*\*:

1\. Flujo demo: login → crear paciente → generar plan → ver PDF

2\. Tiempos de respuesta (SSE plan generation)

3\. Agenda (5/10 UX según tus notas)



\*\*Prioridad media — afecta retención\*\*:

4\. Intercambios de platos (paciente → nutri)

5\. Recetas

6\. Seguimientos



\*\*Prioridad baja — deuda técnica sin impacto negocio\*\*:

7\. Refactor `as any`

8\. Abstracción queries Supabase



\### 4.4 Orden de skills por tarea



\*\*Para cualquier tarea de código Next.js\*\*:

\- Base siempre activa: karpathy-guidelines (ya en CLAUDE.md) + vercel-react-best-practices (activa al tocar código)

\- Según área:

&#x20; - Frontend (cualquier componente): UI UX Pro Max → frontend-design → polish

&#x20; - Animaciones: animate o GSAP

&#x20; - Branding / colores: colorize

&#x20; - Refinamiento final: Pixel Perfect UI



\### 4.5 Prompt maestro — auditoría focalizada (NO auditoría completa)

/model opus

Lee en este orden:



CLAUDE.md

DIETLY\_CONTEXTO\_COMPLETO\_ACTUALIZADO.md

.agents/skills/vercel-react-best-practices/SKILL.md

.agents/skills/UI UX Pro Max/SKILL.md

.agents/skills/polish/SKILL.md



TAREA: Micro-auditoría del FLUJO DEMO de Dietly. NO auditoría completa.

Solo el camino crítico que un nutricionista recorrerá en los primeros

5 minutos de demo.

FLUJO A AUDITAR:



/login (ingreso)

/onboarding (2-3 pasos)

/dashboard (vista inicial)

/dashboard/patients/new (crear primer paciente)

/dashboard/patients/\[id] (ficha + intake)

Click "Generar plan" (POST /api/plans/generate)

/dashboard/plans/\[id] (ver plan generado)

Click "Generar PDF"

PDF visualizable



Para cada pantalla/acción, evaluar:



¿Tiempo de respuesta aceptable? (objetivo: TTI < 1.5s)

¿Estados de carga claros? (skeleton, spinner, progreso)

¿Mensajes de error útiles si algo falla?

¿Copy claro (no jerga técnica)?

¿Squint test de UI UX Pro Max pasa?

¿Alguna fricción inesperada?



ENTREGABLE (sin tocar código aún):



dev-notes/demo-flow-audit.md

Por cada pantalla: estado actual | score 1-10 | issue detectado |

fix recomendado con skill concreta a usar

Top 3 issues críticos a arreglar ANTES de la primera demo real



REGLAS:



NO toques código en esta fase. Solo diagnóstico.

NO propongas refactors grandes. Solo fixes quirúrgicos (Karpathy).

Si detectas algo que viola vercel-react-best-practices, citar regla

concreta (ej: "async-parallel violado en /dashboard").

Si detectas problema UX, citar checks concretos de UI UX Pro Max.



DESPUÉS:

Esperar mi OK antes de arreglar nada. Quiero ver el informe antes.

git commit: solo si se crea el doc de auditoría, mensaje:

"docs: demo-flow-audit (camino crítico pre-outreach)"



\### 4.6 Automatización razonable



\- \*\*Sí automatizar\*\*: tests E2E del flujo demo (Playwright). Mantiene regresiones controladas cuando toques código.

\- \*\*Sí automatizar\*\*: `npm run build` en CI antes de cada merge (Vercel ya lo hace).

\- \*\*NO automatizar\*\*: refactor masivo de `as any`. Hacerlo a mano con Claude Code, archivo a archivo, cuando vayas a tocar cada uno.

\- \*\*NO automatizar\*\*: el "security-reviewer agent" que tienes en roadmap hasta post-launch real.



\---



\## 5. OUTREACH — coordinación completa



\### 5.1 Estado actual

\- 47 leads cualificados en `outreach/leads-v1.csv`

\- 10 DMs personalizados listos

\- 0 DMs enviados aún



\### 5.2 El outreach YA tiene su sistema



Este doc no lo re-diseña. Ya lo cerramos en `outreach/leads-v1-analysis.md` con:

\- 5 plantillas de copy por segmento

\- Verificación pendiente de 16 leads

\- Regla de no-contacto de evangelizadores hasta semana 3-4

\- Arquetipos destilados



\### 5.3 Coordinación de skills para las SIGUIENTES tandas



Cuando hayas mandado los 10 primeros y quieras escalar:



\*\*Generar tanda 11-60 (siguientes 50 leads)\*\*:

\- Skills: lead-research-assistant + competitive-ads-extractor + marketing-psychology + cold-email + copywriting

\- Proceso:

&#x20; 1. Analizar respuestas de los 10 primeros (qué convirtió / qué ignoraron)

&#x20; 2. Iterar plantillas A-E con ese aprendizaje

&#x20; 3. Research 50 nuevos con mismo sistema probado

&#x20; 4. Mandar ritmo 2/día 5 semanas



\### 5.4 Prompt maestro — iteración tras primeros 10

/model opus

Lee:



outreach/leads-v1-analysis.md (versión actual)

outreach/contactos-fase-1.csv (que creaste con respuestas reales)

.agents/skills/cold-email/SKILL.md

.agents/skills/copywriting/SKILL.md

.agents/skills/marketing-psychology/SKILL.md



TAREA: Iterar las 5 plantillas de copy basándote en datos reales

de los 10 primeros DMs.

ANÁLISIS REQUERIDO:



Tasa respuesta por plantilla (A, B, C, D, E)

Tasa demo agendada por plantilla

Patrones en las respuestas positivas (qué ganchos engancharon)

Patrones en las negativas (qué objeciones aparecieron)

Silencios: ¿se abrieron los mensajes? ¿se vieron?



ENTREGABLE:



outreach/leads-v2-analysis.md con:



Sección "Aprendizajes fase 1"

5 plantillas v2 (si alguna no se toca, justificar por qué)

Top 3 cambios concretos con hipótesis (si X cambia, Y métrica mueve)

Objeciones más comunes + respuestas preparadas







REGLAS KARPATHY:



No inventes datos: si una plantilla solo se usó 1 vez, NO generalices

Surface tradeoffs: si hay dos direcciones posibles, presenta ambas

Simplicity: si el cambio es "añadir una frase", no reescribas entero



git commit: "marketing: leads-v2-analysis — iteración copy post 10 DMs"



\### 5.5 Automatización razonable



\- \*\*NO automatizar\*\*: envío de DMs. Instagram banea. Las plataformas anti-spam detectan.

\- \*\*SÍ automatizar\*\*: tracking (añade respuestas al CSV manualmente, Claude Code estructura en markdown).

\- \*\*SÍ automatizar\*\*: recordatorios "responder a Maite en <4h" (Google Calendar manual o Todoist).

\- \*\*NO automatizar\*\*: follow-ups. Cada uno es una conversación.



\---



\## 6. CONTENIDO — coordinación completa



\### 6.1 Estado actual

\- Cuenta `@dietly.es` PENDIENTE de crear

\- Post 1 (pain-point carrusel) PENDIENTE

\- 8 posts planeados

\- Instagram NO es para ads, es para presencia + retargeting + credibilidad



\### 6.2 Objetivo

Construir una presencia mínima que cuando un lead reciba tu DM y busque "@dietly" tenga algo real que ver.



No es canal de adquisición principal. Es \*\*reforzador de credibilidad\*\*.



\### 6.3 Prompt maestro — crear calendario editorial

/model opus

Lee:



outreach/leads-v1-analysis.md (arquetipos + dolores + citas literales)

.agents/skills/content-strategy/SKILL.md

.agents/skills/social-content/SKILL.md

.agents/skills/marketing-psychology/SKILL.md



TAREA: Diseñar calendario editorial Instagram @dietly.es de 6 semanas

(24 posts total, 4/semana).

RESTRICCIONES:



Audiencia: nutricionistas autónomas españolas (no pacientes)

Mix 50% educativo / 30% social proof / 20% producto

NO promoción agresiva. Presencia + credibilidad.

Distribución: lunes (educativo fuerte), miércoles (carrusel),

viernes (story/reel), domingo (soft post reflexivo)



FORMATO CONTENT:



60% carruseles (mejor engagement orgánico)

25% reels (alcance)

15% posts simples



HOOKS OBLIGATORIOS (derivar de leads-v1-analysis.md):



Usar al menos 5 citas literales archivadas como inspiración

(sin atribución directa, claro)

Usar los 5 dolores top identificados

Usar los 4 arquetipos detectados como "segmentos a los que

hablar" en posts distintos



ENTREGABLE:

content/calendar-v1.md con:



Tabla 24 posts: fecha | tipo | hook | copy esqueleto | hashtags sugeridos

Sección "Hitos" (qué post publicar el día que subas un caso de éxito, etc.)

Sección "Backup posts": 5 posts de reserva si algo falla



PRINCIPIOS KARPATHY:



No inventes tendencias: solo usa lo que ya está validado en leads-v1

Simplicity: si un post se puede reducir a 1 frase, no hagas carrusel

de 10 slides



git commit: "content: calendar-v1 primer mes @dietly.es"



\### 6.4 Automatización razonable



\- \*\*NO automatizar\*\*: publicación. Metricool/Later vale la pena solo con 2-3 posts/semana y cuentas reales con tracción. No lo necesitas aún.

\- \*\*SÍ automatizar\*\*: creación de templates Canva/Figma reutilizables (hazlos una vez, reutiliza 20 veces).

\- \*\*SÍ automatizar\*\*: carpeta `content/drafts/` donde Claude Code genera los posts con 1 semana de antelación para que tú solo revises y publiques.

\- \*\*NO automatizar\*\*: DMs respondiendo a comentarios. Esto es humano al 100%.



\---



\## 7. PLAN EJECUTABLE SECUENCIADO (el orden importa)



Cuando vuelvas, este es el orden recomendado:



\### Día 1 (lunes) — OUTREACH primero

\- Crear `outreach/contactos-fase-1.csv` con columnas pactadas

\- Mandar DM 1 (Maite) + DM 2 (Ainara) según plantillas ya listas

\- Ritmo 2 DMs/día toda la semana



\### Día 1-2 (paralelo) — CONTENIDO mínimo

\- Crear `@dietly.es` en Instagram (logo árbol verde, bio con `dietly.es`)

\- Subir bio decente pero sin post aún (si alguien busca, ve cuenta viva)

\- Prompt maestro calendario editorial (sección 6.3)



\### Día 3-4 — LANDING rediseño

\- Prompt maestro landing (sección 3.4)

\- Tras aprobar headlines, ejecutar

\- Deploy preview a Vercel

\- Review con ojos propios antes de merge a main



\### Día 5 — SOFTWARE INTERNO micro-auditoría

\- Prompt maestro auditoría flujo demo (sección 4.5)

\- Revisar informe

\- Aplicar top 3 fixes con prompts individuales (no un megaprompt)



\### Semana 2 — ITERAR con datos

\- Respuestas a DMs llegando (ojalá 2-3 demos agendadas)

\- Ajustar plantillas copy con sección 5.4

\- Post 1 Instagram + empezar calendar v1

\- Primera demo real → aprender → ajustar



\### Semana 3-4 — ESCALAR con señal

\- Tanda 11-30 outreach

\- Post 2-8 Instagram

\- Contactar evangelizadores (Verdi + Nieto + Sanabdón) con plantilla E

\- Si hay 3+ clientes pago → empezar pensar rebrand Sabea



\---



\## 8. REGLAS DE COORDINACIÓN ENTRE SKILLS



\### 8.1 Siempre juntas (acopladas)

\- `karpathy-guidelines` + TODAS las demás (es base)

\- `frontend-design` + `UI UX Pro Max` (diseño UI)

\- `frontend-design` + `polish` + `Pixel Perfect UI` (diseño UI final)

\- `vercel-react-best-practices` + cualquier cosa Next.js

\- `copywriting` + `marketing-psychology` (copy crítico)

\- `social-content` + `copywriting` (posts Instagram)



\### 8.2 NUNCA juntas en misma tarea

\- `cold-email` vs `social-content` → canal distinto, mezclarlas confunde

\- `page-cro` vs `frontend-design` desde cero → primero diseñas, luego optimizas

\- `churn-prevention` vs `launch-strategy` → estadios del negocio opuestos



\### 8.3 Anti-patrones a evitar

\- Activar 5+ skills a la vez: el prompt se infla. Máximo 3-4 por tarea.

\- Skills contradictorias: `polish` antes de terminar funcionalidad.

\- Saltarse fases: querer `page-cro` sin datos reales (espera 500+ visitas).

\- Meta-skills infladas: ni `superpowers` ni `claude-mem` son útiles en tu fase.



\---



\## 9. AUTOMATIZACIÓN — la verdad honesta



\### 9.1 Lo que puedes automatizar ya

1\. Lint + build en pre-commit hook (husky)

2\. Deploy preview automático en Vercel (ya está)

3\. Tracker de leads: Claude Code actualiza CSV cuando le digas "Maite respondió X"

4\. Templates Canva/Figma (una vez hechos, reutilizar)



\### 9.2 Lo que NO debes automatizar ahora

1\. DMs a Instagram: ban garantizado

2\. Cold emails masivos: requiere 6 meses de domain warmup

3\. Publicación posts: no merece pena hasta tener 2-3 posts/semana estables

4\. Refactor masivo: tocar 46 `as any` de golpe rompe cosas

5\. Agent Teams / multi-agente: overkill, te frena



\### 9.3 Cuándo automatizar (criterio)

Automatizar cuando haga la misma tarea manualmente 5 veces y sepa exactamente qué hace.



\- 5+ DMs/semana por plantilla → sistema de tracking avanzado

\- 10+ posts publicados → Metricool/Buffer

\- 50+ clientes → churn prevention automatizado

\- 500+ visitas/semana → A/B testing

\- 100+ plans generados → AutoAgent para iterar prompt IA



\---



\## 10. CRITERIOS DE ÉXITO POR ÁREA



\### Landing (éxito = conversión a demo)

\- Mínimo válido: 30 visitantes → 1 demo agendada (3% conversión)

\- Bueno: 5% (1 demo cada 20 visitantes)

\- Si <1%: el problema es el copy



\### Software interno (éxito = retención en demo)

\- Mínimo válido: 50% de demos pasan del minuto 5

\- Bueno: 80%+ piden probar con un paciente propio



\### Outreach (éxito = respuesta → demo)

\- Mínimo válido: 10% respuestas + 30% a demo (3% demo/DM)

\- Bueno: 15% respuestas + 50% a demo (7.5% demo/DM)

\- Si <5% respuestas: iterar copy urgente



\### Contenido (éxito = credibilidad)

\- Mínimo válido: cuenta viva + 3 posts recientes

\- Bueno: algún DM responde "vi tu post X"

\- Sin objetivo de alcance masivo



\---



\## 11. CHEATSHEET — prompts rápidos



\### "Crear componente UI nuevo"

Skills: karpathy + vercel-react-best-practices + frontend-design + UI UX Pro Max

Prompt: "Lee las 4 skills. Crear componente X con Y requisitos. Primero proponme diseño (sin código), espera mi OK."



\### "Iterar copy de un DM"

Skills: karpathy + copywriting + cold-email + marketing-psychology

Prompt: "Lee las 4 skills. Iterar plantilla \[pegar] basándote en \[contexto respuesta]. Dame 3 versiones con hipótesis."



\### "Crear post Instagram"

Skills: karpathy + social-content + copywriting + marketing-psychology

Prompt: "Lee las 4 skills. Crear post tipo \[carrusel/reel/static] sobre \[tema] derivado de \[cita o dolor del analysis]. Entregable: copy + hashtags + brief visual."



\### "Arreglar bug de rendimiento"

Skills: karpathy + vercel-react-best-practices

Prompt: "Lee las 2 skills. Analizar \[ruta/componente] y detectar qué regla viola. Aplicar fix quirúrgico. npm run lint al final."



\### "Mejorar flujo existente (UX)"

Skills: karpathy + UI UX Pro Max + polish + Pixel Perfect UI

Prompt: "Lee las 4 skills. Auditar flujo \[rutas]. Aplicar squint test, detectar 3 issues, proponer fix por orden de impacto."



\---



\## 12. MANTENIMIENTO



Este doc se actualiza cuando:

1\. Instalas una skill nueva

2\. Desinstalas una skill

3\. Cambia la fase del negocio (0→10 clientes, 10→100, etc.)

4\. Detectas patrón repetitivo que merece regla nueva



NO se actualiza:

\- Cada sprint

\- Cada feature nueva

\- Cuando Claude Code sugiere "mejoras"



Vida útil mínima: 3 meses antes de v2.



\---



\## 13. LO QUE NO CUBRE (a propósito)



\- FORZZA: sesión aislada, doc separado

\- Rebrand a Sabea: documento separado cuando decidas fecha

\- Decisiones de producto: función del feedback de clientes reales, no de skills

\- Contratación (VA, dev): cuando haya ingresos que lo justifiquen

\- Legal avanzado (Art. 28.3 RGPD completa): skill legal específica



\---



\## 14. ÚLTIMA INSTRUCCIÓN



Este doc se llama \*\*sistema de coordinación\*\*, no \*\*sistema de ejecución\*\*.



La ejecución la haces tú. Claude Code como palanca, pero \*\*tú decides qué ejecutar y cuándo\*\*.



Si al leer esto te entra la tentación de ejecutar los 4 frentes a la vez → \*\*NO\*\*. Lo que más mueve la aguja en tu estadio actual (0 clientes pago) es \*\*mandar los 10 DMs primero\*\*.



Todo lo demás vale después.



\---



\*\*Fin del documento. Guárdalo. Abrelo cuando vuelvas. Ejecuta por orden.\*\*

