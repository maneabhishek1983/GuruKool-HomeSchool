export interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate a new CSRF token
 */
export function generateToken(): string {
  const token =
    globalThis.crypto?.randomUUID?.() || `${Math.random()}-${Date.now()}`;
  const timestamp = Date.now();
  const tokenData: CSRFToken = { token, timestamp };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

/**
 * Validate a CSRF token
 */
export function validateToken(
  token: string | null,
  cookieToken: string | null
): boolean {
  if (!token || !cookieToken) {
    return false;
  }

  try {
    // Decode the token from base64
    const tokenData: CSRFToken = JSON.parse(
      Buffer.from(token, 'base64').toString('utf-8')
    );

    // Check if token is expired (24 hours)
    const now = Date.now();
    const tokenAge = now - tokenData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return false;
    }

    // Verify token matches cookie token
    return token === cookieToken;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Extract CSRF token from request headers
 */
export function extractTokenFromHeaders(headers: Headers): string | null {
  return headers.get('x-csrf-token') || headers.get('csrf-token');
}

/**
 * Create a CSRF token for forms
 */
export function createFormToken(): { token: string; fieldName: string } {
  return {
    token: generateToken(),
    fieldName: '_csrf',
  };
}
