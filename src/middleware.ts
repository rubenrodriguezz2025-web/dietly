import { type NextRequest, NextResponse } from 'next/server';

import { validateIntakeAccessToken } from '@/lib/auth/intake-tokens';
import { validatePlanAccessToken } from '@/lib/auth/plan-tokens';
import { updateSession } from '@/libs/supabase/supabase-middleware-client';

// ─── Configuración de rate limiting ────────────────────────────────────────

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrae la IP del cliente considerando proxies (Vercel). */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Consulta Supabase para saber si la IP ha superado el límite de intentos
 * fallidos en los últimos 15 minutos.
 *
 * Usa fetch directo (sin SDK) para compatibilidad con Edge Runtime.
 * Falla abierto (false) en caso de error para no bloquear usuarios legítimos.
 */
async function isRateLimited(ip: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return false; // dev: sin variables → no bloquear

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/plan_access_attempts` +
        `?ip_address=eq.${encodeURIComponent(ip)}` +
        `&created_at=gte.${encodeURIComponent(since)}` +
        `&select=id`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Prefer: 'count=exact',
          Range: '0-0',
        },
      }
    );

    // PostgREST devuelve el total en Content-Range: 0-0/<total>
    const contentRange = res.headers.get('content-range') ?? '*/0';
    const total = parseInt(contentRange.split('/')[1] ?? '0', 10);
    return total >= RATE_LIMIT_MAX;
  } catch {
    return false; // fail open: no bloquear ante errores de red
  }
}

/**
 * Registra un intento fallido en Supabase (asíncrono, sin await).
 * Los errores se silencian: el registro es best-effort, no debe bloquear la respuesta.
 */
function recordFailedAttempt(ip: string, planId: string): void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return;

  fetch(`${supabaseUrl}/rest/v1/plan_access_attempts`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ ip_address: ip, plan_id: planId }),
  }).catch(() => {
    // intencional: el registro de intentos fallidos es best-effort
  });
}

// ─── Respuestas de error con headers de seguridad ────────────────────────────

function forbiddenResponse(message: string): NextResponse {
  return new NextResponse(message, {
    status: 403,
    headers: securityHeaders(),
  });
}

function rateLimitResponse(): NextResponse {
  return new NextResponse(
    'Demasiados intentos fallidos. Vuelve a intentarlo en 15 minutos.',
    {
      status: 429,
      headers: {
        ...securityHeaders(),
        'Retry-After': '900',
      },
    }
  );
}

function securityHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  };
}

// ─── Validación de la ruta /plan/[planId] ────────────────────────────────────

async function handlePlanRoute(request: NextRequest): Promise<NextResponse> {
  const { searchParams, pathname } = request.nextUrl;

  // Extraer planId del path: /plan/<planId>
  const planId = pathname.split('/')[2];
  const token = searchParams.get('token');
  const expires = searchParams.get('expires');

  // Parámetros obligatorios
  if (!planId || !token || !expires) {
    return forbiddenResponse('Enlace de acceso incompleto.');
  }

  const ip = getClientIp(request);

  // 1. Comprobar rate limit ANTES de validar (evitar enumeración por fuerza bruta)
  const limited = await isRateLimited(ip);
  if (limited) {
    return rateLimitResponse();
  }

  // 2. Validar token HMAC + expiración + coincidencia de planId
  const validation = await validatePlanAccessToken(planId, token, expires);

  if (!validation.valid) {
    // Registrar intento fallido (sin await para no añadir latencia)
    recordFailedAttempt(ip, planId);
    return forbiddenResponse('Enlace inválido o expirado.');
  }

  // 3. Token válido: añadir headers de seguridad y continuar
  const response = NextResponse.next({ request });
  const headers = securityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

// ─── Validación de la ruta /p/intake/[token] ─────────────────────────────────

async function handleIntakeRoute(request: NextRequest): Promise<NextResponse> {
  const { searchParams, pathname } = request.nextUrl;

  // Extraer intakeToken del path: /p/intake/<intakeToken>
  const intakeToken = pathname.split('/')[3];
  const token = searchParams.get('token');
  const expires = searchParams.get('expires');

  // Compatibilidad hacia atrás: si no hay parámetros HMAC, permitir el acceso.
  // Los enlaces antiguos (solo UUID) siguen funcionando temporalmente.
  if (!token || !expires) {
    return NextResponse.next({ request });
  }

  // Validar token HMAC + expiración + coincidencia de intakeToken
  if (!intakeToken) {
    return forbiddenResponse('Enlace de acceso incompleto.');
  }

  const validation = await validateIntakeAccessToken(intakeToken, token, expires);

  if (!validation.valid) {
    return forbiddenResponse('Enlace inválido o expirado.');
  }

  const response = NextResponse.next({ request });
  const headers = securityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas del plan del paciente → validación HMAC + rate limiting
  if (/^\/plan\/[^/]+$/.test(pathname)) {
    return handlePlanRoute(request);
  }

  // Rutas del cuestionario de intake → validación HMAC (con compatibilidad hacia atrás)
  if (/^\/p\/intake\/[^/]+$/.test(pathname)) {
    return handleIntakeRoute(request);
  }

  // Inyectar x-pathname en los headers del request para que los layouts
  // puedan detectar la ruta activa sin necesidad de usePathname (server-side)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Resto de rutas → gestión de sesión Supabase
  const supabaseResponse = await updateSession(request);

  // Crear nueva respuesta con el header x-pathname en el request,
  // preservando las cookies de sesión de Supabase
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie as Parameters<typeof response.cookies.set>[2]);
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Excluir:
     * - _next/static  (archivos estáticos del build)
     * - _next/image   (optimización de imágenes)
     * - favicon.ico
     * - Extensiones de imagen comunes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
