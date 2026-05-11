/**
 * @jest-environment jsdom
 */
import { TextEncoder } from 'util';
import { BiometricService } from '@/services/biometric.service';

// jsdom doesn't ship TextEncoder on the global by default.
if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = TextEncoder;
}

const fetchMock = global.fetch as jest.Mock;
const credentialsCreate = (navigator.credentials as any).create as jest.Mock;
const credentialsGet = (navigator.credentials as any).get as jest.Mock;
const isPlatformAvailable = (window.PublicKeyCredential as any)
  .isUserVerifyingPlatformAuthenticatorAvailable as jest.Mock;

function base64(s: string): string {
  return Buffer.from(s).toString('base64');
}

function fakeAttestationCredential(id = 'cred-1') {
  const publicKeyBytes = new TextEncoder().encode('FAKE-PUBLIC-KEY').buffer;
  return {
    id,
    rawId: new TextEncoder().encode(id).buffer,
    type: 'public-key',
    response: {
      getPublicKey: () => publicKeyBytes,
      attestationObject: new ArrayBuffer(0),
      clientDataJSON: new ArrayBuffer(0),
    },
  };
}

function fakeAssertion(id = 'cred-1') {
  return {
    id,
    rawId: new TextEncoder().encode(id).buffer,
    type: 'public-key',
    response: {
      signature: new TextEncoder().encode('SIG').buffer,
      authenticatorData: new TextEncoder().encode('AUTH').buffer,
      clientDataJSON: new TextEncoder().encode('CDJ').buffer,
      userHandle: null,
    },
  };
}

describe('BiometricService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    credentialsCreate.mockReset();
    credentialsGet.mockReset();
    isPlatformAvailable.mockReset().mockResolvedValue(true);
  });

  describe('feature detection', () => {
    it('isSupported returns true when PublicKeyCredential is on window', () => {
      expect(BiometricService.isSupported()).toBe(true);
    });

    it('isPlatformAuthenticatorAvailable resolves true via mock', async () => {
      await expect(
        BiometricService.isPlatformAuthenticatorAvailable()
      ).resolves.toBe(true);
    });

    it('isPlatformAuthenticatorAvailable resolves false when the API throws', async () => {
      isPlatformAvailable.mockRejectedValueOnce(new Error('boom'));
      await expect(
        BiometricService.isPlatformAuthenticatorAvailable()
      ).resolves.toBe(false);
    });
  });

  describe('authenticate()', () => {
    const teacherId = '11111111-1111-1111-1111-111111111111';

    it('echoes the challengeToken back to the verify step', async () => {
      // /challenge response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: base64('chal'),
          challengeToken: 'token.abc',
          credentialIds: [base64('cred-1')],
        }),
      });

      credentialsGet.mockResolvedValueOnce(fakeAssertion('cred-1'));

      const result = await BiometricService.authenticate(teacherId);

      expect(result.challengeToken).toBe('token.abc');
      expect(result.success).toBe(true);
      expect(result.signature).toBeTruthy();
      expect(result.authenticatorData).toBeTruthy();
      expect(result.clientDataJSON).toBeTruthy();
    });

    it('throws if the server omits a challengeToken (legacy server)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: base64('chal'),
          // challengeToken missing
          credentialIds: [base64('cred-1')],
        }),
      });

      await expect(BiometricService.authenticate(teacherId)).rejects.toThrow(
        /challenge token/i
      );
      expect(credentialsGet).not.toHaveBeenCalled();
    });

    it('throws if no credentials are registered', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: base64('chal'),
          challengeToken: 'token.abc',
          credentialIds: [],
        }),
      });

      await expect(BiometricService.authenticate(teacherId)).rejects.toThrow(
        /no biometric credentials/i
      );
    });

    it('maps NotAllowedError to a user-friendly cancellation message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challenge: base64('chal'),
          challengeToken: 'token.abc',
          credentialIds: [base64('cred-1')],
        }),
      });
      const err = new Error('denied');
      err.name = 'NotAllowedError';
      credentialsGet.mockRejectedValueOnce(err);

      await expect(BiometricService.authenticate(teacherId)).rejects.toThrow(
        /cancelled/i
      );
    });
  });

  describe('verify()', () => {
    const teacherId = '11111111-1111-1111-1111-111111111111';

    it('POSTs challengeToken to /api/biometric/verify and returns verified flag', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verified: true }),
      });

      const ok = await BiometricService.verify(teacherId, {
        success: true,
        credentialId: 'cred-1',
        signature: 'sig',
        authenticatorData: 'auth',
        clientDataJSON: 'cdj',
        challengeToken: 'token.abc',
      });

      expect(ok).toBe(true);
      const [, init] = fetchMock.mock.calls[0]!;
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.challengeToken).toBe('token.abc');
      expect(body.teacherId).toBe(teacherId);
      expect(body.credentialId).toBe('cred-1');
    });

    it('rejects when server returns verified: false', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verified: false, error: 'replay' }),
      });

      const ok = await BiometricService.verify(teacherId, {
        success: true,
        credentialId: 'cred-1',
        signature: 'sig',
        authenticatorData: 'auth',
        clientDataJSON: 'cdj',
        challengeToken: 'token.abc',
      });

      expect(ok).toBe(false);
    });

    it('throws on non-2xx server response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid challenge' }),
      });

      await expect(
        BiometricService.verify(teacherId, {
          success: true,
          credentialId: 'cred-1',
          signature: 'sig',
          authenticatorData: 'auth',
          clientDataJSON: 'cdj',
          challengeToken: 'token.abc',
        })
      ).rejects.toThrow(/Invalid challenge/);
    });
  });
});
