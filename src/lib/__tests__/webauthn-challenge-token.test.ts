/**
 * @jest-environment node
 */
import {
  issueChallengeToken,
  verifyChallengeToken,
} from '@/lib/webauthn-challenge-token';

const ORIGINAL_SECRET = process.env.JWT_SECRET;

describe('webauthn-challenge-token', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-must-be-at-least-16-chars-long';
  });

  afterAll(() => {
    if (ORIGINAL_SECRET !== undefined) {
      process.env.JWT_SECRET = ORIGINAL_SECRET;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  it('round-trips a valid token', () => {
    const token = issueChallengeToken({
      challenge: 'abc123',
      userId: 'user-1',
      action: 'authenticate',
    });
    const result = verifyChallengeToken(token, {
      userId: 'user-1',
      action: 'authenticate',
    });
    expect(result.challenge).toBe('abc123');
    expect(result.userId).toBe('user-1');
    expect(result.action).toBe('authenticate');
  });

  it('rejects a token with a tampered body', () => {
    const token = issueChallengeToken({
      challenge: 'abc123',
      userId: 'user-1',
      action: 'authenticate',
    });
    const [body, sig] = token.split('.');
    // flip a char in body
    const tampered = `${body!.slice(0, -1)}${body!.slice(-1) === 'A' ? 'B' : 'A'}.${sig}`;
    expect(() =>
      verifyChallengeToken(tampered, {
        userId: 'user-1',
        action: 'authenticate',
      })
    ).toThrow(/signature/i);
  });

  it('rejects a token with a tampered signature', () => {
    const token = issueChallengeToken({
      challenge: 'abc123',
      userId: 'user-1',
      action: 'authenticate',
    });
    const [body] = token.split('.');
    const tampered = `${body}.AAAA`;
    expect(() =>
      verifyChallengeToken(tampered, {
        userId: 'user-1',
        action: 'authenticate',
      })
    ).toThrow(/signature/i);
  });

  it('rejects an expired token', () => {
    const token = issueChallengeToken({
      challenge: 'abc',
      userId: 'u',
      action: 'authenticate',
      ttlSeconds: -1, // already expired
    });
    expect(() =>
      verifyChallengeToken(token, { userId: 'u', action: 'authenticate' })
    ).toThrow(/expired/i);
  });

  it('rejects a user mismatch (token issued for a different user)', () => {
    const token = issueChallengeToken({
      challenge: 'abc',
      userId: 'user-A',
      action: 'authenticate',
    });
    expect(() =>
      verifyChallengeToken(token, { userId: 'user-B', action: 'authenticate' })
    ).toThrow(/user mismatch/i);
  });

  it('rejects action mismatch (register token used for authenticate)', () => {
    const token = issueChallengeToken({
      challenge: 'abc',
      userId: 'u',
      action: 'register',
    });
    expect(() =>
      verifyChallengeToken(token, { userId: 'u', action: 'authenticate' })
    ).toThrow(/action mismatch/i);
  });

  it('rejects malformed token', () => {
    expect(() =>
      verifyChallengeToken('not.a.valid.token', {
        userId: 'u',
        action: 'authenticate',
      })
    ).toThrow(/malformed|signature/i);
    expect(() =>
      verifyChallengeToken('nosig', { userId: 'u', action: 'authenticate' })
    ).toThrow(/malformed/i);
  });

  it('round-trips a face-verify token with resourceId binding', () => {
    const token = issueChallengeToken({
      challenge: 'face-chal',
      userId: 'teacher-1',
      action: 'face-verify',
      resourceId: 'student-7',
    });
    const result = verifyChallengeToken(token, {
      userId: 'teacher-1',
      action: 'face-verify',
      resourceId: 'student-7',
    });
    expect(result.action).toBe('face-verify');
    expect(result.resourceId).toBe('student-7');
  });

  it('rejects when resourceId does not match (cross-student token reuse)', () => {
    const token = issueChallengeToken({
      challenge: 'face-chal',
      userId: 'teacher-1',
      action: 'face-verify',
      resourceId: 'student-7',
    });
    expect(() =>
      verifyChallengeToken(token, {
        userId: 'teacher-1',
        action: 'face-verify',
        resourceId: 'student-8',
      })
    ).toThrow(/resource mismatch/i);
  });

  it('accepts a tokenless resourceId expectation when token has no resourceId (backwards compat)', () => {
    const token = issueChallengeToken({
      challenge: 'chal',
      userId: 'u',
      action: 'authenticate',
      // no resourceId set
    });
    // Caller didn't ask for one either → should succeed
    const result = verifyChallengeToken(token, {
      userId: 'u',
      action: 'authenticate',
    });
    expect(result.resourceId).toBeUndefined();
  });

  it('requires JWT_SECRET to be set and >= 16 chars', () => {
    process.env.JWT_SECRET = 'short';
    expect(() =>
      issueChallengeToken({
        challenge: 'a',
        userId: 'u',
        action: 'authenticate',
      })
    ).toThrow(/JWT_SECRET/);
  });
});
