/**
 * Server-only module protection
 * 
 * Import this file in modules that should NEVER be imported client-side
 * to prevent accidental exposure of server-side secrets
 * 
 * @example
 * ```typescript
 * import '@/lib/server-only';
 * 
 * export function getSecretKey() {
 *   return process.env.SECRET_KEY;
 * }
 * ```
 */

if (typeof window !== 'undefined') {
  throw new Error(
    '❌ This module can only be used on the server side. ' +
    'It contains sensitive server-only code that should never be exposed to the client.'
  );
}

export {};
