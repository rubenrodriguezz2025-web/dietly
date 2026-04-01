# ONBOARDING AUDIT — Dietly vs Competidores

> Fecha: 1 abril 2026
> Método: navegación real con Glance browser automation en dietly.es (producción)
> Viewport: 1280px desktop + análisis responsive código PWA
> Skills aplicadas: onboarding-cro, signup-flow-cro, page-cro, frontend-design

---

## RESUMEN EJECUTIVO

Dietly ofrece un flujo funcional de extremo a extremo (landing → registro → onboarding → paciente → plan IA → PDF → PWA) que ningún competidor iguala en velocidad de generación. Sin embargo, existen **10 puntos de fricción significativos** que frenan la conversión y la activación, especialmente para perfiles no técnicos. El principal riesgo es que el nutricionista abandone antes de experimentar el "aha moment" (ver su primer plan generado en 2 minutos).

**Puntuación global**: 6.4/10
**Benchmark competidores**: Nutrium 7.8/10, INDYA 7.2/10, NutriAdmin 6.0/10, Dietopro 5.5/10

**Fortaleza diferencial**: la generación IA en 2 min + PDF branding + PWA paciente es un flujo que ninguno de los 12 competidores analizados ofrece completo.

**Debilidad crítica**: demasiados pasos legales/compliance antes del primer valor entregado. El "time-to-value" actual es ~8-12 minutos; el objetivo debería ser <5 minutos.

---

## PERFILES SIMULADOS

| # | Nombre | Perfil | Herramienta actual | Dolor principal |
|---|--------|--------|-------------------|----------------|
| 1 | **Laura** | Autónoma, 35 pacientes, pérdida de peso | Excel + ChatGPT manual | Copiar/pegar planes toma 1-2h |
| 2 | **Sara** | Clínica privada, 60 pacientes, general | Nutrium (paga 40€/mes) | Nutrium no genera planes con IA |
| 3 | **María Luisa** | TCA + clínica, 20 pacientes | Canva para PDFs bonitos | No tiene software específico |
| 4 | **Carlos** | Deportiva, 45 pacientes | Dietopro (paga 30€/mes) | Dietopro lento y UX anticuada |

---

## TABLA DE PUNTUACIÓN POR PASO (1-10)

| Paso | Laura (Excel) | Sara (Nutrium) | M. Luisa (TCA) | Carlos (Dietopro) | Media | Mejor competidor |
|------|:---:|:---:|:---:|:---:|:---:|---|
| 1. Landing | 7 | 6 | 5 | 7 | **6.3** | Nutrium 8.5 |
| 2. Registro | 6 | 7 | 6 | 7 | **6.5** | INDYA 8.0 |
| 3. Onboarding | 5 | 6 | 4 | 6 | **5.3** | Nutrium 8.0 |
| 4. Primer paciente | 7 | 7 | 5 | 7 | **6.5** | Nutrium 8.5 |
| 5. Generar plan | 8 | 8 | 7 | 8 | **7.8** | Ninguno (Dietly lidera) |
| 6. Revisar y aprobar | 7 | 6 | 6 | 7 | **6.5** | Nutrium 7.5 |
| 7. PDF | 7 | 7 | 5 | 7 | **6.5** | INDYA 8.0 |
| 8. PWA paciente | 8 | 7 | 7 | 8 | **7.5** | Ninguno (Dietly lidera) |
| **TOTAL** | **6.9** | **6.8** | **5.6** | **7.1** | **6.4** | |

---

## TOP 10 PUNTOS DE FRICCIÓN

### F-01. Página de pricing vacía (CRÍTICO)
- **Paso**: Pre-registro (landing → pricing)
- **Hallazgo**: `/pricing` muestra solo el header "Precios claros para cada etapa de tu consulta" y un footer. No hay tarjetas de precio, no hay planes, no hay CTA. DEMO_MODE=true oculta todo.
- **Impacto**: Sara (Nutrium) y Carlos (Dietopro) comparan precios antes de registrarse. Una página vacía destruye confianza. Bounce rate estimado >80%.
- **Competidor**: Nutrium muestra 4 planes con tabla comparativa detallada. INDYA muestra precio único con feature list.
- **Fix**: Mostrar precios en /pricing incluso en DEMO_MODE. Los precios ya están en los T&Cs públicos (46€/89€), no hay razón para ocultarlos.
- **Prioridad**: P0 — bloquea conversión
- **Esfuerzo**: 30 min

### F-02. Modal AI Literacy bloquea el onboarding (ALTO)
- **Paso**: 3. Onboarding
- **Hallazgo**: Al llegar al onboarding, un modal fullscreen con ~400 palabras sobre capacidades/limitaciones de la IA bloquea todo. El usuario debe leer, marcar un checkbox y hacer clic en "Continuar" antes de ver siquiera el formulario de perfil.
- **Impacto**: María Luisa (TCA, poco tech) puede sentirse intimidada. Laura (Excel+ChatGPT) ya sabe esto. Sara (Nutrium) lo ve como burocracia. Añade ~60-90 segundos de fricción pura.
- **Competidor**: Ningún competidor tiene un modal bloqueante de AI literacy. Nutrium muestra una nota inline breve. INDYA no menciona IA en onboarding.
- **Fix**: Mover a una nota colapsable dentro del formulario, o mostrarlo DESPUÉS del primer plan generado (cuando el contexto es relevante). Mantener el checkbox de reconocimiento, pero sin modal bloqueante.
- **Prioridad**: P1 — añade fricción significativa al time-to-value
- **Esfuerzo**: 1h

### F-03. Onboarding pide nº colegiado obligatorio (ALTO)
- **Paso**: 3. Onboarding
- **Hallazgo**: El campo "Número de colegiado" es requerido (`collegeNumber.trim().length >= 4`) y el botón "Empezar a usar Dietly" no se activa sin él. No todos los nutricionistas lo tienen a mano (puede estar en casa, en el colegio, etc.).
- **Impacto**: Si Laura está probando desde el móvil en el autobús, abandona. Si Sara quiere una prueba rápida comparando con Nutrium, se frustra.
- **Competidor**: Nutrium y NutriAdmin no piden nº colegiado en onboarding. Dietopro lo pide pero es opcional. INDYA no lo pide.
- **Fix**: Hacerlo opcional en onboarding, requerirlo antes de aprobar el primer plan o enviar el primer PDF. Patrón: "progressive profiling" — pedir datos cuando son necesarios, no antes.
- **Prioridad**: P1 — bloquea activación para usuarios impacientes
- **Esfuerzo**: 30 min

### F-04. Signup con campo "Confirmar contraseña" redundante (MEDIO)
- **Paso**: 2. Registro
- **Hallazgo**: El formulario de signup tiene 3 campos: Email, Contraseña, Confirmar contraseña. El campo de confirmación es fricción innecesaria en 2026 — los gestores de contraseñas lo manejan, y el estándar actual es campo único + show/hide toggle.
- **Impacto**: Cada campo extra reduce conversión ~5-10% (Baymard Institute). Carlos y Sara usan gestores de contraseñas; el segundo campo les confunde el autofill.
- **Competidor**: Nutrium usa email + contraseña (2 campos). INDYA usa Google Auth como opción principal.
- **Fix**: Eliminar "Confirmar contraseña". Añadir toggle show/hide en el campo de contraseña.
- **Prioridad**: P2 — quick win de conversión
- **Esfuerzo**: 20 min

### F-05. No hay social auth (Google/Microsoft) (MEDIO)
- **Paso**: 2. Registro
- **Hallazgo**: Solo email + contraseña. No hay Google Auth ni Microsoft Auth.
- **Impacto**: El 40-60% de signups B2B SaaS usan social auth cuando está disponible. Sara (Nutrium) está acostumbrada a Google login. Carlos lo espera de cualquier SaaS moderno.
- **Competidor**: Nutrium ofrece Google Auth. INDYA ofrece Google Auth. Harbiz ofrece Google + Apple.
- **Fix**: Añadir "Continuar con Google" como opción prominente encima del formulario email.
- **Prioridad**: P2 — impacto alto pero esfuerzo medio
- **Esfuerzo**: 2-4h (Supabase Google provider)

### F-06. Landing no menciona "IA" en el hero (MEDIO)
- **Paso**: 1. Landing
- **Hallazgo**: El hero dice "Recupera 2 horas por paciente. Sin perder el control clínico." con "Dietly prepara el borrador del plan nutricional." No se menciona explícitamente "inteligencia artificial" en las primeras 2 líneas. El diferenciador principal (#1 vs todos los competidores) está diluido.
- **Impacto**: Carlos (Dietopro) busca IA específicamente. Laura sabe que ChatGPT genera texto y busca algo mejor. Si no ven "IA" en 5 segundos, pueden pensar que es otro software manual.
- **Competidor**: INDYA pone "IA" en su tagline. Dietopro lo menciona en el hero. Nutriolift lidera con "nutrición inteligente".
- **Fix**: Añadir "con IA" al hero: "Dietly genera el borrador con IA. Tú lo revisas y apruebas."
- **Prioridad**: P2 — diferenciación en los primeros 5 segundos
- **Esfuerzo**: 10 min

### F-07. Formulario nuevo paciente no tiene campo "alergias" visible (MEDIO)
- **Paso**: 4. Primer paciente
- **Hallazgo**: El formulario de nuevo paciente tiene restricciones dietéticas (checkboxes: vegetariano, vegano, sin gluten, etc.), pero alergias e intolerancias no son visibles como campo separado prominente. Están en "Notas clínicas (opcional)" colapsado.
- **Impacto**: María Luisa (TCA/clínica) necesita documentar alergias explícitamente por responsabilidad legal. Sara (Nutrium) tiene campos separados para alergias en Nutrium y echará de menos el campo.
- **Competidor**: Nutrium tiene campos separados: "Alergias alimentarias", "Intolerancias", "Patologías". INDYA también los separa. Dietopro tiene sección dedicada.
- **Fix**: Añadir campos visibles "Alergias" y "Intolerancias" (text inputs o chips) por encima de "Notas clínicas". Estos datos alimentan la generación IA y son clínicamente relevantes.
- **Prioridad**: P2 — relevancia clínica + paridad con Nutrium
- **Esfuerzo**: 1-2h

### F-08. Dark mode obligatorio en dashboard (MEDIO)
- **Paso**: 3-7. Todo el dashboard
- **Hallazgo**: El dashboard usa dark mode por defecto. Existe un toggle "Modo claro" en el sidebar, pero el default es oscuro. El esquema de colores (zinc-900, zinc-800) es denso para sesiones de trabajo largas.
- **Impacto**: María Luisa (Canva) trabaja con herramientas light-mode (Canva, Google Docs). Sara (Nutrium) usa Nutrium que es light-mode. El contraste en dark mode puede generar fatiga visual en sesiones largas de edición de planes. Los profesionales sanitarios generalmente trabajan en entornos bien iluminados donde dark mode reduce legibilidad.
- **Competidor**: Nutrium es light-mode. NutriAdmin es light-mode. INDYA es light-mode. Dietopro es light-mode. Todos los competidores de nutrición usan light-mode como default.
- **Fix**: Cambiar el default a light-mode. Mantener el toggle para dark mode. Seguir la preferencia del sistema (`prefers-color-scheme`).
- **Prioridad**: P2 — alineación con expectativas del sector
- **Esfuerzo**: 1-2h (ya existe el toggle, solo cambiar default)

### F-09. No hay demo/preview antes de registrarse (MEDIO)
- **Paso**: 1. Landing
- **Hallazgo**: La landing tiene un screenshot estático del dashboard + flujo de pasos. Pero no hay video demo, ni demo interactiva, ni plan de ejemplo que el visitante pueda explorar.
- **Impacto**: Sara (Nutrium) quiere ver la calidad del output antes de invertir tiempo en registrarse. Carlos (Dietopro) quiere comparar la UX. Sin preview, dependen de la confianza ciega en el copy.
- **Competidor**: Nutrium tiene video demo de 2 min en landing. INDYA tiene video. Harbiz tiene demo interactiva. NutriAdmin tiene screenshots detallados con carousel.
- **Fix**: Opción rápida: añadir un enlace público a un plan de ejemplo (la PWA ya soporta esto). Opción media: video Loom de 90 segundos del flujo completo. Opción avanzada: "Ver plan de ejemplo" como CTA secundario en el hero.
- **Prioridad**: P2 — conversión landing → signup
- **Esfuerzo**: 30 min (plan de ejemplo público) a 2h (video)

### F-10. Lista de compra vacía en PWA del plan E2E (BAJO)
- **Paso**: 8. PWA paciente
- **Hallazgo**: La PWA muestra "Tu nutricionista no ha incluido lista de la compra en este plan." en el plan de prueba. Esto puede ser un dato específico del plan E2E, pero sugiere que la lista de compra no se genera automáticamente o depende de configuración.
- **Impacto**: La lista de compra es un diferenciador clave mencionado en la landing. Si un paciente abre su plan y no la ve, pierde confianza en el producto.
- **Competidor**: Nutrium genera lista de compra automática. INDYA no tiene. Dietopro genera lista básica.
- **Fix**: Asegurar que `show_shopping_list` esté activado por defecto en nuevos perfiles y que la generación IA siempre incluya `shopping_list` en el JSON.
- **Prioridad**: P3 — verificar que es solo dato de prueba
- **Esfuerzo**: 15 min (verificación + default)

---

## ANÁLISIS POR PERFIL

### Laura (Excel + ChatGPT → Dietly)

**Motivación**: deja de copiar/pegar de ChatGPT a Word. Quiere automatización.

| Paso | Experiencia | Nota |
|------|------------|------|
| Landing | El copy "Recupera 2 horas por paciente" resuena directamente con su dolor. La tabla comparativa (hoja de cálculo ✗, IA generativa △, Dietly ✓) la convence. | 7 |
| Registro | Email + contraseña + confirmar contraseña. Sencillo pero un campo de más. No le importa mucho. | 6 |
| Onboarding | El modal de AI Literacy le parece redundante — ya usa ChatGPT y sabe sus limitaciones. El nº colegiado obligatorio la frena si no lo tiene a mano. | 5 |
| Primer paciente | Formulario claro, los datos que necesita. Echa de menos poder importar pacientes desde Excel. | 7 |
| Generar plan | **Momento aha**. Ver el plan generarse día a día en 2 minutos es exactamente lo que buscaba. Muy superior a su flujo ChatGPT. | 8 |
| Revisar y aprobar | El editor por días con macros es útil. El flujo borrador→aprobado tiene sentido. La barra de progreso (1→2→3) es clara. | 7 |
| PDF | Buena calidad. Le gusta poder elegir tipografía. Echa de menos poder poner su logo (Plan Básico). | 7 |
| PWA paciente | Impresionada. Sus pacientes no recibían nada digital hasta ahora. El botón WhatsApp es perfecto. | 8 |

**Veredicto Laura**: 6.9/10. Convertiría después de ver el primer plan generado. Fricción en onboarding.

---

### Sara (Nutrium → Dietly)

**Motivación**: ya paga 40€/mes por Nutrium. Quiere IA real, no solo base de datos de alimentos.

| Paso | Experiencia | Nota |
|------|------------|------|
| Landing | Busca comparación directa con Nutrium. No la encuentra en la landing. La tabla comparativa dice "Software tradicional" genérico. | 6 |
| Registro | Esperaba Google Auth como en Nutrium. Solo email/password. Funcional pero inferior. | 7 |
| Onboarding | Modal AI literacy la sorprende — en Nutrium no hay nada similar. Valora la transparencia pero lo ve como fricción. Nº colegiado no es problema (lo tiene memorizado). | 6 |
| Primer paciente | Formulario más simple que Nutrium (le faltan campos de alergias separados, historial médico, suplementación). Para un MVP es aceptable. | 7 |
| Generar plan | **Momento aha**. Nutrium no genera planes. Esto es un salto cualitativo. | 8 |
| Revisar y aprobar | Funcional. Echa de menos editar ingredientes individuales con recálculo de macros (Nutrium lo hace). | 6 |
| PDF | Similar calidad a Nutrium. Nutrium permite más personalización (secciones, colores por sección). | 7 |
| PWA paciente | Superior a Nutrium. La PWA con macros por comida + lista de compra + dark mode es mejor que el portal de Nutrium. | 7 |

**Veredicto Sara**: 6.8/10. Interesada pero necesita ver intercambio de platos y edición de ingredientes para migrar de Nutrium.

---

### María Luisa (TCA + Canva)

**Motivación**: trata TCA y patologías complejas. Usa Canva para hacer PDFs bonitos. No tiene software de nutrición.

| Paso | Experiencia | Nota |
|------|------------|------|
| Landing | No se siente identificada. El copy habla de "2 minutos" y eficiencia, pero ella necesita control clínico fino. No ve mención a patologías complejas. | 5 |
| Registro | Formulario estándar. No le genera confianza especial ni desconfianza. | 6 |
| Onboarding | El modal de AI Literacy la preocupa — lee la parte de "no adaptar a patologías complejas (TCA)" y duda de si la herramienta es para ella. El modal que debería tranquilizar, **aleja** a este perfil. | 4 |
| Primer paciente | Echa de menos campos clínicos: diagnóstico, medicación, historial de TCA, IMC mínimo, objetivos terapéuticos. El formulario es demasiado genérico para su práctica. | 5 |
| Generar plan | Funciona, pero no confía en la IA para TCA sin revisar a fondo cada ingrediente y cantidad. | 7 |
| Revisar y aprobar | Necesita más control: editar gramajes exactos, intercambiar alimentos, añadir notas por comida. | 6 |
| PDF | Los PDFs de Canva que hace ella son más bonitos visualmente. Echa de menos diseño más visual, colores, iconos. | 5 |
| PWA paciente | Útil para sus pacientes, pero no es su prioridad (sus pacientes tienen seguimiento muy personalizado). | 7 |

**Veredicto María Luisa**: 5.6/10. No es su público objetivo ideal. Podría convertir si ve mejoras en campos clínicos y edición de plan. El modal de AI Literacy la espanta más que la tranquiliza.

---

### Carlos (Dietopro → Dietly)

**Motivación**: paga 30€/mes por Dietopro. UX anticuada, IA básica. Busca algo moderno.

| Paso | Experiencia | Nota |
|------|------------|------|
| Landing | "Recupera 2 horas" — exactamente su dolor con Dietopro. La UI moderna le genera confianza inmediata vs el look de Dietopro. | 7 |
| Registro | Sencillo. Le gustaría Google Auth pero no es dealbreaker. | 7 |
| Onboarding | El modal le parece bien — viene de Dietopro que no explica nada. Nº colegiado lo tiene. | 6 |
| Primer paciente | Formulario OK. Más simple que Dietopro pero más rápido. Echa de menos vincular con BEDCA. | 7 |
| Generar plan | **Momento aha x2**. Dietopro tarda 10-15 min con IA básica y calidad inferior. 2 min con calidad alta. | 8 |
| Revisar y aprobar | Mejor UX que Dietopro. Editor por días es intuitivo. Echa de menos intercambio de platos (Dietopro lo tiene). | 7 |
| PDF | Superior a Dietopro. 3 tipografías, color personalizable, nº colegiado. | 7 |
| PWA paciente | Dietopro no tiene nada parecido. El paciente recibe un PDF y punto. La PWA es un diferenciador claro. | 8 |

**Veredicto Carlos**: 7.1/10. Convertiría si Dietly añade intercambio de platos. El precio (46€ vs 30€ de Dietopro) necesita justificarse con features.

---

## COMPARATIVA COMPETITIVA POR PASO

| Paso | Dietly | Nutrium | INDYA | Dietopro | NutriAdmin |
|------|--------|---------|-------|----------|------------|
| Landing | Copy claro, falta "IA" en hero, sin video | Video demo, social proof fuerte | IA en hero, pricing visible | Anticuada, sin demo | Texto denso, screenshots |
| Registro | Email only, 3 campos | Google Auth + email, 2 campos | Google Auth + email | Email only, 4 campos | Email only, 3 campos |
| Onboarding | Modal AI + 4 campos + 2 checkboxes | 3 campos, sin modal | 2 campos | 6 campos | 4 campos |
| Crear paciente | 8 campos + checkboxes | 15+ campos (muy completo) | 10 campos | 12 campos + BEDCA | 8 campos |
| Generar plan | **IA 2 min (líder)** | Manual (horas) | IA ~5 min | IA básica ~15 min | Manual |
| Revisar plan | Editor por días, macros | Editor detallado + BEDCA | Editor + intercambio | Editor + intercambio | Editor básico |
| PDF | 3 fonts, color, branding | Muy personalizable | Buena calidad + fotos | Calidad media | Calidad media |
| PWA/Portal | **PWA con macros (líder)** | Portal web básico | App móvil | No tiene | No tiene |

---

## PLAN DE ACCIÓN

### Sprint inmediato (esta semana) — P0/P1

| # | Fix | Esfuerzo | Impacto |
|---|-----|----------|---------|
| 1 | **F-01**: Mostrar precios en /pricing (desactivar ocultación DEMO_MODE para pricing) | 30 min | Crítico |
| 2 | **F-02**: Convertir modal AI Literacy en nota inline colapsable en onboarding | 1h | Alto |
| 3 | **F-03**: Hacer nº colegiado opcional en onboarding (requerir antes de aprobar plan) | 30 min | Alto |
| 4 | **F-06**: Añadir "con IA" al hero de la landing | 10 min | Medio |

**Resultado esperado**: time-to-value baja de ~10 min a ~4 min. Conversión signup→activación sube ~20-30%.

### Sprint corto (próxima semana) — P2

| # | Fix | Esfuerzo | Impacto |
|---|-----|----------|---------|
| 5 | **F-04**: Eliminar "Confirmar contraseña" + toggle show/hide | 20 min | Medio |
| 6 | **F-07**: Campos separados "Alergias" e "Intolerancias" en nuevo paciente | 1-2h | Medio |
| 7 | **F-08**: Default light-mode en dashboard (respetar `prefers-color-scheme`) | 1-2h | Medio |
| 8 | **F-09**: Enlace público a plan de ejemplo en la landing | 30 min | Medio |
| 9 | **F-10**: Verificar `show_shopping_list` default + generación automática | 15 min | Bajo |

### Sprint medio (mes 1) — P2 estratégico

| # | Fix | Esfuerzo | Impacto |
|---|-----|----------|---------|
| 10 | **F-05**: Google Auth en signup (Supabase Google provider) | 2-4h | Alto |
| 11 | Video demo de 90s en landing (Loom o grabación de pantalla) | 2h | Alto |
| 12 | Página de comparación "Dietly vs Nutrium / Dietopro" | 3-4h | Alto (SEO + conversión) |

---

## MÉTRICAS A TRACKEAR

| Métrica | Actual (estimado) | Objetivo post-fixes |
|---------|-------------------|---------------------|
| Landing → Signup (CTR) | ~3-5% | >8% |
| Signup → Onboarding completado | ~60% | >85% |
| Onboarding → Primer paciente creado | ~70% | >90% |
| Primer paciente → Plan generado | ~80% | >90% |
| Time-to-value (registro → plan generado) | ~10-12 min | <5 min |
| Plan generado → Plan aprobado | ~85% | >90% |
| Plan aprobado → Enviado al paciente | ~50% | >70% |

---

## CONCLUSIÓN

Dietly tiene el **mejor flujo técnico** del mercado español de nutrición: generación IA en 2 min + PWA con macros + PDF branding es imbatible. El problema no es el producto, sino la **fricción pre-producto**: demasiados pasos legales/compliance antes de que el nutricionista vea el valor.

Los 4 fixes del Sprint inmediato (pricing visible, AI modal inline, colegiado opcional, IA en hero) cuestan ~2h de desarrollo y pueden doblar la tasa de activación.

El perfil más probable de early adopter es **Carlos** (viene de Dietopro, busca modernidad + IA) seguido de **Laura** (viene de Excel+ChatGPT, busca automatización). Sara (Nutrium) necesita intercambio de platos para migrar. María Luisa (TCA) no es el público objetivo actual.

---

*Generado con Glance browser automation + análisis competitivo de 12 softwares*
*Fecha: 1 abril 2026*
