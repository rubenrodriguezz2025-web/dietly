/**
 * plan-tokens.ts
 *
 * Generación y validación de tokens HMAC-SHA256 para el acceso de pacientes
 * a la PWA de visualización de planes nutricionales.
 *
 * Formato de URL:  /plan/{planId}?token={hmacHex}&expires={timestamp}
 * Caducidad:       90 días desde la generación
 * Algoritmo:       HMAC-SHA256 sobre "{planId}:{expiresTimestamp}"
 *
 * Compatible con Edge Runtime (usa Web Crypto API, no módulo `crypto` de Node).
 */

const EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 días en milisegundos

// ─── Utilidades internas ────────────────────────────────────────────────────

function getPlanTokenSecret(): string {
  const secret = process.env.PLAN_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      'La variable de entorno PLAN_TOKEN_SECRET no está configurada.'
    );
  }
  return secret;
}

/** Mensaje que se firma: concatenación canónica de planId y timestamp. */
function buildMessage(planId: string, expires: number): string {
  return `${planId}:${expires}`;
}

/** Convierte un ArrayBuffer a cadena hexadecimal. */
function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte una cadena hexadecimal a Uint8Array.
 * Devuelve null si el formato es inválido.
 */
function hexToBytes(hex: string): Uint8Array | null {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Importa la clave HMAC-SHA256 usando Web Crypto API. */
async function importHmacKey(
  secret: string,
  usage: 'sign' | 'verify'
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

// ─── API pública ────────────────────────────────────────────────────────────

export interface PlanAccessToken {
  /** Token HMAC-SHA256 en hexadecimal. */
  token: string;
  /** Timestamp de expiración en milisegundos (Unix epoch). */
  expires: number;
  /** URL completa lista para enviar al paciente. */
  url: string;
}

/**
 * Genera un token HMAC-SHA256 de acceso al plan del paciente.
 *
 * @param planId - UUID de nutrition_plans.id
 * @returns Token firmado, timestamp de expiración y URL completa
 *
 * @example
 * const { url } = await generatePlanAccessToken(plan.id);
 * // → "/plan/abc123?token=<hmac>&expires=<ts>"
 */
export async function generatePlanAccessToken(
  planId: string
): Promise<PlanAccessToken> {
  const secret = getPlanTokenSecret();
  const expires = Date.now() + EXPIRY_MS;
  const message = buildMessage(planId, expires);

  const key = await importHmacKey(secret, 'sign');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  const token = bufferToHex(signature);

  return {
    token,
    expires,
    url: `/plan/${planId}?token=${token}&expires=${expires}`,
  };
}

export interface TokenValidationResult {
  valid: boolean;
  /** Razón del fallo (solo presente cuando valid === false). */
  reason?: string;
}

/**
 * Valida un token HMAC-SHA256 de acceso al plan.
 *
 * La comparación de firmas es en tiempo constante (crypto.subtle.verify)
 * para prevenir ataques de temporización.
 *
 * @param planId   - UUID de nutrition_plans.id (del path de la URL)
 * @param token    - Token HMAC en hexadecimal (del query param)
 * @param expires  - Timestamp de expiración (del query param)
 */
export async function validatePlanAccessToken(
  planId: string,
  token: string,
  expires: string | number
): Promise<TokenValidationResult> {
  // Validar que expires es un número válido
  const expiresNum =
    typeof expires === 'string' ? parseInt(expires, 10) : expires;

  if (!Number.isFinite(expiresNum) || expiresNum <= 0) {
    return { valid: false, reason: 'expires inválido' };
  }

  // Verificar que el token no ha expirado
  if (Date.now() > expiresNum) {
    return { valid: false, reason: 'token expirado' };
  }

  // Decodificar el token hex a bytes
  const receivedBytes = hexToBytes(token);
  if (!receivedBytes) {
    return { valid: false, reason: 'token malformado' };
  }

  // Verificar la firma HMAC en tiempo constante
  try {
    const secret = getPlanTokenSecret();
    const message = buildMessage(planId, expiresNum);
    const key = await importHmacKey(secret, 'verify');

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      receivedBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(message)
    );

    return isValid
      ? { valid: true }
      : { valid: false, reason: 'firma inválida' };
  } catch {
    return { valid: false, reason: 'error de verificación' };
  }
}
