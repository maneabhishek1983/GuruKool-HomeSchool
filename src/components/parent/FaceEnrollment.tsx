/**
 * FaceEnrollment Component
 * Multi-step wizard for enrolling a student's face for recognition
 *
 * Steps:
 * 1. Consent & Privacy Information
 * 2. Camera Capture with Quality Feedback
 * 3. Review & Confirm
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceScanner } from '@/components/shared/FaceScanner';
import type { FaceDetectionResult } from '@/types';

interface FaceEnrollmentProps {
  studentId: string;
  studentName: string;
  onSuccess: () => void;
  onCancel: () => void;
  onSkip?: () => void;
}

type Step = 'consent' | 'capture' | 'confirm' | 'saving' | 'success' | 'error';

/**
 * FaceEnrollment - Multi-step wizard for face enrollment
 */
export function FaceEnrollment({
  studentId,
  studentName,
  onSuccess,
  onCancel,
  onSkip,
}: FaceEnrollmentProps) {
  const [step, setStep] = useState<Step>('consent');
  const [capturedFace, setCapturedFace] = useState<FaceDetectionResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);

  // Handle face detection
  const handleFaceDetected = useCallback(
    (result: FaceDetectionResult) => {
      // Only capture if quality is sufficient and we haven't captured yet
      if (result.qualityScore >= 0.7 && isCapturing) {
        setIsCapturing(false);
        setCapturedFace(result);
        setStep('confirm');
      }
    },
    [isCapturing]
  );

  // Handle capture error
  const handleCaptureError = useCallback(
    (err: { code: string; message: string }) => {
      setError(err.message);
    },
    []
  );

  // Retry capture
  const handleRetry = useCallback(() => {
    setCapturedFace(null);
    setIsCapturing(true);
    setError(null);
    setStep('capture');
  }, []);

  // Save enrollment
  const handleConfirm = async () => {
    if (!capturedFace) {
      return;
    }

    setStep('saving');
    setError(null);

    try {
      const response = await fetch('/api/student/face-enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          descriptor: capturedFace.descriptor,
          qualityScore: capturedFace.qualityScore,
          metadata: {
            device: navigator.userAgent,
            browser: getBrowserName(),
            lighting: getLightingQuality(capturedFace.qualityScore),
            angle: 'frontal',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to enroll face');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save face enrollment'
      );
      setStep('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {/* Step 1: Consent */}
        {step === 'consent' && (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">&#128100;</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Face Recognition Setup
              </h2>
              <p className="text-neutral-600">
                Set up face recognition for{' '}
                <span className="font-semibold">{studentName}</span>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-3">
                Privacy & Data Information
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">&#128274;</span>
                  Face data is encrypted using AES-256-GCM encryption
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&#128187;</span>
                  All matching happens on our secure servers
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&#128465;</span>
                  You can delete face data at any time from settings
                </li>
                <li className="flex items-start">
                  <span className="mr-2">&#128101;</span>
                  Only assigned teachers can verify using face recognition
                </li>
              </ul>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <h4 className="font-medium text-neutral-900 mb-2">
                What happens during enrollment:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-600">
                <li>We'll access your camera to capture a face image</li>
                <li>
                  A unique face descriptor is extracted (not the actual image)
                </li>
                <li>The descriptor is encrypted and stored securely</li>
                <li>Teachers can then use face scan for check-in/check-out</li>
              </ol>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setStep('capture')}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
              >
                I Agree - Start Enrollment
              </button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
                >
                  Skip for Now
                </button>
              )}
              <button
                onClick={onCancel}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Capture */}
        {step === 'capture' && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Position Face in Frame
              </h2>
              <p className="text-neutral-600 text-sm">
                Look directly at the camera with good lighting. Hold still when
                quality is good.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <FaceScanner
              mode="enroll"
              onFaceDetected={handleFaceDetected}
              onError={handleCaptureError}
              minQualityScore={0.7}
              enabled={isCapturing}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-medium text-amber-900 mb-2">
                Tips for best results:
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>&#8226; Face the camera directly</li>
                <li>&#8226; Ensure good, even lighting</li>
                <li>&#8226; Remove glasses if possible</li>
                <li>&#8226; Keep a neutral expression</li>
              </ul>
            </div>

            <button
              onClick={onCancel}
              className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && capturedFace && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">&#10004;</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Face Captured Successfully
              </h2>
              <p className="text-neutral-600 text-sm">
                Quality Score:{' '}
                <span className="font-semibold text-green-600">
                  {Math.round(capturedFace.qualityScore * 100)}%
                </span>
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-medium text-green-900 mb-2">Ready to Save</h4>
              <p className="text-sm text-green-800">
                The face descriptor has been captured with{' '}
                {capturedFace.qualityScore >= 0.85
                  ? 'excellent'
                  : capturedFace.qualityScore >= 0.7
                    ? 'good'
                    : 'acceptable'}{' '}
                quality. Click "Save Enrollment" to complete the process.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                Save Enrollment
              </button>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Retake Photo
              </button>
            </div>
          </motion.div>
        )}

        {/* Saving State */}
        {step === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Saving Enrollment...
            </h2>
            <p className="text-neutral-600">
              Encrypting and storing face data securely
            </p>
          </motion.div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <span className="text-5xl">&#10004;</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Enrollment Complete!
            </h2>
            <p className="text-neutral-600">
              {studentName} can now be verified using face recognition.
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">&#10006;</span>
              </div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Enrollment Failed
              </h2>
              <p className="text-red-600">{error}</p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper functions
function getBrowserName(): string {
  const agent = navigator.userAgent;
  if (agent.includes('Chrome')) {
    return 'Chrome';
  }
  if (agent.includes('Safari')) {
    return 'Safari';
  }
  if (agent.includes('Firefox')) {
    return 'Firefox';
  }
  if (agent.includes('Edge')) {
    return 'Edge';
  }
  return 'Unknown';
}

function getLightingQuality(
  qualityScore: number
): 'poor' | 'fair' | 'good' | 'excellent' {
  if (qualityScore >= 0.85) {
    return 'excellent';
  }
  if (qualityScore >= 0.7) {
    return 'good';
  }
  if (qualityScore >= 0.5) {
    return 'fair';
  }
  return 'poor';
}
