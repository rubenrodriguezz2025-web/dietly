# Warm-up de email — dietly.es

## Por que es necesario

El dominio dietly.es es nuevo y no tiene reputacion de envio. Los emails de Resend (notificaciones de planes, invitaciones) pueden caer en spam si no se hace warm-up previo.

## Opcion A: Warmup Inbox (recomendado)

**Coste**: ~$15-50/mes segun volumen
**Tiempo**: 2-4 semanas para reputacion basica

### Pasos

1. Crear cuenta en https://www.warmupinbox.com
2. Conectar el email de envio: `no-reply@dietly.es` (o el que use Resend)
   - En Resend: verificar dominio dietly.es (ya hecho) → Settings → SMTP credentials
   - Host: `smtp.resend.com`, Port: 587, User: `resend`, Pass: API key
3. Configurar warm-up:
   - Emails por dia: empezar con 5, subir gradualmente a 30-50
   - Respuestas automaticas: activar (mejora reputacion)
   - Duracion: minimo 14 dias antes de enviar emails masivos
4. Monitorizar:
   - Inbox placement rate objetivo: >90%
   - Si cae por debajo: reducir volumen y revisar contenido

## Opcion B: Manual y gratis

**Coste**: 0€
**Tiempo**: 2-3 semanas

### Pasos

1. Pedir a los 8 beta users que:
   - Busquen el primer email de Dietly en spam
   - Lo marquen como "No es spam" / "Mover a recibidos"
   - Respondan al email (aunque sea un "ok")
   - Anadan `no-reply@dietly.es` a sus contactos
2. Enviar emails 1 a 1 (no masivos) las primeras 2 semanas
3. Configurar en Resend:
   - SPF: ya configurado con verificacion de dominio
   - DKIM: ya configurado con verificacion de dominio
   - DMARC: anadir registro DNS `_dmarc.dietly.es` → `v=DMARC1; p=none; rua=mailto:ruben@dietly.es`

## Opcion C: Mailreach

**Coste**: ~$25/mes
**Similar a Warmup Inbox** pero con mejor dashboard de deliverability.
https://www.mailreach.co

## Verificaciones DNS (hacer YA)

Verificar en el panel DNS de dietly.es que existen:

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | `@` | `v=spf1 include:resend.com ~all` |
| CNAME | `resend._domainkey` | (valor de Resend) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:ruben@dietly.es` |

## Recomendacion

Para beta (8 usuarios): **Opcion B** es suficiente.
Para lanzamiento publico (50+ usuarios): contratar **Opcion A o C** 2 semanas antes.
