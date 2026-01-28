/**
 * Face Encryption Service Unit Tests
 */

import {
  encryptFaceDescriptor,
  decryptFaceDescriptor,
  testEncryptionRoundTrip,
  getEncryptionMetadata,
} from '../face-encryption';

// Mock environment variable
const MOCK_ENCRYPTION_KEY =
  'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

describe('Face Encryption Service', () => {
  beforeAll(() => {
    // Set up the encryption key for tests
    process.env.FACE_ENCRYPTION_KEY = MOCK_ENCRYPTION_KEY;
  });

  afterAll(() => {
    // Clean up
    delete process.env.FACE_ENCRYPTION_KEY;
  });

  describe('encryptFaceDescriptor', () => {
    it('should encrypt a valid 128-dimensional descriptor', async () => {
      const descriptor = Array.from({ length: 128 }, (_, i) => i * 0.01);

      const encrypted = await encryptFaceDescriptor(descriptor);

      expect(encrypted).toBeInstanceOf(Buffer);
      // Encrypted data should be: IV (12) + Ciphertext (512) + AuthTag (16) = 540 bytes
      expect(encrypted.length).toBe(540);
    });

    it('should produce different ciphertext with different IVs', async () => {
      const descriptor = Array.from({ length: 128 }, () => Math.random());

      const encrypted1 = await encryptFaceDescriptor(descriptor);
      const encrypted2 = await encryptFaceDescriptor(descriptor);

      // Same descriptor should produce different ciphertext due to random IVs
      expect(encrypted1.equals(encrypted2)).toBe(false);
    });

    it('should reject non-array input', async () => {
      // @ts-expect-error - testing invalid input
      await expect(encryptFaceDescriptor('not an array')).rejects.toThrow(
        'Descriptor must be an array'
      );
    });

    it('should reject arrays with wrong length', async () => {
      const shortDescriptor = Array.from({ length: 64 }, () => Math.random());

      await expect(encryptFaceDescriptor(shortDescriptor)).rejects.toThrow(
        'Descriptor must have exactly 128 elements'
      );
    });

    it('should reject arrays with non-finite values', async () => {
      const invalidDescriptor = Array.from({ length: 128 }, () => 0);
      invalidDescriptor[50] = NaN;

      await expect(encryptFaceDescriptor(invalidDescriptor)).rejects.toThrow(
        'Invalid descriptor value at index 50'
      );
    });

    it('should reject arrays with infinite values', async () => {
      const invalidDescriptor = Array.from({ length: 128 }, () => 0);
      invalidDescriptor[25] = Infinity;

      await expect(encryptFaceDescriptor(invalidDescriptor)).rejects.toThrow(
        'Invalid descriptor value at index 25'
      );
    });
  });

  describe('decryptFaceDescriptor', () => {
    it('should decrypt an encrypted descriptor correctly', async () => {
      const originalDescriptor = Array.from({ length: 128 }, (_, i) =>
        Math.sin(i * 0.1)
      );

      const encrypted = await encryptFaceDescriptor(originalDescriptor);
      const decrypted = await decryptFaceDescriptor(encrypted);

      expect(decrypted.length).toBe(128);

      // Check values match within floating point tolerance
      for (let i = 0; i < 128; i++) {
        expect(decrypted[i]).toBeCloseTo(originalDescriptor[i]!, 5);
      }
    });

    it('should throw on tampered data', async () => {
      const descriptor = Array.from({ length: 128 }, () => Math.random());
      const encrypted = await encryptFaceDescriptor(descriptor);

      // Tamper with the ciphertext
      encrypted[20] = encrypted[20]! ^ 0xff;

      await expect(decryptFaceDescriptor(encrypted)).rejects.toThrow(
        'Decryption failed: authentication tag mismatch'
      );
    });

    it('should reject non-Buffer input', async () => {
      // @ts-expect-error - testing invalid input
      await expect(decryptFaceDescriptor('not a buffer')).rejects.toThrow(
        'Encrypted data must be a Buffer'
      );
    });

    it('should reject too-short data', async () => {
      const shortData = Buffer.alloc(20);

      await expect(decryptFaceDescriptor(shortData)).rejects.toThrow(
        'Encrypted data is too short'
      );
    });
  });

  describe('testEncryptionRoundTrip', () => {
    it('should return true for valid round-trip', async () => {
      const result = await testEncryptionRoundTrip();
      expect(result).toBe(true);
    });
  });

  describe('getEncryptionMetadata', () => {
    it('should return correct encryption parameters', () => {
      const metadata = getEncryptionMetadata();

      expect(metadata).toEqual({
        algorithm: 'aes-256-gcm',
        keyLength: 256,
        ivLength: 12,
        authTagLength: 16,
      });
    });
  });

  describe('Missing encryption key', () => {
    it('should throw error when key is not set', async () => {
      const originalKey = process.env.FACE_ENCRYPTION_KEY;
      delete process.env.FACE_ENCRYPTION_KEY;

      const descriptor = Array.from({ length: 128 }, () => 0);

      await expect(encryptFaceDescriptor(descriptor)).rejects.toThrow(
        'FACE_ENCRYPTION_KEY environment variable is not set'
      );

      // Restore key
      process.env.FACE_ENCRYPTION_KEY = originalKey;
    });

    it('should throw error when key is wrong length', async () => {
      const originalKey = process.env.FACE_ENCRYPTION_KEY;
      process.env.FACE_ENCRYPTION_KEY = 'tooshort';

      const descriptor = Array.from({ length: 128 }, () => 0);

      await expect(encryptFaceDescriptor(descriptor)).rejects.toThrow(
        'FACE_ENCRYPTION_KEY must be a 64-character hex string'
      );

      // Restore key
      process.env.FACE_ENCRYPTION_KEY = originalKey;
    });
  });
});
