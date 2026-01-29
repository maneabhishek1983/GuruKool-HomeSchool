'use client';

import { useState, useEffect } from 'react';

export interface FaceRecognitionAvailability {
  /** Whether the feature flag is enabled */
  featureEnabled: boolean;
  /** Whether we are in a secure context (HTTPS or localhost) */
  isSecureContext: boolean;
  /** Whether the browser exposes getUserMedia */
  hasCameraAPI: boolean;
  /** Whether all prerequisites are met */
  canUseFaceRecognition: boolean;
  /** Whether the user is on a mobile device */
  isMobileDevice: boolean;
  /** Human-readable reason if unavailable */
  unavailableReason: string | null;
}

const FEATURE_FLAG =
  process.env.NEXT_PUBLIC_ENABLE_FACE_RECOGNITION !== 'false';

/**
 * Hook to check whether face recognition is available on the current device/browser.
 * SSR-safe: returns conservative defaults during server rendering,
 * then updates on mount with actual browser capabilities.
 */
export function useFaceRecognitionAvailability(): FaceRecognitionAvailability {
  const [availability, setAvailability] = useState<FaceRecognitionAvailability>(
    {
      featureEnabled: FEATURE_FLAG,
      isSecureContext: false,
      hasCameraAPI: false,
      canUseFaceRecognition: false,
      isMobileDevice: false,
      unavailableReason: null,
    }
  );

  useEffect(() => {
    const secureContext =
      typeof window !== 'undefined' && window.isSecureContext;

    const cameraAPI =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    const mobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    const canUse = FEATURE_FLAG && secureContext && cameraAPI;

    let reason: string | null = null;
    if (!FEATURE_FLAG) {
      reason = 'Face recognition is not enabled.';
    } else if (!secureContext) {
      reason =
        'Face recognition requires HTTPS. Please use a secure connection.';
    } else if (!cameraAPI) {
      reason = 'This browser does not support camera access.';
    }

    setAvailability({
      featureEnabled: FEATURE_FLAG,
      isSecureContext: secureContext,
      hasCameraAPI: cameraAPI,
      canUseFaceRecognition: canUse,
      isMobileDevice: mobile,
      unavailableReason: reason,
    });
  }, []);

  return availability;
}
