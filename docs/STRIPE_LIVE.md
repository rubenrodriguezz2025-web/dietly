# Stripe LIVE — Variables de entorno

## Variables a cambiar en Vercel (manualmente)

Ir a: **Vercel → Settings → Environment Variables**

| Variable | Valor actual (test) | Cambiar a (LIVE) |
|----------|-------------------|------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | `whsec_...` (live) |

## Pasos

1. **Activar modo LIVE en Stripe Dashboard**
   - Ir a https://dashboard.stripe.com
   - Desactivar el toggle "Test mode" (esquina superior derecha)
   - Copiar las API keys de producción desde Developers → API keys

2. **Crear webhook de producción en Stripe**
   - Ir a Developers → Webhooks → Add endpoint
   - URL: `https://dietly.es/api/stripe/webhook`
   - Eventos a escuchar:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copiar el signing secret (`whsec_...`) del nuevo webhook

3. **Actualizar en Vercel**
   - Settings → Environment Variables
   - Editar las 3 variables con los valores LIVE
   - Scope: **Production** (mantener test en Preview/Development)
   - Redeploy para que surtan efecto

4. **Crear productos y precios en LIVE**
   - Los productos/precios de test NO se copian a LIVE
   - Crear manualmente en Stripe Dashboard (modo LIVE):
     - Producto "Dietly Básico": 46€/mes, recurrente
     - Producto "Dietly Profesional": 89€/mes, recurrente
   - Los IDs de precio (`price_...`) serán diferentes a los de test
   - Verificar que el nombre del producto Pro contiene "pro" o "profesional" (detección actual)

5. **Verificar**
   - Hacer un checkout de prueba con tarjeta real (cancelar inmediatamente)
   - Verificar que el webhook llega correctamente (Stripe Dashboard → Webhooks → Recent events)
   - Verificar que `subscription_status` se actualiza en Supabase

## Importante

- **NO** poner keys LIVE en `.env.local` — solo en Vercel Production
- Las keys de test siguen en `.env.local` y en Vercel Preview/Development
- El webhook de test (localhost con `stripe listen`) sigue funcionando para desarrollo
