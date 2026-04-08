# Google Search Console — Verificacion de dietly.es

## Pasos para verificar

1. **Ir a Google Search Console**
   - https://search.google.com/search-console
   - Iniciar sesion con la cuenta de Google del proyecto

2. **Anadir propiedad**
   - Click en "Anadir propiedad" (selector arriba a la izquierda)
   - Elegir **"Prefijo de URL"**: `https://dietly.es`
   - (Alternativa: "Dominio" → `dietly.es` para cubrir http/https/www)

3. **Verificar propiedad** (metodo recomendado: DNS)
   - Google mostrara un registro TXT tipo:
     `google-site-verification=XXXXXXXXXXXXXXXXX`
   - Ir al panel DNS del registrador de dietly.es
   - Anadir registro TXT en `@` con el valor proporcionado
   - Volver a Search Console → "Verificar"
   - Puede tardar hasta 48h en propagarse

   **Metodo alternativo: meta tag HTML**
   - Google proporcionara un tag tipo:
     `<meta name="google-site-verification" content="XXXX" />`
   - Anadirlo en `src/app/(marketing)/layout.tsx` dentro de `<head>` o via metadata:
     ```typescript
     export const metadata: Metadata = {
       verification: {
         google: 'XXXX',
       },
     };
     ```

4. **Enviar sitemap**
   - En Search Console → Sitemaps (menu izquierdo)
   - Introducir URL: `https://dietly.es/sitemap.xml`
   - Click "Enviar"
   - Verificar que el estado cambia a "Correcto"

5. **Solicitar indexacion de paginas clave**
   - En Search Console → Inspeccion de URL
   - Introducir cada URL y pulsar "Solicitar indexacion":
     - `https://dietly.es/`
     - `https://dietly.es/pricing`
     - `https://dietly.es/signup`
     - `https://dietly.es/legal/terminos`
     - `https://dietly.es/legal/privacidad`

## Verificaciones post-setup

- [ ] Propiedad verificada (icono verde)
- [ ] Sitemap enviado y aceptado
- [ ] 0 errores de cobertura
- [ ] Paginas principales en estado "Valida"
- [ ] Core Web Vitals sin errores criticos
- [ ] Mobile usability sin errores

## Archivo robots.txt

Ya existe en `public/robots.txt`. Verificar que contiene:
```
Sitemap: https://dietly.es/sitemap.xml
```

## Tiempo estimado

- Verificacion DNS: 5 minutos (+ hasta 48h propagacion)
- Indexacion inicial: 2-7 dias
- Aparicion en resultados de busqueda: 1-4 semanas
