/**
 * Biometric Authentication Service
 *
 * Handles WebAuthn biometric authentication (Face ID, Touch ID, Fingerprint)
 * for secure teacher check-in/out
 */

export interface BiometricCredential {
  credentialId: string;
  publicKey: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'other';
}

export interface BiometricAuthResult {
  success: boolean;
  credentialId: string;
  signature: string;
  authenticatorData: string;
  clientDataJSON: string;
}

export class BiometricService {
  /**
   * Check if biometric authentication is supported
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function'
    );
  }

  /**
   * Check if platform authenticator (device biometrics) is available
   */
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Get device type
   */
  private static getDeviceType(): 'ios' | 'android' | 'web' | 'other' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return 'ios';
    } else if (/android/.test(userAgent)) {
      return 'android';
    } else if (/mobile/.test(userAgent)) {
      return 'other';
    }

    return 'web';
  }

  /**
   * Get friendly device name
   */
  private static getDeviceName(): string {
    const userAgent = navigator.userAgent;
    const deviceType = this.getDeviceType();

    switch (deviceType) {
      case 'ios':
        if (/ipad/.test(userAgent.toLowerCase())) {
          return 'iPad';
        } else if (/iphone/.test(userAgent.toLowerCase())) {
          return 'iPhone';
        }
        return 'iOS Device';
      case 'android':
        return 'Android Device';
      default:
        return 'Web Browser';
    }
  }

  /**
   * Register biometric credential
   */
  static async register(teacherId: string): Promise<BiometricCredential> {
    if (!this.isSupported()) {
      throw new Error(
        'Biometric authentication is not supported on this device'
      );
    }

    const available = await this.isPlatformAuthenticatorAvailable();
    if (!available) {
      throw new Error(
        'Device biometrics (Face ID, Touch ID, Fingerprint) are not available'
      );
    }

    try {
      // Get challenge from server
      const challengeResponse = await fetch('/api/biometric/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, action: 'register' }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get registration challenge');
      }

      const { challenge } = await challengeResponse.json();

      // Create credential
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: this.base64ToArrayBuffer(challenge),
          rp: {
            name: 'GuruKool HomeSchool',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(teacherId),
            name: teacherId,
            displayName: 'Teacher',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256 (recommended)
            { type: 'public-key', alg: -257 }, // RS256 (fallback)
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Use device biometrics
            userVerification: 'required', // Require biometric verification
            residentKey: 'preferred', // Store credential on device
          },
          timeout: 60000, // 60 seconds
          attestation: 'none', // No attestation needed for our use case
        },
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create biometric credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Register credential with server
      const registrationResponse = await fetch('/api/biometric/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          credentialId: credential.id,
          publicKey: this.arrayBufferToBase64(response.getPublicKey()!),
          deviceName: this.getDeviceName(),
          deviceType: this.getDeviceType(),
        }),
      });

      if (!registrationResponse.ok) {
        const error = await registrationResponse.json();
        throw new Error(
          error.error || 'Failed to register biometric credential'
        );
      }

      const result = await registrationResponse.json();

      return {
        credentialId: credential.id,
        publicKey: this.arrayBufferToBase64(response.getPublicKey()!),
        deviceName: this.getDeviceName(),
        deviceType: this.getDeviceType(),
      };
    } catch (error) {
      console.error('Biometric registration error:', error);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Biometric registration was cancelled');
        } else if (error.name === 'InvalidStateError') {
          throw new Error('This device is already registered');
        }
      }

      throw error;
    }
  }

  /**
   * Authenticate with biometric
   */
  static async authenticate(teacherId: string): Promise<BiometricAuthResult> {
    if (!this.isSupported()) {
      throw new Error(
        'Biometric authentication is not supported on this device'
      );
    }

    try {
      // Get challenge from server
      const challengeResponse = await fetch('/api/biometric/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, action: 'authenticate' }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { challenge, credentialIds } = await challengeResponse.json();

      if (!credentialIds || credentialIds.length === 0) {
        throw new Error(
          'No biometric credentials registered. Please register first.'
        );
      }

      // Request authentication
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: this.base64ToArrayBuffer(challenge),
          allowCredentials: credentialIds.map((id: string) => ({
            type: 'public-key' as const,
            id: this.base64ToArrayBuffer(id),
          })),
          userVerification: 'required', // Require biometric verification
          timeout: 60000, // 60 seconds
        },
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Biometric authentication failed');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      return {
        success: true,
        credentialId: assertion.id,
        signature: this.arrayBufferToBase64(response.signature),
        authenticatorData: this.arrayBufferToBase64(response.authenticatorData),
        clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON),
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Biometric authentication was cancelled');
        } else if (error.name === 'InvalidStateError') {
          throw new Error(
            'No biometric credentials found. Please register first.'
          );
        }
      }

      throw error;
    }
  }

  /**
   * Verify biometric authentication with server
   */
  static async verify(
    teacherId: string,
    authResult: BiometricAuthResult
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/biometric/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          credentialId: authResult.credentialId,
          signature: authResult.signature,
          authenticatorData: authResult.authenticatorData,
          clientDataJSON: authResult.clientDataJSON,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Biometric verification failed');
      }

      const result = await response.json();
      return result.verified === true;
    } catch (error) {
      console.error('Biometric verification error:', error);
      throw error;
    }
  }

  /**
   * List registered credentials
   */
  static async listCredentials(
    teacherId: string
  ): Promise<BiometricCredential[]> {
    try {
      const response = await fetch(
        `/api/biometric/credentials?teacherId=${teacherId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const result = await response.json();
      return result.credentials || [];
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return [];
    }
  }

  /**
   * Revoke credential
   */
  static async revokeCredential(credentialId: string): Promise<void> {
    try {
      const response = await fetch('/api/biometric/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke credential');
      }
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw error;
    }
  }

  /**
   * Get biometric type description
   */
  static getBiometricTypeDescription(): string {
    const deviceType = this.getDeviceType();

    switch (deviceType) {
      case 'ios':
        return 'Face ID or Touch ID';
      case 'android':
        return 'Fingerprint or Face Unlock';
      default:
        return 'Biometric authentication';
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }

  /**
   * Helper: Convert Base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
