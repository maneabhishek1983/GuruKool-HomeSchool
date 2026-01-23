/**
 * WebAuthn Service
 *
 * Provides proper WebAuthn verification using @simplewebauthn/server
 * for secure biometric authentication
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';

// Configuration - these should come from environment variables
const RP_NAME = 'GuruKool HomeSchool';
const RP_ID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface StoredCredential {
  credentialId: string;
  credentialPublicKey: string; // Base64 encoded
  counter: number;
  transports?: AuthenticatorTransportFuture[] | undefined;
}

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout: number;
  authenticatorSelection: {
    authenticatorAttachment: 'platform' | 'cross-platform';
    userVerification: 'required' | 'preferred' | 'discouraged';
    residentKey: 'required' | 'preferred' | 'discouraged';
  };
  attestation: 'none' | 'indirect' | 'direct' | 'enterprise';
}

export interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransportFuture[];
  }>;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

export interface RegistrationVerificationResult {
  verified: boolean;
  credential?: {
    credentialId: string;
    credentialPublicKey: string;
    counter: number;
    credentialType: string;
    transports?: AuthenticatorTransportFuture[];
  };
  error?: string;
}

export interface AuthenticationVerificationResult {
  verified: boolean;
  newCounter?: number;
  credentialId?: string;
  error?: string;
}

export class WebAuthnService {
  private rpName: string;
  private rpId: string;
  private origin: string;

  constructor(options?: { rpName?: string; rpId?: string; origin?: string }) {
    this.rpName = options?.rpName || RP_NAME;
    this.rpId = options?.rpId || RP_ID;
    this.origin = options?.origin || ORIGIN;
  }

  /**
   * Generate registration options for a new credential
   */
  async generateRegistrationOptions(params: {
    userId: string;
    userName: string;
    userDisplayName: string;
    excludeCredentials?: StoredCredential[];
  }): Promise<RegistrationOptions> {
    const {
      userId,
      userName,
      userDisplayName,
      excludeCredentials = [],
    } = params;

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userID: new Uint8Array(new TextEncoder().encode(userId)),
      userName,
      userDisplayName,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      excludeCredentials: excludeCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        ...(cred.transports && { transports: cred.transports }),
      })),
      timeout: 60000,
    });

    // Convert to our interface format
    return {
      challenge: options.challenge,
      rp: {
        name: options.rp.name,
        id: options.rp.id || this.rpId,
      },
      user: {
        id: options.user.id,
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout || 60000,
      authenticatorSelection: {
        authenticatorAttachment:
          options.authenticatorSelection?.authenticatorAttachment || 'platform',
        userVerification:
          options.authenticatorSelection?.userVerification || 'required',
        residentKey: options.authenticatorSelection?.residentKey || 'preferred',
      },
      attestation: options.attestation || 'none',
    };
  }

  /**
   * Verify registration response from the client
   */
  async verifyRegistrationResponse(params: {
    response: RegistrationResponseJSON;
    expectedChallenge: string;
  }): Promise<RegistrationVerificationResult> {
    const { response, expectedChallenge } = params;

    try {
      const verification: VerifiedRegistrationResponse =
        await verifyRegistrationResponse({
          response,
          expectedChallenge,
          expectedOrigin: this.origin,
          expectedRPID: this.rpId,
          requireUserVerification: true,
        });

      if (!verification.verified || !verification.registrationInfo) {
        return {
          verified: false,
          error: 'Registration verification failed',
        };
      }

      const { registrationInfo } = verification;

      return {
        verified: true,
        credential: {
          credentialId: registrationInfo.credential.id,
          credentialPublicKey: Buffer.from(
            registrationInfo.credential.publicKey
          ).toString('base64'),
          counter: registrationInfo.credential.counter,
          credentialType: registrationInfo.credentialType,
          ...(response.response.transports && {
            transports: response.response.transports,
          }),
        },
      };
    } catch (error) {
      console.error('Registration verification error:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Generate authentication options for existing credentials
   */
  async generateAuthenticationOptions(params: {
    allowCredentials: StoredCredential[];
  }): Promise<AuthenticationOptions> {
    const { allowCredentials } = params;

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials: allowCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        ...(cred.transports && { transports: cred.transports }),
      })),
      userVerification: 'required',
      timeout: 60000,
    });

    return {
      challenge: options.challenge,
      timeout: options.timeout || 60000,
      rpId: this.rpId,
      allowCredentials:
        options.allowCredentials?.map(cred => ({
          id: cred.id,
          type: 'public-key' as const,
          ...(cred.transports && { transports: cred.transports }),
        })) || [],
      userVerification: options.userVerification || 'required',
    };
  }

  /**
   * Verify authentication response from the client
   */
  async verifyAuthenticationResponse(params: {
    response: AuthenticationResponseJSON;
    expectedChallenge: string;
    credential: StoredCredential;
  }): Promise<AuthenticationVerificationResult> {
    const { response, expectedChallenge, credential } = params;

    try {
      // Decode the stored public key
      const credentialPublicKey = Buffer.from(
        credential.credentialPublicKey,
        'base64'
      );

      const verification: VerifiedAuthenticationResponse =
        await verifyAuthenticationResponse({
          response,
          expectedChallenge,
          expectedOrigin: this.origin,
          expectedRPID: this.rpId,
          credential: {
            id: credential.credentialId,
            publicKey: new Uint8Array(credentialPublicKey),
            counter: credential.counter,
            ...(credential.transports && { transports: credential.transports }),
          },
          requireUserVerification: true,
        });

      if (!verification.verified) {
        return {
          verified: false,
          error: 'Authentication verification failed',
        };
      }

      return {
        verified: true,
        newCounter: verification.authenticationInfo.newCounter,
        credentialId: credential.credentialId,
      };
    } catch (error) {
      console.error('Authentication verification error:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Get the RP ID for client-side configuration
   */
  getRpId(): string {
    return this.rpId;
  }

  /**
   * Get the origin for client-side configuration
   */
  getOrigin(): string {
    return this.origin;
  }
}

// Singleton instance for server-side usage
let webAuthnServiceInstance: WebAuthnService | null = null;

export function getWebAuthnService(): WebAuthnService {
  if (!webAuthnServiceInstance) {
    webAuthnServiceInstance = new WebAuthnService();
  }
  return webAuthnServiceInstance;
}

// Challenge store (in-memory for development, use Redis in production)
interface StoredChallenge {
  challenge: string;
  userId: string;
  action: 'register' | 'authenticate';
  expiresAt: Date;
}

const challengeStore = new Map<string, StoredChallenge>();

export function storeChallenge(params: {
  challengeId: string;
  challenge: string;
  userId: string;
  action: 'register' | 'authenticate';
  ttlMs?: number;
}): void {
  const {
    challengeId,
    challenge,
    userId,
    action,
    ttlMs = 5 * 60 * 1000,
  } = params;

  challengeStore.set(challengeId, {
    challenge,
    userId,
    action,
    expiresAt: new Date(Date.now() + ttlMs),
  });

  // Clean up expired challenges
  setTimeout(() => {
    challengeStore.delete(challengeId);
  }, ttlMs);
}

export function getChallenge(challengeId: string): StoredChallenge | null {
  const stored = challengeStore.get(challengeId);

  if (!stored) {
    return null;
  }

  if (stored.expiresAt < new Date()) {
    challengeStore.delete(challengeId);
    return null;
  }

  return stored;
}

export function deleteChallenge(challengeId: string): void {
  challengeStore.delete(challengeId);
}
