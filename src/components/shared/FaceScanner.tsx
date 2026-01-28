/**
 * FaceScanner Component
 * Camera component with real-time face detection for enrollment and verification
 *
 * SECURITY NOTES:
 * - This component ONLY handles detection and descriptor extraction
 * - ALL matching is done SERVER-SIDE - never trust client-side matching
 * - Descriptors are sent to the server for verification
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import type { FaceDetectionResult } from '@/types';

export interface FaceScannerError {
  code:
    | 'CAMERA_DENIED'
    | 'NO_FACE'
    | 'MULTIPLE_FACES'
    | 'MODEL_LOAD_FAILED'
    | 'LOW_QUALITY'
    | 'SERVER_VERIFY_FAILED';
  message: string;
}

export interface FaceScannerProps {
  /** Mode of operation */
  mode: 'enroll' | 'verify';
  /** Callback when a face is detected with sufficient quality */
  onFaceDetected: (result: FaceDetectionResult) => void;
  /** Callback on error */
  onError: (error: FaceScannerError) => void;
  /** Minimum quality score for callback (0-1, default 0.6) */
  minQualityScore?: number;
  /** Show debug information */
  showDebug?: boolean;
  /** Whether scanning is enabled */
  enabled?: boolean;
}

/**
 * FaceScanner - Camera component with real-time face detection
 *
 * @example
 * <FaceScanner
 *   mode="verify"
 *   onFaceDetected={(result) => {
 *     // Send to server for verification
 *     verifyFace(studentId, result.descriptor);
 *   }}
 *   onError={(err) => console.error(err)}
 * />
 */
export function FaceScanner({
  mode,
  onFaceDetected,
  onError,
  minQualityScore = 0.6,
  showDebug = false,
  enabled = true,
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [currentDetection, setCurrentDetection] =
    useState<FaceDetectionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  const {
    isLoading,
    isReady,
    error,
    loadProgress,
    loadModels,
    detectFace,
    assessQuality,
  } = useFaceRecognition({
    onError: err => {
      onError({
        code: 'MODEL_LOAD_FAILED',
        message: err.message,
      });
    },
  });

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setStatusMessage('Requesting camera access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setStatusMessage('Camera ready');
      }
    } catch (err) {
      console.error('[FaceScanner] Camera error:', err);
      onError({
        code: 'CAMERA_DENIED',
        message:
          err instanceof Error
            ? err.message
            : 'Camera access denied. Please allow camera access.',
      });
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isReady || !enabled) {
      return;
    }

    const now = Date.now();
    // Throttle detection to every 200ms for performance
    if (now - lastDetectionRef.current < 200) {
      animationRef.current = requestAnimationFrame(runDetection);
      return;
    }
    lastDetectionRef.current = now;

    try {
      const detection = await detectFace(videoRef.current);
      setCurrentDetection(detection);

      // Draw detection box
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          const { boundingBox, qualityScore } = detection;
          const quality = assessQuality(qualityScore, detection);

          // Draw face box
          ctx.strokeStyle =
            quality.level === 'excellent' || quality.level === 'good'
              ? '#22c55e'
              : quality.level === 'fair'
                ? '#eab308'
                : '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(
            boundingBox.x,
            boundingBox.y,
            boundingBox.width,
            boundingBox.height
          );

          // Update status
          setStatusMessage(quality.message);

          // Callback if quality is sufficient
          if (qualityScore >= minQualityScore) {
            onFaceDetected(detection);
          }
        } else {
          setStatusMessage('No face detected. Please face the camera.');
        }
      }
    } catch (err) {
      console.error('[FaceScanner] Detection error:', err);
    }

    // Continue loop
    animationRef.current = requestAnimationFrame(runDetection);
  }, [
    isReady,
    enabled,
    detectFace,
    assessQuality,
    minQualityScore,
    onFaceDetected,
  ]);

  // Initialize
  useEffect(() => {
    if (enabled) {
      loadModels();
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [enabled, loadModels, startCamera, stopCamera]);

  // Start detection when ready
  useEffect(() => {
    if (cameraReady && isReady && enabled) {
      runDetection();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraReady, isReady, enabled, runDetection]);

  // Quality assessment for current detection
  const quality = assessQuality(
    currentDetection?.qualityScore ?? 0,
    currentDetection
  );

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900/80 flex flex-col items-center justify-center z-20 rounded-xl"
          >
            <div className="text-white text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium">Loading face detection...</p>
              <p className="text-sm text-neutral-400 mt-1">
                {Math.round(loadProgress)}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={loadModels}
            className="mt-2 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className="relative aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Scan Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-full" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  quality.level === 'excellent'
                    ? 'bg-green-500'
                    : quality.level === 'good'
                      ? 'bg-green-400'
                      : quality.level === 'fair'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                } ${currentDetection ? 'animate-pulse' : ''}`}
              />
              <span className="text-white text-sm">{statusMessage}</span>
            </div>
            {currentDetection && (
              <span className="text-white/80 text-xs">
                {Math.round((currentDetection.qualityScore ?? 0) * 100)}%
                quality
              </span>
            )}
          </div>
        </div>

        {/* Mode Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              mode === 'enroll'
                ? 'bg-blue-500 text-white'
                : 'bg-purple-500 text-white'
            }`}
          >
            {mode === 'enroll' ? 'Enrollment' : 'Verification'}
          </span>
        </div>
      </div>

      {/* Quality Indicator */}
      <div className="mt-4 p-4 bg-neutral-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">
            Face Quality
          </span>
          <span
            className={`text-sm font-medium ${
              quality.level === 'excellent'
                ? 'text-green-600'
                : quality.level === 'good'
                  ? 'text-green-500'
                  : quality.level === 'fair'
                    ? 'text-yellow-600'
                    : 'text-red-600'
            }`}
          >
            {quality.level.charAt(0).toUpperCase() + quality.level.slice(1)}
          </span>
        </div>
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              quality.level === 'excellent'
                ? 'bg-green-500'
                : quality.level === 'good'
                  ? 'bg-green-400'
                  : quality.level === 'fair'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{
              width: `${(currentDetection?.qualityScore ?? 0) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2">{quality.message}</p>
      </div>

      {/* Debug Info */}
      {showDebug && currentDetection && (
        <div className="mt-4 p-4 bg-neutral-100 rounded-xl text-xs font-mono">
          <pre>
            {JSON.stringify(
              {
                boundingBox: currentDetection.boundingBox,
                qualityScore: currentDetection.qualityScore,
                descriptorLength: currentDetection.descriptor.length,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
