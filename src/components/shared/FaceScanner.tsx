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
import { BlinkDetector, dualEyeEAR, type Point2D } from '@/lib/face-liveness';

/**
 * Liveness defaults to ON in 'verify' mode, OFF in 'enroll' mode.
 * Emergency disable via NEXT_PUBLIC_FACE_LIVENESS_REQUIRED=false.
 */
const LIVENESS_DISABLED_VIA_ENV =
  process.env.NEXT_PUBLIC_FACE_LIVENESS_REQUIRED === 'false';

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
  /**
   * Whether to require a detected blink before firing onFaceDetected.
   * Defaults: true in verify mode, false in enroll mode. Can be force-disabled
   * globally via NEXT_PUBLIC_FACE_LIVENESS_REQUIRED=false.
   */
  requireLiveness?: boolean;
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
  requireLiveness,
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);
  const cameraStartingRef = useRef(false);
  const canvasDimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const blinkDetectorRef = useRef<BlinkDetector>(new BlinkDetector());

  // Resolve liveness requirement: explicit prop > mode default. Env can force-off.
  const livenessRequired =
    !LIVENESS_DISABLED_VIA_ENV && (requireLiveness ?? mode === 'verify');

  const [cameraReady, setCameraReady] = useState(false);
  const [currentDetection, setCurrentDetection] =
    useState<FaceDetectionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [livenessSatisfied, setLivenessSatisfied] = useState(!livenessRequired);

  // Memoize error handler to prevent infinite re-render loop.
  // Without this, a new function reference is created every render,
  // causing loadModels in useFaceRecognition to be recreated,
  // which triggers the initialization useEffect to re-fire continuously.
  const handleModelError = useCallback(
    (err: Error) => {
      onError({
        code: 'MODEL_LOAD_FAILED',
        message: err.message,
      });
    },
    [onError]
  );

  const {
    isLoading,
    isReady,
    error,
    loadProgress,
    loadModels,
    detectFace,
    assessQuality,
  } = useFaceRecognition({
    onError: handleModelError,
  });

  // Start camera (with re-entrancy guard to prevent concurrent getUserMedia calls)
  const startCamera = useCallback(async () => {
    if (cameraStartingRef.current) {
      return;
    }
    cameraStartingRef.current = true;
    try {
      setStatusMessage('Requesting camera access...');

      // Check for secure context (HTTPS) - required on mobile browsers
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError({
          code: 'CAMERA_DENIED',
          message:
            window.isSecureContext === false
              ? 'Camera requires a secure connection (HTTPS). Please access this page over HTTPS.'
              : 'Camera API not available on this browser. Please use a modern browser like Chrome, Safari, or Firefox.',
        });
        return;
      }

      // Use flexible constraints that work across mobile devices
      // Avoid fixed dimensions that some mobile cameras can't satisfy
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        // Set webkit-playsinline for older iOS Safari (enables inline video)
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.srcObject = stream;

        // Wait for video metadata to load before playing
        // Mobile browsers need this - they won't play until stream is ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          const timeoutId = setTimeout(() => {
            reject(new Error('Camera stream timed out. Please try again.'));
          }, 10000);

          video.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            resolve();
          };

          // If already loaded (e.g., desktop), resolve immediately
          if (video.readyState >= 1) {
            clearTimeout(timeoutId);
            resolve();
          }
        });

        await videoRef.current.play();
        setCameraReady(true);
        setStatusMessage('Camera ready');
      }
    } catch (err) {
      console.error('[FaceScanner] Camera error:', err);

      const errorMessage = err instanceof Error ? err.message : String(err);
      let userMessage = 'Camera access denied. Please allow camera access.';

      if (
        errorMessage.includes('NotAllowedError') ||
        errorMessage.includes('Permission')
      ) {
        userMessage =
          'Camera permission denied. Please allow camera access in your browser settings and reload the page.';
      } else if (errorMessage.includes('NotFoundError')) {
        userMessage = 'No camera found on this device.';
      } else if (
        errorMessage.includes('NotReadableError') ||
        errorMessage.includes('TrackStartError')
      ) {
        userMessage =
          'Camera is in use by another app. Please close other apps using the camera and try again.';
      } else if (errorMessage.includes('OverconstrainedError')) {
        userMessage =
          'Camera does not support the required settings. Please try a different device.';
      } else if (errorMessage.includes('timed out')) {
        userMessage = errorMessage;
      }

      onError({
        code: 'CAMERA_DENIED',
        message: userMessage,
      });
    } finally {
      cameraStartingRef.current = false;
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
        // Only reassign canvas dimensions when they change.
        // On iOS WebKit, each reassignment tears down and recreates the
        // 2D context, causing a memory leak when done every 200ms.
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        if (canvasDimsRef.current.w !== vw || canvasDimsRef.current.h !== vh) {
          canvas.width = vw;
          canvas.height = vh;
          canvasDimsRef.current = { w: vw, h: vh };
        }
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

          // Liveness: feed eye landmarks to the blink detector.
          if (livenessRequired && detection.landmarks) {
            const positions = (detection.landmarks as { positions?: Point2D[] })
              .positions;
            const ear = positions ? dualEyeEAR(positions) : null;
            if (blinkDetectorRef.current.push(ear)) {
              setLivenessSatisfied(true);
            }
          }

          // Update status — liveness instructions take priority over quality hints.
          if (livenessRequired && !livenessSatisfied) {
            setStatusMessage('Blink slowly to confirm liveness');
          } else {
            setStatusMessage(quality.message);
          }

          // Callback only when quality is sufficient AND liveness was satisfied.
          if (
            qualityScore >= minQualityScore &&
            (livenessSatisfied || !livenessRequired)
          ) {
            onFaceDetected(detection);
          }
        } else {
          setStatusMessage('No face detected. Please face the camera.');
          // Lost face → reset blink state so we don't accept stale blinks.
          if (livenessRequired) {
            blinkDetectorRef.current.push(null);
          }
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
    livenessRequired,
    livenessSatisfied,
  ]);

  // Initialize: load models first, then start camera.
  // Uses cancellation flag to prevent starting camera if component
  // unmounted or effect was cleaned up during model loading.
  useEffect(() => {
    let cancelled = false;

    if (enabled) {
      const init = async () => {
        await loadModels();
        if (!cancelled) {
          await startCamera();
        }
      };
      init().catch(err => {
        if (!cancelled) {
          console.error('[FaceScanner] Initialization failed:', err);
        }
      });
    }

    return () => {
      cancelled = true;
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

  // Handle page visibility changes (iOS PWA background/foreground).
  // iOS Safari kills the MediaStream when the PWA is backgrounded.
  // When the user returns, we detect the dead stream and restart the camera.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Pause detection loop when backgrounded (saves battery)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } else if (document.visibilityState === 'visible' && enabled) {
        // Check if stream tracks are still alive (iOS kills them on background)
        const stream = streamRef.current;
        const tracksAlive = stream
          ?.getTracks()
          .some(t => t.readyState === 'live');

        if (!tracksAlive && cameraReady) {
          // Stream died while backgrounded — restart camera
          stopCamera();
          startCamera();
        } else if (isReady && cameraReady) {
          // Stream still alive — resume detection loop
          runDetection();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, cameraReady, isReady, stopCamera, startCamera, runDetection]);

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
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
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
