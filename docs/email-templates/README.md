# Email Templates — Supabase Auth

Plantillas HTML para los emails transaccionales de autenticacion en Supabase.

## Archivos

| Archivo | Tipo Supabase | Descripcion |
|---------|---------------|-------------|
| `confirm-signup.html` | Confirm signup | Confirmacion de cuenta nueva |
| `reset-password.html` | Reset password | Restablecimiento de contrasena |
| `magic-link.html` | Magic link | Inicio de sesion sin contrasena |
| `email-change.html` | Change email address | Confirmacion de cambio de correo |

## Como pegar en Supabase Dashboard

1. Abre **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Para cada tipo de email:
   - Selecciona la pestana correspondiente (Confirm signup, Reset password, Magic link, Change email address)
   - Copia el contenido completo del archivo `.html` correspondiente
   - Pegalo en el campo **Body** (HTML)
   - Actualiza el campo **Subject** con:
     - Confirm signup: `Confirma tu cuenta en Dietly`
     - Reset password: `Restablece tu contrasena en Dietly`
     - Magic link: `Tu enlace de acceso a Dietly`
     - Change email address: `Confirma tu nuevo correo en Dietly`
3. Pulsa **Save** en cada pestana

## Variables de Supabase

Las plantillas usan variables Go template que Supabase reemplaza automaticamente:

- `{{ .ConfirmationURL }}` — enlace de confirmacion/accion
- `{{ .Email }}` — correo electronico del usuario

## Notas

- Todas las plantillas usan estilos inline (compatibilidad email clients)
- Max-width 600px, mobile-first
- Color primario Dietly: `#1a7a45`
- Logo: `https://dietly.es/logo.png` (asegurate de que existe y es accesible publicamente)
