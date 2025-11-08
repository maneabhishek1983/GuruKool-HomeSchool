/**
 * Simple console-based logger
 * TODO: Replace with pino for production use
 * Install: npm install pino
 */

const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = logLevels[level as keyof typeof logLevels] ?? 1;

const redactSensitive = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const redacted = { ...obj };
  const sensitiveKeys = ['password', 'token', 'apikey', 'authorization'];

  for (const key in redacted) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      redacted[key] = '[Redacted]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitive(redacted[key]);
    }
  }
  return redacted;
};

export const logger = {
  debug: (...args: any[]) => {
    if (currentLevel <= 0) {
      console.debug('[DEBUG]', ...args.map(redactSensitive));
    }
  },
  info: (...args: any[]) => {
    if (currentLevel <= 1) {
      console.info('[INFO]', ...args.map(redactSensitive));
    }
  },
  warn: (...args: any[]) => {
    if (currentLevel <= 2) {
      console.warn('[WARN]', ...args.map(redactSensitive));
    }
  },
  error: (...args: any[]) => {
    if (currentLevel <= 3) {
      console.error('[ERROR]', ...args.map(redactSensitive));
    }
  },
  child: (bindings: Record<string, any>) => ({
    debug: (...args: any[]) => logger.debug({ ...bindings }, ...args),
    info: (...args: any[]) => logger.info({ ...bindings }, ...args),
    warn: (...args: any[]) => logger.warn({ ...bindings }, ...args),
    error: (...args: any[]) => logger.error({ ...bindings }, ...args),
  }),
};

export function withRequestId(
  headers: Headers | Record<string, string | string[] | undefined>
) {
  const id =
    (headers as any)['x-request-id'] ||
    (headers instanceof Headers ? headers.get('x-request-id') : undefined) ||
    crypto.randomUUID();
  return logger.child({ requestId: Array.isArray(id) ? id[0] : id });
}
