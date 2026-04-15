# SEO setup — dietly.es

SEO técnico mínimo viable para lanzamiento + verificación de Google Search Console.

## Qué se añadió

### Commit 1 — `feat(seo): add sitemap.ts and robots.ts`
- `src/app/sitemap.ts`: 8 URLs estáticas con prioridades graduadas (`/` 1.0 → `/politica-cookies` 0.3). Usa `NEXT_PUBLIC_APP_URL` o fallback `https://dietly.es`.
- `src/app/robots.ts`: permite `/` a todos los bots, bloquea `/dashboard/`, `/api/`, `/p/`, `/onboarding/`. Declara el sitemap.

### Commit 2 — `feat(seo): improve root metadata with OpenGraph, Schema.org JSON-LD and Google verification`
En `src/app/layout.tsx`:
- `metadataBase` + `title.template` (`%s | Dietly`) + `description` + `keywords`.
- OpenGraph y Twitter Card completos (imagen, locale, siteName).
- `verification.google` con el token de Search Console.
- `alternates.canonical: 'https://dietly.es'`.
- JSON-LD `@graph` inyectado en `<head>` con dos entidades: `Organization` y `SoftwareApplication` (con ofertas Básico 46€/mes y Profesional 89€/mes).

### Commit 3 — `feat(seo): add page-specific metadata (pricing, signup, legal)`
- `src/app/pricing/page.tsx`: title + description específicos + canonical.
- `src/app/(auth)/signup/page.tsx`: title + description específicos + canonical.
- `src/app/(marketing)/legal/privacidad/page.tsx`: reemplaza el title previo `Política de Privacidad · Dietly` (chocaba con el template global que añade ` | Dietly`); nuevo title limpio `Política de privacidad`.
- `src/app/(marketing)/legal/terminos/page.tsx`: mismo ajuste, title limpio `Términos y condiciones`.

## URLs públicas (tras deploy a Vercel)

- Sitemap: https://dietly.es/sitemap.xml
- Robots: https://dietly.es/robots.txt
- Meta tag de verificación Google: `ZAqPEz33rrIhsXhC0hGte5ObU8EvwIHTtdgPu1h2Oh0` (en `<head>` de todas las páginas vía root layout).
- Schema.org JSON-LD: `Organization` + `SoftwareApplication` con ofertas de precios.

## Pendiente (acción manual de Rubén)

- **Submit del sitemap en Google Search Console** tras verificar el dominio (URL: `https://dietly.es/sitemap.xml`).
- **Crear `/public/og-image.png` 1200x630**: por ahora el OpenGraph/Twitter usan `/logo.png` como fallback temporal. Sustituir cuando esté lista la imagen definitiva (diseño con claim + logo + fondo verde marca).
- **Investigación de keywords**: en proceso. Cuando esté, documentar en `outreach/seo-keywords.md`.

## Decisiones

- No se añadió metadata en `src/app/(marketing)/page.tsx` (landing `/`) porque queda cubierta por el root layout (`metadataBase`, `title.default`, OpenGraph y Twitter). Añadir override aquí duplicaría sin aportar.
- `keywords` se incluyen a pesar de que Google los ignora: útiles para otros buscadores y para herramientas de análisis.
- JSON-LD server-side con `dangerouslySetInnerHTML` en vez de `<Script strategy="beforeInteractive">`: más simple y se renderiza en SSR, que es lo que leen los crawlers.
