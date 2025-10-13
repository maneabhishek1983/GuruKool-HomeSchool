import pino from 'pino';

const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.token', '*.apikey'],
    censor: '[Redacted]',
  },
  base: undefined,
});

export function withRequestId(
  headers: Headers | Record<string, string | string[] | undefined>
) {
  const id =
    (headers as any)['x-request-id'] ||
    (headers instanceof Headers ? headers.get('x-request-id') : undefined) ||
    crypto.randomUUID();
  return logger.child({ requestId: Array.isArray(id) ? id[0] : id });
}
