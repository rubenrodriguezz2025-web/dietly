/**
 * libs/ai/resilience.ts
 *
 * Capa de resiliencia para todas las llamadas a la API de Anthropic.
 *
 * Características:
 *   - Exponential backoff con jitter (reintentos: 1 s, 2 s)
 *   - HTTP 429: respeta el header Retry-After
 *   - HTTP 529 (overloaded): backoff de 10–30 s, máximo 3 intentos
 *   - HTTP 400/401: sin reintento + notificación inmediata al equipo
 *   - Circuit breaker: 5 fallos consecutivos → pausa de 60 s
 *   - NUNCA hace fallback a otro modelo de IA
 */

import Anthropic, { APIError } from '@anthropic-ai/sdk';

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export type AnthropicErrorCode =
  | 'rate_limit'          // HTTP 429
  | 'overloaded'          // HTTP 529
  | 'auth_error'          // HTTP 400 / 401
  | 'service_unavailable' // Circuit breaker abierto
  | 'timeout'             // Request timeout
  | 'unknown';

export class AnthropicResilienceError extends Error {
  constructor(
    public readonly code: AnthropicErrorCode,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'AnthropicResilienceError';
  }
}

// ── Circuit breaker ────────────────────────────────────────────────────────────
// Estado a nivel de módulo: persiste entre peticiones en instancias warm de Vercel.
// En serverless, cada instancia tiene su propio estado — protege individualmente
// sin necesidad de coordinación centralizada.

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_DURATION_MS  = 60_000; // 60 s

interface CircuitState {
  consecutiveFailures: number;
  openedAt: number | null;
}

const circuit: CircuitState = {
  consecutiveFailures: 0,
  openedAt: null,
};

function isCircuitOpen(): boolean {
  if (circuit.openedAt === null) return false;
  if (Date.now() - circuit.openedAt >= CIRCUIT_OPEN_DURATION_MS) {
    // Tras 60 s, permite un intento de prueba (half-open automático)
    circuit.openedAt = null;
    circuit.consecutiveFailures = 0;
    return false;
  }
  return true;
}

function recordSuccess(): void {
  circuit.consecutiveFailures = 0;
  circuit.openedAt = null;
}

function recordFailure(): void {
  circuit.consecutiveFailures++;
  if (
    circuit.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD &&
    circuit.openedAt === null
  ) {
    circuit.openedAt = Date.now();
    console.error(
      `[resilience] ⚡ Circuit breaker ABIERTO tras ${circuit.consecutiveFailures} fallos consecutivos`,
    );
    void notifyTeamCriticalError('circuit_breaker_open', {
      consecutiveFailures: circuit.consecutiveFailures,
      openedAt: new Date(circuit.openedAt).toISOString(),
    });
  }
}

/** Devuelve el estado actual del circuit breaker (para monitorización). */
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  consecutiveFailures: number;
  secondsRemaining: number | null;
} {
  const isOpen = circuit.openedAt !== null &&
    Date.now() - circuit.openedAt < CIRCUIT_OPEN_DURATION_MS;
  return {
    isOpen,
    consecutiveFailures: circuit.consecutiveFailures,
    secondsRemaining: isOpen
      ? Math.ceil((CIRCUIT_OPEN_DURATION_MS - (Date.now() - circuit.openedAt!)) / 1000)
      : null,
  };
}

// ── Helpers de retry ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** ±20 % de jitter aleatorio para evitar thundering herd. */
function withJitter(ms: number): number {
  const variance = ms * 0.2;
  return Math.round(ms + (Math.random() * variance * 2 - variance));
}

const BACKOFF_DELAYS_MS = [1_000, 2_000];

function exponentialDelay(attempt: number): number {
  return withJitter(BACKOFF_DELAYS_MS[Math.min(attempt, BACKOFF_DELAYS_MS.length - 1)]);
}

/** Extrae el valor del header Retry-After en milisegundos. */
function parseRetryAfterMs(err: APIError): number | undefined {
  const raw = (err.headers as Record<string, string> | undefined)?.['retry-after'];
  if (!raw) return undefined;
  const seconds = parseFloat(raw);
  if (isNaN(seconds) || seconds <= 0) return undefined;
  return Math.ceil(seconds * 1_000);
}

function categorizeError(err: unknown): AnthropicErrorCode {
  if (err instanceof APIError) {
    if (err.status === 429) return 'rate_limit';
    if (err.status === 529) return 'overloaded';
    if (err.status === 400 || err.status === 401) return 'auth_error';
  }
  if (err instanceof Error && err.name === 'APIConnectionTimeoutError') return 'timeout';
  return 'unknown';
}

// ── Notificación al equipo ─────────────────────────────────────────────────────

type AlertType = 'auth_error' | 'circuit_breaker_open' | 'high_error_rate';

export async function notifyTeamCriticalError(
  type: AlertType,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const { resendClient } = await import('@/libs/resend/resend-client');
    const { AlertEmail } = await import('@/libs/ai/alert-email');
    const { createElement } = await import('react');
    const { render } = await import('@react-email/render');

    const html = await render(
      createElement(AlertEmail, { type, details, timestamp: new Date().toISOString() }),
    );

    await resendClient.emails.send({
      from: 'alertas@dietly.es',
      to:   ['rubenrodriguezz2025@gmail.com'],
      subject: `[Dietly ALERTA] ${alertTypeLabel(type)} — ${new Date().toLocaleString('es-ES')}`,
      html,
    });

  } catch (emailErr) {
    // El fallo al enviar la alerta NUNCA debe bloquear el flujo principal
    console.error('[resilience] Error enviando alerta al equipo:', emailErr);
  }
}

function alertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    auth_error:           'Error de autenticación API',
    circuit_breaker_open: 'Circuit breaker abierto',
    high_error_rate:      'Tasa de error elevada (>20 %)',
  };
  return labels[type];
}

// ── Monitorización de tasa de error ───────────────────────────────────────────

/**
 * Comprueba si la tasa de error de generación de planes supera el 20 %
 * en los últimos 5 minutos consultando `nutrition_plans` (fuente de verdad).
 * Mínimo 3 intentos para evitar falsos positivos con volumen bajo.
 */
export async function checkAndAlertErrorRate(): Promise<void> {
  try {
    const { supabaseAdminClient } = await import('@/libs/supabase/supabase-admin');
    const windowStart = new Date(Date.now() - 5 * 60_000).toISOString();

    const { count: total } = await supabaseAdminClient
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', windowStart);

    if (!total || total < 3) return;

    const { count: errors } = await supabaseAdminClient
      .from('nutrition_plans')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'error')
      .gte('created_at', windowStart);

    const errorRate = (errors ?? 0) / total;
    if (errorRate > 0.20) {
      console.error(
        `[resilience] ⚠️ Tasa de error: ${Math.round(errorRate * 100)} % (${errors}/${total} en 5 min)`,
      );
      await notifyTeamCriticalError('high_error_rate', {
        errorRate:     `${Math.round(errorRate * 100)} %`,
        failedPlans:   errors ?? 0,
        totalPlans:    total,
        windowMinutes: 5,
        checkedAt:     new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[resilience] checkAndAlertErrorRate error:', err);
  }
}

// ── Función principal ──────────────────────────────────────────────────────────

/**
 * Ejecuta una llamada a la API de Anthropic con resiliencia completa.
 *
 * @param fn    Función que realiza la llamada (sin argumentos, devuelve Promise)
 * @param label Etiqueta para logs (ej: 'day_1', 'shopping_list')
 */
export async function callAnthropicWithResilience<T>(
  fn: () => Promise<T>,
  label = 'anthropic_call',
): Promise<T> {
  // ── Circuit breaker ────────────────────────────────────────────────────────
  if (isCircuitOpen()) {
    const { secondsRemaining } = getCircuitBreakerStatus();
    console.warn(
      `[resilience] [${label}] Circuit breaker ABIERTO — ${secondsRemaining}s restantes`,
    );
    throw new AnthropicResilienceError(
      'service_unavailable',
      'El servicio de generación está temporalmente no disponible. Inténtelo en unos minutos.',
    );
  }

  // ── Bucle de reintentos ────────────────────────────────────────────────────
  // Contadores independientes por tipo de error
  let normalAttempts = 0; // Para errores generales y 429 (máx. 2 reintentos = 3 intentos)
  let attempts529    = 0; // Para HTTP 529 overloaded (máx. 3 intentos)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (err) {
      const code = categorizeError(err);

      // ── HTTP 400/401: error fatal, sin reintento ─────────────────────────
      if (code === 'auth_error') {
        recordFailure();
        const status = err instanceof APIError ? err.status : '?';
        console.error(`[resilience] [${label}] Error de autenticación HTTP ${status} — sin reintento`);
        void notifyTeamCriticalError('auth_error', {
          label,
          status,
          message: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        });
        throw new AnthropicResilienceError(
          'auth_error',
          `Error de autenticación con la API de Anthropic (HTTP ${status}). El equipo ha sido notificado.`,
          err,
        );
      }

      // ── HTTP 529: sobrecarga, hasta 3 intentos con 10–30 s ──────────────
      if (code === 'overloaded') {
        attempts529++;
        if (attempts529 >= 3) {
          recordFailure();
          throw new AnthropicResilienceError(
            'overloaded',
            'El servicio de IA está sobrecargado. Inténtelo en unos minutos.',
            err,
          );
        }
        const rawDelay = 10_000 + Math.random() * 20_000; // 10–30 s
        const delay    = withJitter(rawDelay);
        console.warn(
          `[resilience] [${label}] HTTP 529 overloaded (intento ${attempts529}/3) — esperando ${Math.round(delay / 1000)} s`,
        );
        await sleep(delay);
        continue; // No consume el presupuesto de reintentos normales
      }

      // ── Reintentos normales (429, timeout, unknown) ──────────────────────
      normalAttempts++;
      if (normalAttempts > 2) {
        // Agotados los 2 reintentos (3 intentos en total)
        recordFailure();
        throw new AnthropicResilienceError(
          code,
          err instanceof Error ? err.message : 'Error inesperado tras agotar reintentos',
          err,
        );
      }

      let delay: number;
      if (code === 'rate_limit') {
        // HTTP 429: respetar Retry-After o usar backoff exponencial
        const retryAfterMs = parseRetryAfterMs(err as APIError);
        delay = retryAfterMs ?? exponentialDelay(normalAttempts - 1);
        console.warn(
          `[resilience] [${label}] HTTP 429 rate limit (reintento ${normalAttempts}/2) — esperando ${Math.round(delay / 1000)} s` +
          (retryAfterMs ? ` (Retry-After: ${Math.round(retryAfterMs / 1000)} s)` : ''),
        );
      } else {
        delay = exponentialDelay(normalAttempts - 1);
        console.warn(
          `[resilience] [${label}] Error ${code} (reintento ${normalAttempts}/2) — esperando ${Math.round(delay / 1000)} s. ` +
          `Detalle: ${err instanceof Error ? err.message : err}`,
        );
      }

      await sleep(delay);
    }
  }
}
