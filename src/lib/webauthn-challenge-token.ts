import '@/lib/server-only';
import crypto from 'crypto';

/**
 * Stateless WebAuthn challenge tokens.
 *
 * The server issues a challenge plus an HMAC-signed token binding that
 * challenge to a userId/action and an expiry. The client echoes the token
 * back at verify time. The server validates the HMAC and expiry before
 * passing the embedded challenge to @simplewebauthn/server.
 *
 * Replay defense is provided by the WebAuthn counter check (in
 * WebAuthnService.verifyAuthenticationResponse + atomic counter update),
 * not by the token itself — a token may technically be presented twice
 * within its TTL window, but only the first response will advance the
 * counter; subsequent ones fail the monotonicity check.
 *
 * No DB table required.
 */

const TTL_SECONDS = 5 * 60; // 5 min, matches the challenge endpoint's stated lifetime

export type ChallengeAction = 'register' | 'authenticate' | 'face-verify';

interface ChallengePayload {
  c: string; // challenge (base64)
  u: string; // userId issuing the token
  a: ChallengeAction;
  e: number; // expiry unix seconds
  /** Optional resource id (e.g. studentId for face-verify). Bound at issue, checked at verify. */
  r?: string;
}

function getSecret(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET must be set (>= 16 chars) to issue WebAuthn challenge tokens'
    );
  }
  return Buffer.from(secret, 'utf8');
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8');
  return b
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function issueChallengeToken(params: {
  challenge: string;
  userId: string;
  action: ChallengeAction;
  ttlSeconds?: number;
  /** Optional resource id to bind into the token (e.g. studentId for face-verify). */
  resourceId?: string;
}): string {
  const {
    challenge,
    userId,
    action,
    ttlSeconds = TTL_SECONDS,
    resourceId,
  } = params;
  const payload: ChallengePayload = {
    c: challenge,
    u: userId,
    a: action,
    e: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...(resourceId ? { r: resourceId } : {}),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    crypto.createHmac('sha256', getSecret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

export interface VerifiedChallengeToken {
  challenge: string;
  userId: string;
  action: ChallengeAction;
  resourceId?: string;
}

export function verifyChallengeToken(
  token: string,
  expected: { userId: string; action: ChallengeAction; resourceId?: string }
): VerifiedChallengeToken {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Malformed challenge token');
  }
  const [body, sig] = parts as [string, string];

  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(body)
    .digest();
  const providedSig = b64urlDecode(sig);
  if (
    expectedSig.length !== providedSig.length ||
    !crypto.timingSafeEqual(expectedSig, providedSig)
  ) {
    throw new Error('Invalid challenge token signature');
  }

  let payload: ChallengePayload;
  try {
    payload = JSON.parse(
      b64urlDecode(body).toString('utf8')
    ) as ChallengePayload;
  } catch {
    throw new Error('Malformed challenge token payload');
  }

  if (payload.e < Math.floor(Date.now() / 1000)) {
    throw new Error('Challenge token expired');
  }
  if (payload.u !== expected.userId) {
    throw new Error('Challenge token user mismatch');
  }
  if (payload.a !== expected.action) {
    throw new Error('Challenge token action mismatch');
  }
  if (expected.resourceId !== undefined && payload.r !== expected.resourceId) {
    throw new Error('Challenge token resource mismatch');
  }

  return {
    challenge: payload.c,
    userId: payload.u,
    action: payload.a,
    ...(payload.r ? { resourceId: payload.r } : {}),
  };
}
