/**
 * Unified Check-In Service
 *
 * Combines multiple authentication methods for teacher check-in/out:
 * - QR Code Authentication
 * - Biometric Authentication (Face ID, Touch ID, Fingerprint)
 * - Geofence Verification (GPS location)
 *
 * Provides a unified flow that validates all available methods
 * and creates a comprehensive verification record.
 */

import { BiometricService, BiometricAuthResult } from './biometric.service';
import {
  GeolocationService,
  GeolocationCoordinates,
  GeofenceResult,
} from './geolocation.service';
import { TeacherQRService, TeacherSession } from './teacher-qr.service';

export type CheckInMethod = 'qr' | 'biometric' | 'geofence';
export type VerificationLevel = 'basic' | 'standard' | 'enhanced' | 'maximum';

export interface VerificationConfig {
  requireQR: boolean;
  requireBiometric: boolean;
  requireGeofence: boolean;
  geofenceRadius?: number; // in meters
  allowFallback: boolean;
}

export interface CheckInData {
  teacherId: string;
  studentId: string;
  parentId: string;
  sessionType: 'sign_in' | 'sign_out';
  qrData?: string | undefined;
  notes?: string | undefined;
}

export interface VerificationResult {
  method: CheckInMethod;
  success: boolean;
  timestamp: number;
  details?: any;
  error?: string | undefined;
}

export interface UnifiedCheckInResult {
  success: boolean;
  session?: TeacherSession | undefined;
  verifications: VerificationResult[];
  verificationLevel: VerificationLevel;
  overallScore: number;
  location?: GeolocationCoordinates | undefined;
  warnings: string[];
  errors: string[];
}

// Default verification configurations per level
const VERIFICATION_CONFIGS: Record<VerificationLevel, VerificationConfig> = {
  basic: {
    requireQR: true,
    requireBiometric: false,
    requireGeofence: false,
    allowFallback: true,
  },
  standard: {
    requireQR: true,
    requireBiometric: false,
    requireGeofence: true,
    geofenceRadius: 200, // 200m
    allowFallback: true,
  },
  enhanced: {
    requireQR: true,
    requireBiometric: true,
    requireGeofence: true,
    geofenceRadius: 100, // 100m
    allowFallback: true,
  },
  maximum: {
    requireQR: true,
    requireBiometric: true,
    requireGeofence: true,
    geofenceRadius: 50, // 50m
    allowFallback: false,
  },
};

export class UnifiedCheckInService {
  private config: VerificationConfig;
  private verificationLevel: VerificationLevel;

  constructor(level: VerificationLevel = 'standard') {
    this.verificationLevel = level;
    this.config = VERIFICATION_CONFIGS[level];
  }

  /**
   * Get available verification methods on this device
   */
  static async getAvailableMethods(): Promise<{
    qr: boolean;
    biometric: boolean;
    geofence: boolean;
  }> {
    const biometricSupported = BiometricService.isSupported();
    const biometricAvailable = biometricSupported
      ? await BiometricService.isPlatformAuthenticatorAvailable()
      : false;
    const geofenceSupported = GeolocationService.isSupported();

    return {
      qr: true, // QR is always available if device has camera
      biometric: biometricAvailable,
      geofence: geofenceSupported,
    };
  }

  /**
   * Get recommended verification level based on available methods
   */
  static async getRecommendedLevel(): Promise<VerificationLevel> {
    const available = await this.getAvailableMethods();

    if (available.biometric && available.geofence) {
      return 'enhanced';
    }
    if (available.geofence) {
      return 'standard';
    }
    return 'basic';
  }

  /**
   * Perform unified check-in with all available/required verification methods
   */
  async performCheckIn(data: CheckInData): Promise<UnifiedCheckInResult> {
    const result: UnifiedCheckInResult = {
      success: false,
      verifications: [],
      verificationLevel: this.verificationLevel,
      overallScore: 0,
      warnings: [],
      errors: [],
    };

    try {
      // 1. QR Code Verification
      if (this.config.requireQR && data.qrData) {
        const qrResult = await this.verifyQRCode(data);
        result.verifications.push(qrResult);

        if (!qrResult.success && !this.config.allowFallback) {
          result.errors.push(
            'QR verification failed and fallback is not allowed'
          );
          return result;
        }
      } else if (this.config.requireQR && !data.qrData) {
        result.verifications.push({
          method: 'qr',
          success: false,
          timestamp: Date.now(),
          error: 'QR code data not provided',
        });

        if (!this.config.allowFallback) {
          result.errors.push('QR code required but not provided');
          return result;
        }
      }

      // 2. Geofence Verification
      if (this.config.requireGeofence) {
        const geofenceResult = await this.verifyGeofence(data.studentId);
        result.verifications.push(geofenceResult);

        if (geofenceResult.success && geofenceResult.details?.coordinates) {
          result.location = geofenceResult.details.coordinates;
        }

        if (!geofenceResult.success && !this.config.allowFallback) {
          result.errors.push('Geofence verification failed');
          return result;
        }

        if (!geofenceResult.success && this.config.allowFallback) {
          result.warnings.push(
            'Location verification failed - proceeding with fallback'
          );
        }
      }

      // 3. Biometric Verification
      if (this.config.requireBiometric) {
        const biometricResult = await this.verifyBiometric(data.teacherId);
        result.verifications.push(biometricResult);

        if (!biometricResult.success && !this.config.allowFallback) {
          result.errors.push('Biometric verification failed');
          return result;
        }

        if (!biometricResult.success && this.config.allowFallback) {
          result.warnings.push(
            'Biometric verification skipped - device not supported or user cancelled'
          );
        }
      }

      // Calculate overall score
      result.overallScore = this.calculateOverallScore(result.verifications);

      // Determine if check-in is successful
      const successfulVerifications = result.verifications.filter(
        v => v.success
      );
      const requiredMethods = this.getRequiredMethods();
      const minimumRequired = this.config.allowFallback
        ? 1
        : requiredMethods.length;

      if (successfulVerifications.length >= minimumRequired) {
        // Create the session
        try {
          const session = await this.createSession(data, result);
          result.session = session || undefined;
          result.success = !!session;

          if (!session) {
            result.errors.push('Failed to create session record');
          }
        } catch (sessionError) {
          result.errors.push(
            `Session creation failed: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`
          );
        }
      } else {
        result.errors.push(
          `Insufficient verifications: ${successfulVerifications.length}/${minimumRequired} required`
        );
      }

      return result;
    } catch (error) {
      result.errors.push(
        `Check-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }
  }

  /**
   * Verify QR code
   */
  private async verifyQRCode(data: CheckInData): Promise<VerificationResult> {
    try {
      if (!data.qrData) {
        return {
          method: 'qr',
          success: false,
          timestamp: Date.now(),
          error: 'No QR data provided',
        };
      }

      // Parse and validate QR data
      const parsedData = JSON.parse(data.qrData);

      // Validate structure
      if (parsedData.type !== 'teacher_auth') {
        return {
          method: 'qr',
          success: false,
          timestamp: Date.now(),
          error: 'Invalid QR code type',
        };
      }

      // Check expiration
      if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
        return {
          method: 'qr',
          success: false,
          timestamp: Date.now(),
          error: 'QR code has expired',
        };
      }

      // Verify teacher, student, parent match
      if (
        parsedData.teacherId !== data.teacherId ||
        parsedData.studentId !== data.studentId ||
        parsedData.parentId !== data.parentId
      ) {
        return {
          method: 'qr',
          success: false,
          timestamp: Date.now(),
          error: 'QR code does not match teacher/student/parent',
        };
      }

      // Verify signature with server
      const validationResponse = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: data.qrData }),
      });

      if (!validationResponse.ok) {
        const error = await validationResponse.json();
        return {
          method: 'qr',
          success: false,
          timestamp: Date.now(),
          error: error.error || 'QR validation failed',
        };
      }

      return {
        method: 'qr',
        success: true,
        timestamp: Date.now(),
        details: {
          teacherId: parsedData.teacherId,
          studentId: parsedData.studentId,
          expiresAt: parsedData.expiresAt,
        },
      };
    } catch (error) {
      return {
        method: 'qr',
        success: false,
        timestamp: Date.now(),
        error:
          error instanceof Error ? error.message : 'QR verification failed',
      };
    }
  }

  /**
   * Verify geofence
   */
  private async verifyGeofence(studentId: string): Promise<VerificationResult> {
    try {
      if (!GeolocationService.isSupported()) {
        return {
          method: 'geofence',
          success: false,
          timestamp: Date.now(),
          error: 'Geolocation not supported on this device',
        };
      }

      // Get current location
      const coordinates = await GeolocationService.getCurrentLocation();

      // Check accuracy
      if (!GeolocationService.isAccuracyAcceptable(coordinates.accuracy)) {
        return {
          method: 'geofence',
          success: false,
          timestamp: Date.now(),
          details: { coordinates, accuracy: coordinates.accuracy },
          error: `GPS accuracy too low: ${Math.round(coordinates.accuracy)}m (max ${GeolocationService['MAX_ACCEPTABLE_ACCURACY']}m)`,
        };
      }

      // Verify against student's home location
      const geofenceResult = await GeolocationService.verifyGeofence(studentId);

      return {
        method: 'geofence',
        success: geofenceResult.withinGeofence,
        timestamp: Date.now(),
        details: {
          coordinates,
          distance: geofenceResult.distance,
          allowedRadius: geofenceResult.allowedRadius,
          accuracy: geofenceResult.accuracy,
        },
        error: geofenceResult.withinGeofence
          ? undefined
          : `Outside geofence: ${GeolocationService.formatDistance(geofenceResult.distance)} from home (allowed: ${GeolocationService.formatDistance(geofenceResult.allowedRadius)})`,
      };
    } catch (error) {
      return {
        method: 'geofence',
        success: false,
        timestamp: Date.now(),
        error:
          error instanceof Error
            ? error.message
            : 'Geofence verification failed',
      };
    }
  }

  /**
   * Verify biometric
   */
  private async verifyBiometric(
    teacherId: string
  ): Promise<VerificationResult> {
    try {
      if (!BiometricService.isSupported()) {
        return {
          method: 'biometric',
          success: false,
          timestamp: Date.now(),
          error: 'Biometric authentication not supported on this device',
        };
      }

      const available =
        await BiometricService.isPlatformAuthenticatorAvailable();
      if (!available) {
        return {
          method: 'biometric',
          success: false,
          timestamp: Date.now(),
          error: 'Platform authenticator not available',
        };
      }

      // Authenticate with biometric
      const authResult = await BiometricService.authenticate(teacherId);

      // Verify with server
      const verified = await BiometricService.verify(teacherId, authResult);

      return {
        method: 'biometric',
        success: verified,
        timestamp: Date.now(),
        details: {
          credentialId: authResult.credentialId,
          deviceType: BiometricService['getDeviceType'](),
        },
        error: verified ? undefined : 'Biometric verification failed',
      };
    } catch (error) {
      return {
        method: 'biometric',
        success: false,
        timestamp: Date.now(),
        error:
          error instanceof Error
            ? error.message
            : 'Biometric verification failed',
      };
    }
  }

  /**
   * Create session after successful verification
   */
  private async createSession(
    data: CheckInData,
    verificationResult: UnifiedCheckInResult
  ): Promise<TeacherSession | null> {
    try {
      // Prepare session data
      const sessionData = {
        teacherId: data.teacherId,
        studentId: data.studentId,
        parentId: data.parentId,
        sessionType: data.sessionType,
        notes: data.notes,
        verificationMethods: verificationResult.verifications
          .filter(v => v.success)
          .map(v => v.method),
        verificationScore: verificationResult.overallScore,
        verificationLevel: this.verificationLevel,
        location: verificationResult.location,
      };

      // Call unified check-in API
      const response = await fetch('/api/teacher-sessions/unified-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const { session } = await response.json();
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }

  /**
   * Calculate overall verification score
   */
  private calculateOverallScore(verifications: VerificationResult[]): number {
    if (verifications.length === 0) {
      return 0;
    }

    // Weights for each method
    const weights: Record<CheckInMethod, number> = {
      qr: 0.4, // 40% weight
      biometric: 0.35, // 35% weight
      geofence: 0.25, // 25% weight
    };

    let totalWeight = 0;
    let weightedScore = 0;

    for (const verification of verifications) {
      const weight = weights[verification.method];
      totalWeight += weight;
      weightedScore += verification.success ? weight : 0;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  /**
   * Get list of required verification methods
   */
  private getRequiredMethods(): CheckInMethod[] {
    const methods: CheckInMethod[] = [];
    if (this.config.requireQR) {
      methods.push('qr');
    }
    if (this.config.requireBiometric) {
      methods.push('biometric');
    }
    if (this.config.requireGeofence) {
      methods.push('geofence');
    }
    return methods;
  }

  /**
   * Get human-readable verification level description
   */
  static getVerificationLevelDescription(level: VerificationLevel): string {
    switch (level) {
      case 'basic':
        return 'Basic (QR Code only)';
      case 'standard':
        return 'Standard (QR Code + Location)';
      case 'enhanced':
        return 'Enhanced (QR Code + Location + Biometric)';
      case 'maximum':
        return 'Maximum Security (All methods required)';
    }
  }

  /**
   * Get icons for each verification method
   */
  static getMethodIcon(method: CheckInMethod): string {
    switch (method) {
      case 'qr':
        return '📱';
      case 'biometric':
        return '👆';
      case 'geofence':
        return '📍';
    }
  }

  /**
   * Get configuration for current level
   */
  getConfig(): VerificationConfig {
    return { ...this.config };
  }

  /**
   * Update verification level
   */
  setVerificationLevel(level: VerificationLevel): void {
    this.verificationLevel = level;
    this.config = VERIFICATION_CONFIGS[level];
  }
}

// Export singleton instance with standard level
export const unifiedCheckIn = new UnifiedCheckInService('standard');
