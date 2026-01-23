'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRScanner } from '@/components/shared/QRScanner';
import {
  UnifiedCheckInService,
  VerificationLevel,
  CheckInMethod,
  UnifiedCheckInResult,
} from '@/services/unified-checkin.service';
import { BiometricService } from '@/services/biometric.service';
import {
  GeolocationService,
  GeolocationCoordinates,
} from '@/services/geolocation.service';

interface UnifiedCheckInProps {
  teacherId: string;
  onCheckInComplete?: (result: UnifiedCheckInResult) => void;
  onCheckOutComplete?: (result: UnifiedCheckInResult) => void;
  defaultVerificationLevel?: VerificationLevel;
}

interface AvailableMethods {
  qr: boolean;
  biometric: boolean;
  geofence: boolean;
}

type CheckInStep =
  | 'idle'
  | 'qr_scan'
  | 'biometric'
  | 'geofence'
  | 'processing'
  | 'complete';

export function UnifiedCheckIn({
  teacherId,
  onCheckInComplete,
  onCheckOutComplete,
  defaultVerificationLevel = 'standard',
}: UnifiedCheckInProps) {
  // State
  const [checkInService] = useState(
    () => new UnifiedCheckInService(defaultVerificationLevel)
  );
  const [availableMethods, setAvailableMethods] =
    useState<AvailableMethods | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(
    defaultVerificationLevel
  );
  const [currentStep, setCurrentStep] = useState<CheckInStep>('idle');
  const [sessionType, setSessionType] = useState<'sign_in' | 'sign_out'>(
    'sign_in'
  );

  // Verification state
  const [qrData, setQRData] = useState<string | null>(null);
  const [qrVerified, setQRVerified] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [geofenceVerified, setGeofenceVerified] = useState(false);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

  // Session data (from QR code)
  const [studentId, setStudentId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedCheckInResult | null>(null);
  const [notes, setNotes] = useState('');

  // Check available methods on mount
  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoading(true);
      try {
        const methods = await UnifiedCheckInService.getAvailableMethods();
        setAvailableMethods(methods);

        // Set recommended level based on available methods
        const recommended = await UnifiedCheckInService.getRecommendedLevel();
        if (!defaultVerificationLevel) {
          setVerificationLevel(recommended);
          checkInService.setVerificationLevel(recommended);
        }
      } catch (error) {
        console.error('Error checking available methods:', error);
        setError('Failed to check device capabilities');
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [checkInService, defaultVerificationLevel]);

  // Handle QR scan
  const handleQRScan = useCallback(
    async (data: string) => {
      try {
        setQRData(data);

        // Parse QR data to extract student/parent info
        const parsed = JSON.parse(data);
        if (parsed.type === 'teacher_auth') {
          setStudentId(parsed.studentId);
          setParentId(parsed.parentId);
          setQRVerified(true);
          setError(null);

          // Move to next step based on verification level
          const config = checkInService.getConfig();
          if (config.requireGeofence) {
            setCurrentStep('geofence');
          } else if (config.requireBiometric) {
            setCurrentStep('biometric');
          } else {
            // QR only - proceed to processing
            await performCheckIn(data, null, null);
          }
        } else {
          throw new Error('Invalid QR code type');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid QR code');
        setCurrentStep('idle');
      }
    },
    [checkInService]
  );

  // Handle geofence verification
  const handleGeofenceVerification = useCallback(async () => {
    if (!studentId) {
      setError('Student information not available');
      return;
    }

    setCurrentStep('geofence');
    try {
      // Get current location
      const coords = await GeolocationService.getCurrentLocation();
      setLocation(coords);

      // Verify geofence
      const result = await GeolocationService.verifyGeofence(studentId);

      if (result.withinGeofence) {
        setGeofenceVerified(true);
        setError(null);

        // Move to next step
        const config = checkInService.getConfig();
        if (config.requireBiometric) {
          setCurrentStep('biometric');
        } else {
          await performCheckIn(qrData!, coords, null);
        }
      } else {
        const config = checkInService.getConfig();
        if (config.allowFallback) {
          setError(
            `Location verification failed (${GeolocationService.formatDistance(result.distance)} from home). Proceeding with fallback.`
          );
          setGeofenceVerified(false);

          if (config.requireBiometric) {
            setCurrentStep('biometric');
          } else {
            await performCheckIn(qrData!, coords, null);
          }
        } else {
          throw new Error(
            `You must be within ${GeolocationService.formatDistance(result.allowedRadius)} of the student's home`
          );
        }
      }
    } catch (err) {
      const config = checkInService.getConfig();
      if (config.allowFallback) {
        setError(
          `Location unavailable: ${err instanceof Error ? err.message : 'Unknown error'}. Proceeding without location.`
        );

        if (config.requireBiometric) {
          setCurrentStep('biometric');
        } else {
          await performCheckIn(qrData!, null, null);
        }
      } else {
        setError(
          err instanceof Error ? err.message : 'Location verification failed'
        );
        setCurrentStep('idle');
      }
    }
  }, [studentId, qrData, checkInService]);

  // Handle biometric verification
  const handleBiometricVerification = useCallback(async () => {
    setCurrentStep('biometric');
    try {
      const authResult = await BiometricService.authenticate(teacherId);
      const verified = await BiometricService.verify(teacherId, authResult);

      if (verified) {
        setBiometricVerified(true);
        setError(null);
        await performCheckIn(qrData!, location, authResult.credentialId);
      } else {
        throw new Error('Biometric verification failed');
      }
    } catch (err) {
      const config = checkInService.getConfig();
      if (config.allowFallback) {
        setError(
          `Biometric unavailable: ${err instanceof Error ? err.message : 'Unknown error'}. Proceeding without biometric.`
        );
        await performCheckIn(qrData!, location, null);
      } else {
        setError(
          err instanceof Error ? err.message : 'Biometric verification failed'
        );
        setCurrentStep('idle');
      }
    }
  }, [teacherId, qrData, location, checkInService]);

  // Perform the actual check-in
  const performCheckIn = async (
    qr: string,
    coords: GeolocationCoordinates | null,
    biometricCredentialId: string | null
  ) => {
    if (!studentId || !parentId) {
      setError('Missing student or parent information');
      return;
    }

    setCurrentStep('processing');
    try {
      const checkInResult = await checkInService.performCheckIn({
        teacherId,
        studentId,
        parentId,
        sessionType,
        qrData: qr,
        notes: notes || undefined,
      });

      setResult(checkInResult);
      setCurrentStep('complete');

      if (checkInResult.success) {
        if (sessionType === 'sign_in') {
          onCheckInComplete?.(checkInResult);
        } else {
          onCheckOutComplete?.(checkInResult);
        }
      } else {
        setError(checkInResult.errors.join('. ') || 'Check-in failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setCurrentStep('idle');
    }
  };

  // Reset state for new check-in
  const resetState = () => {
    setCurrentStep('idle');
    setQRData(null);
    setQRVerified(false);
    setBiometricVerified(false);
    setGeofenceVerified(false);
    setLocation(null);
    setStudentId(null);
    setParentId(null);
    setResult(null);
    setError(null);
    setNotes('');
  };

  // Start check-in process
  const startCheckIn = (type: 'sign_in' | 'sign_out') => {
    resetState();
    setSessionType(type);
    setCurrentStep('qr_scan');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          Checking device capabilities...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Level Selector */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            ['basic', 'standard', 'enhanced', 'maximum'] as VerificationLevel[]
          ).map(level => (
            <button
              key={level}
              onClick={() => {
                setVerificationLevel(level);
                checkInService.setVerificationLevel(level);
              }}
              disabled={currentStep !== 'idle'}
              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                verificationLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${currentStep !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-semibold capitalize">{level}</div>
              <div className="text-xs opacity-75">
                {UnifiedCheckInService.getVerificationLevelDescription(level)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Methods Indicator */}
      {availableMethods && (
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <span
            className={`flex items-center ${availableMethods.qr ? 'text-green-600' : 'text-gray-400'}`}
          >
            📱 QR {availableMethods.qr ? '✓' : '✗'}
          </span>
          <span
            className={`flex items-center ${availableMethods.biometric ? 'text-green-600' : 'text-gray-400'}`}
          >
            👆 Biometric {availableMethods.biometric ? '✓' : '✗'}
          </span>
          <span
            className={`flex items-center ${availableMethods.geofence ? 'text-green-600' : 'text-gray-400'}`}
          >
            📍 Location {availableMethods.geofence ? '✓' : '✗'}
          </span>
        </div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠️</span>
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Area */}
      {currentStep === 'idle' && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => startCheckIn('sign_in')}
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg"
          >
            <div className="text-4xl mb-2">📥</div>
            <div className="text-xl font-bold">Check In</div>
            <div className="text-sm opacity-75">Start a session</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => startCheckIn('sign_out')}
            className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg"
          >
            <div className="text-4xl mb-2">📤</div>
            <div className="text-xl font-bold">Check Out</div>
            <div className="text-sm opacity-75">End a session</div>
          </motion.button>
        </div>
      )}

      {/* QR Scanner Step */}
      {currentStep === 'qr_scan' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Step 1: Scan QR Code</h3>
            <button
              onClick={resetState}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Cancel
            </button>
          </div>
          <QRScanner onScan={handleQRScan} />
        </motion.div>
      )}

      {/* Geofence Step */}
      {currentStep === 'geofence' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 text-center"
        >
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-bold mb-2">Step 2: Verify Location</h3>
          <p className="text-gray-600 mb-6">
            We need to verify you're at the student's location
          </p>
          <div className="space-y-3">
            <button
              onClick={handleGeofenceVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Verify My Location
            </button>
            <button
              onClick={resetState}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Biometric Step */}
      {currentStep === 'biometric' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 text-center"
        >
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-xl font-bold mb-2">
            Step 3: Biometric Verification
          </h3>
          <p className="text-gray-600 mb-6">
            Use {BiometricService.getBiometricTypeDescription()} to verify your
            identity
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBiometricVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Authenticate with Biometric
            </button>
            <button
              onClick={resetState}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Processing Step */}
      {currentStep === 'processing' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-8 border border-gray-200 text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-xl font-bold mb-2">Processing...</h3>
          <p className="text-gray-600">Creating your session</p>
        </motion.div>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl p-6 border ${
            result.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{result.success ? '✅' : '❌'}</div>
            <h3 className="text-2xl font-bold mb-2">
              {result.success
                ? sessionType === 'sign_in'
                  ? 'Checked In Successfully!'
                  : 'Checked Out Successfully!'
                : 'Check-in Failed'}
            </h3>
          </div>

          {/* Verification Summary */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-700 mb-3">
              Verification Summary
            </h4>
            <div className="space-y-2">
              {result.verifications.map((v, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded ${
                    v.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">
                      {UnifiedCheckInService.getMethodIcon(v.method)}
                    </span>
                    <span className="capitalize">{v.method}</span>
                  </span>
                  <span
                    className={v.success ? 'text-green-600' : 'text-red-600'}
                  >
                    {v.success ? '✓ Verified' : '✗ Failed'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Verification Score:</span>
                <span className="font-semibold">
                  {Math.round(result.overallScore * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Level:</span>
                <span className="font-semibold capitalize">
                  {result.verificationLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Warnings</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i}>⚠️ {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i}>❌ {e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={resetState}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Done
          </button>
        </motion.div>
      )}

      {/* Verification Progress Indicator */}
      {currentStep !== 'idle' && currentStep !== 'complete' && (
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`w-3 h-3 rounded-full ${qrVerified ? 'bg-green-500' : 'bg-gray-300'}`}
          />
          <div
            className={`w-3 h-3 rounded-full ${geofenceVerified ? 'bg-green-500' : 'bg-gray-300'}`}
          />
          <div
            className={`w-3 h-3 rounded-full ${biometricVerified ? 'bg-green-500' : 'bg-gray-300'}`}
          />
        </div>
      )}
    </div>
  );
}

export default UnifiedCheckIn;
