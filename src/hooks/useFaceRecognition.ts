/**
 * Face Recognition Hook
 * React hook for managing face recognition state and model loading
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FaceRecognitionService } from '@/services/face-recognition.service';
import type { FaceDetectionResult } from '@/types';

export interface UseFaceRecognitionOptions {
  /** Auto-load models on mount */
  autoLoad?: boolean;
  /** Callback when models finish loading */
  onModelsLoaded?: () => void;
  /** Callback on loading error */
  onError?: (error: Error) => void;
}

export interface UseFaceRecognitionReturn {
  /** Whether models are currently loading */
  isLoading: boolean;
  /** Whether models are loaded and ready */
  isReady: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Loading progress (0-100) */
  loadProgress: number;
  /** Load models manually */
  loadModels: () => Promise<void>;
  /** Detect face in video element */
  detectFace: (video: HTMLVideoElement) => Promise<FaceDetectionResult | null>;
  /** Get quality assessment */
  assessQuality: (
    score: number,
    detection: FaceDetectionResult | null
  ) => {
    level: 'poor' | 'fair' | 'good' | 'excellent';
    message: string;
    canEnroll: boolean;
  };
}

/**
 * Hook for face recognition functionality
 *
 * @param options - Configuration options
 * @returns Face recognition state and methods
 *
 * @example
 * const { isReady, loadModels, detectFace } = useFaceRecognition({ autoLoad: true });
 *
 * // When ready, detect face
 * if (isReady) {
 *   const result = await detectFace(videoRef.current);
 *   if (result) {
 *     // Send descriptor to server for verification
 *     await verifyFace(studentId, result.descriptor);
 *   }
 * }
 */
export function useFaceRecognition(
  options: UseFaceRecognitionOptions = {}
): UseFaceRecognitionReturn {
  const { autoLoad = false, onModelsLoaded, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  const serviceRef = useRef<FaceRecognitionService | null>(null);
  const loadedRef = useRef(false);
  const loadingRef = useRef(false);

  // Initialize service reference
  useEffect(() => {
    serviceRef.current = FaceRecognitionService.getInstance();
    setIsReady(serviceRef.current.isReady());
  }, []);

  // Load models (uses ref-based guard to prevent concurrent loading,
  // since state-based isLoading guard has a race window due to async batching)
  const loadModels = useCallback(async () => {
    if (loadedRef.current || loadingRef.current) {
      return;
    }
    loadingRef.current = true;

    const service = serviceRef.current;
    if (!service) {
      loadingRef.current = false;
      return;
    }

    // Check if already loaded
    if (service.isReady()) {
      setIsReady(true);
      setLoadProgress(100);
      loadedRef.current = true;
      loadingRef.current = false;
      onModelsLoaded?.();
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      await service.loadModels(progress => {
        setLoadProgress(progress);
      });

      setIsReady(true);
      loadedRef.current = true;
      onModelsLoaded?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load face recognition models';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [onModelsLoaded, onError]);

  // Auto-load if enabled
  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadModels();
    }
  }, [autoLoad, loadModels]);

  // Detect face
  const detectFace = useCallback(
    async (video: HTMLVideoElement): Promise<FaceDetectionResult | null> => {
      const service = serviceRef.current;
      if (!service || !service.isReady()) {
        throw new Error('Face recognition not ready. Load models first.');
      }

      return service.detectFace(video);
    },
    []
  );

  // Assess quality
  const assessQuality = useCallback(
    (score: number, detection: FaceDetectionResult | null) => {
      const service = serviceRef.current;
      if (!service) {
        return {
          level: 'poor' as const,
          message: 'Service not initialized',
          canEnroll: false,
        };
      }
      return service.assessQuality(score, detection);
    },
    []
  );

  return {
    isLoading,
    isReady,
    error,
    loadProgress,
    loadModels,
    detectFace,
    assessQuality,
  };
}
