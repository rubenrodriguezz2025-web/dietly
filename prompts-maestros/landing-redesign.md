/model opus



LEE ESTOS ARCHIVOS EN ORDEN ANTES DE HACER NADA:



1\. CLAUDE.md (incluye principios Karpathy al final — obligatorios)

2\. SKILLS\_COORDINATION\_SYSTEM.md (sección 3 — Landing, y sección 8 — 

&#x20;  reglas de coordinación)

3\. .agents/skills/copywriting/SKILL.md

4\. .agents/skills/marketing-psychology/SKILL.md

5\. .agents/skills/frontend-design/SKILL.md

6\. .agents/skills/UI UX Pro Max/SKILL.md

7\. .agents/skills/polish/SKILL.md

8\. .agents/skills/vercel-react-best-practices/SKILL.md

9\. outreach/leads-v1-analysis.md (arquetipos, citas, dolores reales)

10\. src/app/(marketing)/page.tsx (landing actual)

11\. src/features/pricing/components/pricing-section.tsx



TAREA: Revisar la landing actual de Dietly y proponer rediseño 

completo que aumente conversión a demo.



FASE 1 — DIAGNÓSTICO (sin código todavía):



Audita la landing actual con estas preguntas:

\- ¿El headline captura el pitch real? (compara con cita Baena en 

&#x20; leads-v1-analysis.md sección 7)

\- ¿Hay jerga técnica que confunda al nutricionista?

\- ¿Pasa el squint test de UI UX Pro Max?

\- ¿Viola alguna regla de vercel-react-best-practices?

\- ¿El arquetipo al que habla es Arquetipo 1 + 2 del analysis, 

&#x20; o está hablando a nadie concreto?



Entrega: dev-notes/landing-audit.md con:

\- Score 1-10 por sección (hero, problema, features, cta, footer)

\- Top 3 issues críticos

\- Recomendaciones específicas citando reglas concretas



FASE 2 — PROPUESTA (sin código todavía):



Tras aprobar el diagnóstico, proponme:

\- 3 headlines candidatos (uno basado en cita literal Baena, otro 

&#x20; operativo directo, otro ideológico anti-plantilla). Con argumentos 

&#x20; de pros/contras cada uno.

\- Estructura de secciones nueva (orden + por qué)

\- Paleta y typography (siguiendo frontend-design — evitar AI slop)

\- Animaciones (mínimas, CSS-only salvo si hay caso claro para GSAP)



ESPERA MI OK antes de tocar código.



FASE 3 — IMPLEMENTACIÓN (después de mi OK):



\- Branch aparte: git checkout -b redesign-landing

\- Solo tocar /src/app/(marketing)/page.tsx y componentes asociados

\- NO tocar /dashboard, /api, /p/\[token]

\- Reusar PricingSection existente

\- Mantener logo.png, favicon.svg, links legales, cookie banner

\- Server Components por defecto, "use client" solo donde hay 

&#x20; interactividad real

\- Dark + light mode funcionales



FASE 4 — VALIDACIÓN:



\- npm run build (sin errores)

\- npm run lint (sin warnings nuevos)

\- Squint test manual (descríbeme qué ves al desenfocar)

\- Comparativa before/after por sección



FASE 5 — DEPLOY:



\- git commit: "feat(landing): redesign with Baena headline + Karpathy"

\- git push origin redesign-landing

\- Dame la URL del Vercel Preview cuando esté lista



PRINCIPIOS OBLIGATORIOS (Karpathy — están en CLAUDE.md):



1\. Think Before Coding — si tienes dudas sobre scope, pregunta. 

&#x20;  No asumas.

2\. Simplicity First — si 200 líneas bastan, no hagas 500.

3\. Surgical Changes — no "mejores" código que no pediste tocar.

4\. Goal-Driven — éxito = landing pasa squint test + conversión 

&#x20;  potencial clara + build/lint limpios.



SKILLS A ACTIVAR JUNTAS (según SKILLS\_COORDINATION\_SYSTEM.md sección 8):

\- karpathy-guidelines (siempre)

\- copywriting + marketing-psychology (Fase 1 y 2)

\- frontend-design + UI UX Pro Max + polish (Fase 3)

\- vercel-react-best-practices (Fase 3 y 4)



ANTI-PATRONES A EVITAR:

\- Activar 5+ skills simultáneamente (máx 3-4 por fase)

\- Purple gradients, "AI slop" aesthetic

\- Fonts genéricas (Inter, Roboto, Arial)

\- Copy vacío tipo "revolucionamos la nutrición"

\- Emojis en hero principal

\- Carousel/slider sin razón de ser



EMPIEZA POR FASE 1. No saltes fases. Espera mi OK en cada punto de 

control.

