/**
 * Face Descriptor Encryption Service
 * Provides AES-256-GCM encryption for face descriptors at rest
 *
 * SECURITY CRITICAL:
 * - All face descriptors MUST be encrypted before database storage
 * - Decryption only happens server-side during verification
 * - Never expose decrypted descriptors to clients
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV size
const AUTH_TAG_LENGTH = 16; // GCM auth tag size
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment
 * @throws Error if key is not configured or invalid
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.FACE_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'FACE_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: openssl rand -hex 32'
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      'FACE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        'Generate one with: openssl rand -hex 32'
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a face descriptor for storage
 *
 * @param descriptor - Array of 128 floats representing the face descriptor
 * @returns Encrypted buffer in format: IV (12 bytes) || Ciphertext || AuthTag (16 bytes)
 * @throws Error if descriptor is invalid or encryption fails
 *
 * @example
 * const descriptor = [0.1, 0.2, ...]; // 128 floats
 * const encrypted = await encryptFaceDescriptor(descriptor);
 * // Store encrypted in database as BYTEA
 */
export async function encryptFaceDescriptor(
  descriptor: number[]
): Promise<Buffer> {
  // Validate input
  if (!Array.isArray(descriptor)) {
    throw new Error('Descriptor must be an array');
  }

  if (descriptor.length !== 128) {
    throw new Error(
      `Descriptor must have exactly 128 elements, got ${descriptor.length}`
    );
  }

  // Validate all elements are valid numbers
  for (let i = 0; i < descriptor.length; i++) {
    if (typeof descriptor[i] !== 'number' || !Number.isFinite(descriptor[i])) {
      throw new Error(`Invalid descriptor value at index ${i}`);
    }
  }

  // Convert descriptor to buffer (128 floats * 4 bytes = 512 bytes)
  const descriptorBuffer = Buffer.from(new Float32Array(descriptor).buffer);

  // Generate random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Get encryption key
  const key = getEncryptionKey();

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the descriptor
  const encrypted = Buffer.concat([
    cipher.update(descriptorBuffer),
    cipher.final(),
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine: IV || Ciphertext || AuthTag
  return Buffer.concat([iv, encrypted, authTag]);
}

/**
 * Decrypt a face descriptor from storage
 *
 * @param encryptedData - Encrypted buffer in format: IV || Ciphertext || AuthTag
 * @returns Array of 128 floats representing the face descriptor
 * @throws Error if decryption fails or data is tampered
 *
 * @example
 * const encrypted = await getFromDatabase(studentId);
 * const descriptor = await decryptFaceDescriptor(encrypted);
 * // Use descriptor for server-side matching
 */
export async function decryptFaceDescriptor(
  encryptedData: Buffer
): Promise<number[]> {
  // Validate input
  if (!Buffer.isBuffer(encryptedData)) {
    throw new Error('Encrypted data must be a Buffer');
  }

  // Minimum size: IV (12) + at least some ciphertext + AuthTag (16)
  const minSize = IV_LENGTH + 4 + AUTH_TAG_LENGTH; // At least 1 float
  if (encryptedData.length < minSize) {
    throw new Error('Encrypted data is too short');
  }

  // Extract components
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(-AUTH_TAG_LENGTH);
  const ciphertext = encryptedData.subarray(IV_LENGTH, -AUTH_TAG_LENGTH);

  // Get encryption key
  const key = getEncryptionKey();

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt
  let decrypted: Buffer;
  try {
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (error) {
    // GCM authentication failed - data may have been tampered
    throw new Error('Decryption failed: authentication tag mismatch');
  }

  // Validate decrypted size (should be 512 bytes = 128 floats)
  if (decrypted.length !== 512) {
    throw new Error(
      `Unexpected decrypted size: expected 512 bytes, got ${decrypted.length}`
    );
  }

  // Convert buffer back to float array
  const float32Array = new Float32Array(
    decrypted.buffer,
    decrypted.byteOffset,
    128
  );

  return Array.from(float32Array);
}

/**
 * Verify that the encryption key is properly configured
 * Call this during application startup to fail fast
 */
export function verifyEncryptionKeyConfiguration(): void {
  try {
    const key = getEncryptionKey();
    if (key.length !== KEY_LENGTH) {
      throw new Error('Invalid key length');
    }
    console.log('[FaceEncryption] Encryption key verified');
  } catch (error) {
    console.error('[FaceEncryption] Key verification failed:', error);
    throw error;
  }
}

/**
 * Test encryption/decryption round-trip
 * Useful for testing and debugging
 */
export async function testEncryptionRoundTrip(): Promise<boolean> {
  const testDescriptor = Array.from({ length: 128 }, (_, i) =>
    Math.sin(i * 0.1)
  );

  try {
    const encrypted = await encryptFaceDescriptor(testDescriptor);
    const decrypted = await decryptFaceDescriptor(encrypted);

    // Verify values match
    for (let i = 0; i < 128; i++) {
      const original = testDescriptor[i];
      const restored = decrypted[i];
      if (
        original === undefined ||
        restored === undefined ||
        Math.abs(original - restored) > 1e-6
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get encryption metadata for audit purposes
 * Does not expose the actual key
 */
export function getEncryptionMetadata(): {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  authTagLength: number;
} {
  return {
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH * 8, // Convert to bits
    ivLength: IV_LENGTH,
    authTagLength: AUTH_TAG_LENGTH,
  };
}
