'use client';

import { useState, useEffect } from 'react';
import { BiometricService } from '@/services/biometric.service';
import { GeolocationService } from '@/services/geolocation.service';

interface BiometricCheckInProps {
  teacherId: string;
  studentId: string;
  studentName: string;
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

export default function BiometricCheckIn({
  teacherId,
  studentId,
  studentName,
  onSuccess,
  onError,
}: BiometricCheckInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'verified' | 'failed' | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<'checking' | 'verified' | 'failed' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationInfo, setLocationInfo] = useState<{
    distance: number;
    allowedRadius: number;
    withinGeofence: boolean;
  } | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = await BiometricService.isPlatformAuthenticatorAvailable();
    setBiometricSupported(supported);
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    setError(null);
    setLocationStatus('checking');
    setBiometricStatus(null);

    try {
      // Step 1: Verify location
      const locationResult = await GeolocationService.verifyGeofence(studentId);
      
      setLocationInfo({
        distance: locationResult.distance,
        allowedRadius: locationResult.allowedRadius,
        withinGeofence: locationResult.withinGeofence,
      });

      if (!locationResult.withinGeofence) {
        setLocationStatus('failed');
        const errorMsg = `You are ${GeolocationService.formatDistance(
          locationResult.distance - locationResult.allowedRadius
        )} too far from ${studentName}'s home`;
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
        return;
      }

      setLocationStatus('verified');

      // Step 2: Biometric authentication
      setBiometricStatus('checking');
      
      const authResult = await BiometricService.authenticate(teacherId);
      
      if (!authResult.success) {
        setBiometricStatus('failed');
        const errorMsg = 'Biometric authentication failed';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
        return;
      }

      setBiometricStatus('verified');

      // Step 3: Get current location coordinates
      const currentLocation = await GeolocationService.getCurrentLocation();

      // Step 4: Check in with biometric + location
      const response = await fetch('/api/teacher-sessions/check-in-biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          credentialId: authResult.credentialId,
          signature: authResult.signature,
          authenticatorData: authResult.authenticatorData,
          clientDataJSON: authResult.clientDataJSON,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Check-in failed');
      }

      const result = await response.json();
      onSuccess?.(result.sessionId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Check-in failed';
      setError(errorMsg);
      onError?.(errorMsg);
      
      if (locationStatus === 'checking') {
        setLocationStatus('failed');
      }
      if (biometricStatus === 'checking') {
        setBiometricStatus('failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestException = () => {
    // Navigate to exception request form
    window.location.href = `/teacher/exception/request?studentId=${studentId}`;
  };

  if (!biometricSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Biometric Authentication Not Available
        </h3>
        <p className="text-sm text-yellow-700 mb-4">
          Your device doesn't support biometric authentication (Face ID, Touch ID, or Fingerprint).
          Please use the QR code scanner instead.
        </p>
        <button
          onClick={() => window.location.href = '/teacher/dashboard'}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Use QR Code Scanner
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Status */}
      <div className={`border rounded-lg p-4 ${
        locationStatus === 'verified' ? 'bg-green-50 border-green-200' :
        locationStatus === 'failed' ? 'bg-red-50 border-red-200' :
        locationStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          {locationStatus === 'checking' && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          )}
          {locationStatus === 'verified' && (
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {locationStatus === 'failed' && (
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <h3 className="font-semibold">
            {locationStatus === 'checking' && 'Verifying Location...'}
            {locationStatus === 'verified' && 'Location Verified'}
            {locationStatus === 'failed' && 'Location Verification Failed'}
            {!locationStatus && 'Location Verification Required'}
          </h3>
        </div>
        
        {locationInfo && (
          <p className="text-sm mt-2">
            {locationInfo.withinGeofence ? (
              <>You are within the allowed area ({GeolocationService.formatDistance(locationInfo.distance)} from home)</>
            ) : (
              <>You are {GeolocationService.formatDistance(locationInfo.distance - locationInfo.allowedRadius)} too far from {studentName}'s home</>
            )}
          </p>
        )}
      </div>

      {/* Biometric Status */}
      {locationStatus === 'verified' && (
        <div className={`border rounded-lg p-4 ${
          biometricStatus === 'verified' ? 'bg-green-50 border-green-200' :
          biometricStatus === 'failed' ? 'bg-red-50 border-red-200' :
          biometricStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            {biometricStatus === 'checking' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            {biometricStatus === 'verified' && (
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {biometricStatus === 'failed' && (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <h3 className="font-semibold">
              {biometricStatus === 'checking' && `Verifying ${BiometricService.getBiometricTypeDescription()}...`}
              {biometricStatus === 'verified' && 'Biometric Verified'}
              {biometricStatus === 'failed' && 'Biometric Verification Failed'}
              {!biometricStatus && 'Biometric Verification Required'}
            </h3>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Check-In Button */}
      <div className="flex gap-2">
        <button
          onClick={handleCheckIn}
          disabled={isLoading}
          className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Checking In...
            </span>
          ) : (
            <>👆 Check In with {BiometricService.getBiometricTypeDescription()}</>
          )}
        </button>

        {locationStatus === 'failed' && (
          <button
            onClick={handleRequestException}
            className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
          >
            Request Exception
          </button>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 text-center">
        Your location and biometric authentication will be verified for security
      </div>
    </div>
  );
}
