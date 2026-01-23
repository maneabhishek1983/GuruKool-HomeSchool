'use client';

import { useState, useEffect } from 'react';
import { BiometricService } from '@/services/biometric.service';

interface BiometricRegistrationProps {
  teacherId: string;
  onSuccess?: () => void;
  onSkip?: () => void;
}

export default function BiometricRegistration({
  teacherId,
  onSuccess,
  onSkip,
}: BiometricRegistrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const [biometricType, setBiometricType] = useState('');

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    const supported = await BiometricService.isPlatformAuthenticatorAvailable();
    setBiometricSupported(supported);
    
    if (supported) {
      setBiometricType(BiometricService.getBiometricTypeDescription());
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await BiometricService.register(teacherId);
      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (biometricSupported === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!biometricSupported) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Biometric Not Available
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your device doesn't support biometric authentication. You can still use QR code scanning for check-in/out.
          </p>

          <button
            onClick={onSkip}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Continue with QR Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enable {biometricType}
        </h2>
        
        <p className="text-gray-600 mb-6">
          Use {biometricType} for faster and more secure check-in/out. Your biometric data never leaves your device.
        </p>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Benefits:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>5 seconds</strong> to check in (vs 10+ with QR code)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>More secure</strong> - Only you can check in</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>No QR code needed</strong> - Just tap and authenticate</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>Privacy protected</strong> - Biometric data stays on your device</span>
            </li>
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Setting up...
              </span>
            ) : (
              <>Enable {biometricType}</>
            )}
          </button>

          <button
            onClick={onSkip}
            disabled={isLoading}
            className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium"
          >
            Skip for now
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4">
          You can enable this later in your settings
        </p>
      </div>
    </div>
  );
}
