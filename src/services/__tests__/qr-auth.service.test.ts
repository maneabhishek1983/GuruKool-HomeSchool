/**
 * QR Auth Service Tests
 * Tests for QR code generation and token verification
 */

import QRAuthService, { qrAuthService, QRToken } from '../qr-auth.service';

// Mock the qrcode library
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

describe('QRAuthService', () => {
  let service: typeof qrAuthService;

  beforeEach(() => {
    // Create a fresh instance for each test
    service = new (QRAuthService as any)();
  });

  describe('generateQRToken', () => {
    it('should generate a valid QR code data URL', async () => {
      const result = await service.generateQRToken(
        'test@example.com',
        'parent'
      );

      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should create a token with correct properties', async () => {
      const email = 'teacher@example.com';
      const role = 'teacher';

      await service.generateQRToken(email, role);

      // Access internal tokens map (for testing)
      const tokens = (service as any).tokens;
      expect(tokens.size).toBe(1);

      const token = tokens.values().next().value as QRToken;
      expect(token.email).toBe(email);
      expect(token.role).toBe(role);
      expect(token.used).toBe(false);
    });

    it('should set token expiration to 5 minutes from now', async () => {
      const beforeGenerate = Date.now();
      await service.generateQRToken('test@example.com', 'parent');
      const afterGenerate = Date.now();

      const tokens = (service as any).tokens;
      const token = tokens.values().next().value as QRToken;
      const expiresAt = new Date(token.expiresAt).getTime();

      // Token should expire approximately 5 minutes from now
      const fiveMinutes = 5 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(
        beforeGenerate + fiveMinutes - 100
      );
      expect(expiresAt).toBeLessThanOrEqual(afterGenerate + fiveMinutes + 100);
    });

    it('should generate unique token IDs', async () => {
      await service.generateQRToken('test1@example.com', 'parent');
      await service.generateQRToken('test2@example.com', 'teacher');

      const tokens = (service as any).tokens;
      const tokenIds = Array.from(tokens.keys());

      expect(tokenIds[0]).not.toBe(tokenIds[1]);
    });

    it('should include qr_ prefix in token ID', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      const tokenId = tokens.keys().next().value as string;

      expect(tokenId).toMatch(/^qr_/);
    });
  });

  describe('verifyQRToken', () => {
    it('should return token data for valid token', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      const tokenId = tokens.keys().next().value as string;

      const result = service.verifyQRToken(tokenId);

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
      expect(result?.role).toBe('parent');
    });

    it('should return null for non-existent token', () => {
      const result = service.verifyQRToken('non_existent_token');

      expect(result).toBeNull();
    });

    it('should mark token as used after verification', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      const tokenId = tokens.keys().next().value as string;

      service.verifyQRToken(tokenId);

      const token = tokens.get(tokenId) as QRToken;
      expect(token.used).toBe(true);
    });

    it('should return null for already used token', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      const tokenId = tokens.keys().next().value as string;

      // First verification should succeed
      const firstResult = service.verifyQRToken(tokenId);
      expect(firstResult).not.toBeNull();

      // Second verification should fail
      const secondResult = service.verifyQRToken(tokenId);
      expect(secondResult).toBeNull();
    });

    it('should return null for expired token', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      const tokenId = tokens.keys().next().value as string;
      const token = tokens.get(tokenId) as QRToken;

      // Manually expire the token
      token.expiresAt = new Date(Date.now() - 1000).toISOString();
      tokens.set(tokenId, token);

      const result = service.verifyQRToken(tokenId);

      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      const tokenId = tokens.keys().next().value as string;
      const token = tokens.get(tokenId) as QRToken;

      // Manually expire the token
      token.expiresAt = new Date(Date.now() - 1000).toISOString();
      tokens.set(tokenId, token);

      expect(tokens.size).toBe(1);

      service.cleanupExpiredTokens();

      expect(tokens.size).toBe(0);
    });

    it('should keep valid tokens', async () => {
      await service.generateQRToken('test@example.com', 'parent');

      const tokens = (service as any).tokens;
      expect(tokens.size).toBe(1);

      service.cleanupExpiredTokens();

      expect(tokens.size).toBe(1);
    });

    it('should handle mixed expired and valid tokens', async () => {
      // Create valid token
      await service.generateQRToken('valid@example.com', 'parent');

      // Create expired token
      await service.generateQRToken('expired@example.com', 'teacher');

      const tokens = (service as any).tokens;
      const tokenIds = Array.from(tokens.keys()) as string[];

      // Manually expire the second token
      const expiredToken = tokens.get(tokenIds[1]) as QRToken;
      expiredToken.expiresAt = new Date(Date.now() - 1000).toISOString();
      tokens.set(tokenIds[1]!, expiredToken);

      expect(tokens.size).toBe(2);

      service.cleanupExpiredTokens();

      expect(tokens.size).toBe(1);
    });
  });

  describe('QR code format', () => {
    it('should call QRCode.toDataURL with correct options', async () => {
      const QRCode = require('qrcode');

      await service.generateQRToken('test@example.com', 'parent');

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 1,
          margin: 4,
          width: 512,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
      );
    });

    it('should include required fields in QR data', async () => {
      const QRCode = require('qrcode');

      await service.generateQRToken('test@example.com', 'parent');

      const qrDataArg = QRCode.toDataURL.mock.calls[0][0];
      const qrData = JSON.parse(qrDataArg);

      expect(qrData).toHaveProperty('token');
      expect(qrData).toHaveProperty('email', 'test@example.com');
      expect(qrData).toHaveProperty('role', 'parent');
      expect(qrData).toHaveProperty('timestamp');
      expect(qrData).toHaveProperty('version', '1.0');
    });
  });

  describe('error handling', () => {
    it('should throw error when QR code generation fails', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL.mockRejectedValueOnce(new Error('QR generation failed'));

      await expect(
        service.generateQRToken('test@example.com', 'parent')
      ).rejects.toThrow('Failed to generate QR code');
    });
  });
});

describe('qrAuthService singleton', () => {
  it('should export a singleton instance', () => {
    expect(qrAuthService).toBeDefined();
    expect(typeof qrAuthService.generateQRToken).toBe('function');
    expect(typeof qrAuthService.verifyQRToken).toBe('function');
    expect(typeof qrAuthService.cleanupExpiredTokens).toBe('function');
  });
});
