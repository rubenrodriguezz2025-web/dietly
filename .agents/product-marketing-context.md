# Contexto de producto — Dietly

## Qué es el producto

**Dietly** es un SaaS web para nutricionistas y dietistas autónomos españoles.

El nutricionista introduce los datos del paciente → la IA genera el plan nutricional completo en 2-5 minutos → el profesional revisa, ajusta y entrega un PDF con su marca.

Flujo completo:
1. Nutricionista se registra → onboarding (nombre, especialidad, logo, colores)
2. Crea ficha del paciente con datos clínicos y nutricionales
3. Genera el plan → Claude API → interfaz de streaming muestra el progreso
4. Revisa y edita el plan en un editor visual
5. Genera PDF con su branding (logo, colores)
6. Envía el plan al paciente por email con PDF adjunto
7. El paciente puede ver su plan en una PWA (app web) sin necesidad de descargar nada

---

## A quién va dirigido

**Perfil principal**: Nutricionistas y dietistas-nutricionistas autónomos en España.

- Trabajan solos (sin equipo)
- 20-60 pacientes activos
- Especialidades: pérdida de peso, alimentación saludable, nutrición deportiva básica
- Sensibles al precio (autónomos, no grandes clínicas)
- Dolor principal: crear planes manualmente toma entre 1 y 3 horas por paciente
- Mercado total: ~8.075 dietistas-nutricionistas colegiados en España (CGCODN, 2024)

---

## Propuesta de valor principal

> "Dietly genera el borrador del plan nutricional en 2 minutos. Tú lo revisas, ajustas y lo entregas con tu marca."

### Por qué importa el matiz "borrador"
- El copy SIEMPRE menciona la revisión profesional. Nunca decir que la IA "hace el plan" sola.
- El flujo `borrador → aprobado` no es solo UX — es la cobertura legal del producto.
- Posiciona a Dietly como herramienta del profesional, no como sustituto.

### Beneficios clave
- **Ahorro de tiempo**: de 1-3 horas a 2-5 minutos por plan
- **Branding propio**: el PDF lleva el logo y colores del nutricionista, no el de Dietly
- **App para el paciente**: PWA accesible por link, sin descargas, con plan semanal, recetas y lista de la compra
- **Datos siempre accesibles**: historial de pacientes y planes en la nube

---

## Precios

| Plan | Precio | Límite |
|------|--------|--------|
| Básico | 46 €/mes | 30 pacientes activos |
| Profesional | 89 €/mes | Ilimitado + PDF con branding personalizado (logo propio) |

- IVA incluido al 21%
- Sin contrato anual en el MVP (solo mensual)
- No hay plan gratuito permanente — sí acceso beta gratuito para primeros validadores

---

## Competidores

| Competidor | Origen | Debilidades frente a Dietly |
|---|---|---|
| **Nutrium** | Portugal | No genera planes con IA; la app del paciente no muestra kcal/macros por comida |
| **NutriAdmin** | España/UK | Interfaz anticuada, sin IA, orientado a clínicas |
| **Dietopro** | España | IA básica, sin branding en PDF para el plan básico |
| **INDYA** | España | Más enfocado en seguimiento que en generación de planes |

**Ventaja diferencial de Dietly**:
- IA generativa real (Claude Sonnet) con planes estructurados día a día
- PDF con branding del profesional desde el plan Básico (logo en Pro)
- PWA del paciente que muestra macros por comida (punto débil de Nutrium)
- Precio competitivo para autónomos españoles

---

## Tono de comunicación

### Atributos de marca
- **Profesional pero cercano**: habla de tú al nutricionista, sin tecnicismos innecesarios
- **Honesto**: la IA genera un borrador, no el plan definitivo — nunca exagerar las capacidades
- **Eficiente**: mensajes cortos, directos, orientados al ahorro de tiempo
- **Español de España**: vocabulario y referencias locales (euros, normativa española, AEPD)

### Lo que se dice
- "Genera el borrador en 2 minutos"
- "Tú lo revisas y lo entregas con tu marca"
- "Tus pacientes, tus planes, tu imagen"
- "Para nutricionistas autónomos que valoran su tiempo"

### Lo que NO se dice
- ~~"La IA hace tu trabajo"~~ → siempre hay revisión profesional
- ~~"Automatiza tu consulta al 100%"~~ → el nutricionista sigue siendo esencial
- ~~"Sin esfuerzo"~~ → hay revisión, hay trabajo del profesional
- Tecnicismos como "LLM", "tokens", "structured outputs" — el nutricionista no necesita saber esto

### Ejemplos de copy validado
- Landing: *"¿Tardas más de 30 min en un plan nutricional? Dietly lo genera en 2 minutos. Tú lo revisas, ajustas y lo entregas con tu marca."*
- Lista de espera: *"Únete a los primeros 50 nutricionistas que lo probarán gratis."*
- LinkedIn outreach: mensaje de 3 líneas, ofrecer 15 min de feedback a cambio de 6 meses gratis

---

## Canales de adquisición (validados)

1. **Lista de espera** en dietly.es — límite artificial de 50 plazas
2. **LinkedIn outreach directo** — 20-30 conexiones/día con nutricionistas españoles
3. **CODiNuCoVa** (Colegio Oficial de Valencia) — acceso a 1.226 colegiados
4. **Instagram** — DM a nutricionistas con 10K-100K seguidores, acceso gratuito vitalicio a cambio de story
5. **Grupos Facebook/WhatsApp** de nutricionistas españoles

**No usados en fase early**: Google Ads, SEO, Product Hunt.

---

## Contexto legal relevante para marketing

- Dietly es una **herramienta para profesionales**, no un servicio de nutrición al consumidor final
- El nutricionista es el **responsable del tratamiento de datos** (RGPD); Dietly es el encargado
- El copy nunca debe implicar que Dietly sustituye al criterio clínico del profesional
- Los datos de salud son "categoría especial" bajo RGPD — no usar como argumento de venta sin contexto adecuado
