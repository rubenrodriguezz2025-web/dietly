/**
 * intake-tokens.ts
 *
 * Generación y validación de tokens HMAC-SHA256 para el acceso de pacientes
 * al cuestionario de intake.
 *
 * Formato de URL:  /p/intake/{intakeToken}?token={hmacHex}&expires={timestamp}
 * Caducidad:       365 días desde la generación
 * Algoritmo:       HMAC-SHA256 sobre "{intakeToken}:{expiresTimestamp}"
 * Secreto:         reutiliza PLAN_TOKEN_SECRET (mismo dominio de seguridad)
 *
 * Compatible con Edge Runtime (usa Web Crypto API, no módulo `crypto` de Node).
 */

const EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 365 días en milisegundos

// ─── Utilidades internas ────────────────────────────────────────────────────

function getIntakeTokenSecret(): string {
  const secret = process.env.PLAN_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      'La variable de entorno PLAN_TOKEN_SECRET no está configurada.'
    );
  }
  return secret;
}

function buildMessage(intakeToken: string, expires: number): string {
  return `intake:${intakeToken}:${expires}`;
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

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

export interface IntakeAccessToken {
  /** Token HMAC-SHA256 en hexadecimal. */
  token: string;
  /** Timestamp de expiración en milisegundos (Unix epoch). */
  expires: number;
  /** URL completa lista para enviar al paciente. */
  url: string;
}

/**
 * Genera un token HMAC-SHA256 de acceso al cuestionario de intake del paciente.
 *
 * @param intakeToken - UUID de patients.intake_token
 * @returns Token firmado, timestamp de expiración y URL completa
 */
export async function generateIntakeAccessToken(
  intakeToken: string
): Promise<IntakeAccessToken> {
  const secret = getIntakeTokenSecret();
  const expires = Date.now() + EXPIRY_MS;
  const message = buildMessage(intakeToken, expires);

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
    url: `/p/intake/${intakeToken}?token=${token}&expires=${expires}`,
  };
}

export interface IntakeTokenValidationResult {
  valid: boolean;
  /** Razón del fallo (solo presente cuando valid === false). */
  reason?: string;
}

/**
 * Valida un token HMAC-SHA256 de acceso al cuestionario de intake.
 *
 * La comparación de firmas es en tiempo constante (crypto.subtle.verify)
 * para prevenir ataques de temporización.
 *
 * @param intakeToken - UUID de patients.intake_token (del path de la URL)
 * @param token       - Token HMAC en hexadecimal (del query param)
 * @param expires     - Timestamp de expiración (del query param)
 */
export async function validateIntakeAccessToken(
  intakeToken: string,
  token: string,
  expires: string | number
): Promise<IntakeTokenValidationResult> {
  const expiresNum =
    typeof expires === 'string' ? parseInt(expires, 10) : expires;

  if (!Number.isFinite(expiresNum) || expiresNum <= 0) {
    return { valid: false, reason: 'expires inválido' };
  }

  if (Date.now() > expiresNum) {
    return { valid: false, reason: 'token expirado' };
  }

  const receivedBytes = hexToBytes(token);
  if (!receivedBytes) {
    return { valid: false, reason: 'token malformado' };
  }

  try {
    const secret = getIntakeTokenSecret();
    const message = buildMessage(intakeToken, expiresNum);
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
