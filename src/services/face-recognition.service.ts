/**
 * Face Recognition Client Service
 * Handles model loading and face detection on the client side
 *
 * SECURITY NOTES:
 * - This service ONLY handles detection and descriptor extraction
 * - ALL matching and verification is done SERVER-SIDE
 * - Never perform client-side matching - send descriptors to server
 */

import * as faceapi from 'face-api.js';
import type { FaceDetectionResult } from '@/types';

// Model paths - served from public directory
const MODEL_URL = '/models/face-api';

// Detection options for optimal performance
const DETECTION_OPTIONS = new faceapi.SsdMobilenetv1Options({
  minConfidence: 0.5,
  maxResults: 1, // Only detect one face
});

/**
 * Face Recognition Service
 * Singleton service for managing face detection on the client
 */
export class FaceRecognitionService {
  private static instance: FaceRecognitionService;
  private modelsLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  /**
   * Check if models are loaded and ready
   */
  isReady(): boolean {
    return this.modelsLoaded;
  }

  /**
   * Load face detection models with progress callback
   *
   * @param onProgress - Progress callback (0-100)
   * @throws Error if model loading fails
   */
  async loadModels(onProgress?: (progress: number) => void): Promise<void> {
    // If already loaded, return immediately
    if (this.modelsLoaded) {
      onProgress?.(100);
      return;
    }

    // If currently loading, wait for existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading
    this.loadingPromise = this.doLoadModels(onProgress);

    try {
      await this.loadingPromise;
      this.modelsLoaded = true;
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Internal method to load models
   * Loads models in parallel with a timeout for mobile network resilience
   */
  private async doLoadModels(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // 30-second timeout for model loading (mobile networks can be slow)
    const MODEL_LOAD_TIMEOUT_MS = 30000;

    // Declare progress interval outside try so it can be cleaned up in catch/finally
    let progressInterval: ReturnType<typeof setInterval> | undefined;

    try {
      onProgress?.(10);

      // Load all three models in parallel for faster initialization
      // This is especially important on mobile where sequential loads
      // over 3G/4G multiply total wait time
      const loadWithTimeout = Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      // Simulate incremental progress during parallel load
      let progressValue = 10;
      progressInterval = setInterval(() => {
        progressValue = Math.min(90, progressValue + 10);
        onProgress?.(progressValue);
      }, 1500);

      // Race between model loading and timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Face detection models took too long to load. ' +
                'Please check your internet connection and try again.'
            )
          );
        }, MODEL_LOAD_TIMEOUT_MS);
      });

      await Promise.race([loadWithTimeout, timeoutPromise]);
      clearInterval(progressInterval);

      onProgress?.(100);

      console.log('[FaceRecognition] Models loaded successfully');
    } catch (error) {
      clearInterval(progressInterval);
      console.error('[FaceRecognition] Failed to load models:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Provide mobile-friendly error messages
      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError')
      ) {
        throw new Error(
          'Unable to download face detection models. Please check your internet connection and try again.'
        );
      }

      throw new Error(`Failed to load face recognition models: ${message}`);
    }
  }

  /**
   * Detect face in video element and extract descriptor
   *
   * IMPORTANT: This only extracts the descriptor - matching is done server-side
   *
   * @param videoElement - HTMLVideoElement with camera stream
   * @returns Face detection result or null if no face detected
   */
  async detectFace(
    videoElement: HTMLVideoElement
  ): Promise<FaceDetectionResult | null> {
    if (!this.modelsLoaded) {
      throw new Error('Models not loaded. Call loadModels() first.');
    }

    try {
      // Detect face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(videoElement, DETECTION_OPTIONS)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      // Extract bounding box
      const box = detection.detection.box;

      // Calculate quality score based on detection confidence and face size
      const qualityScore = this.calculateQualityScore(
        detection.detection,
        videoElement
      );

      // Return detection result with descriptor
      // SECURITY: Descriptor is sent to server for matching - never match locally
      return {
        descriptor: Array.from(detection.descriptor),
        boundingBox: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        qualityScore,
        landmarks: detection.landmarks,
      };
    } catch (error) {
      console.error('[FaceRecognition] Detection error:', error);
      throw error;
    }
  }

  /**
   * Calculate quality score for face detection
   *
   * @param detection - Face detection result
   * @param videoElement - Video element for size comparison
   * @returns Quality score between 0 and 1
   */
  private calculateQualityScore(
    detection: faceapi.FaceDetection,
    videoElement: HTMLVideoElement
  ): number {
    // Base score from detection confidence
    let score = detection.score;

    // Adjust based on face size relative to video
    const box = detection.box;
    const videoArea = videoElement.videoWidth * videoElement.videoHeight;
    const faceArea = box.width * box.height;
    const faceRatio = faceArea / videoArea;

    // Optimal face size is 10-40% of frame
    if (faceRatio < 0.05) {
      // Face too small
      score *= 0.7;
    } else if (faceRatio > 0.5) {
      // Face too large (too close)
      score *= 0.8;
    } else if (faceRatio >= 0.1 && faceRatio <= 0.4) {
      // Optimal size - bonus
      score = Math.min(1, score * 1.1);
    }

    // Adjust based on face position (centered is better)
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const videoCenterX = videoElement.videoWidth / 2;
    const videoCenterY = videoElement.videoHeight / 2;

    const xOffset = Math.abs(centerX - videoCenterX) / videoCenterX;
    const yOffset = Math.abs(centerY - videoCenterY) / videoCenterY;

    if (xOffset > 0.3 || yOffset > 0.3) {
      // Face not centered
      score *= 0.9;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get quality assessment for display
   */
  assessQuality(
    score: number,
    detection: FaceDetectionResult | null
  ): {
    level: 'poor' | 'fair' | 'good' | 'excellent';
    message: string;
    canEnroll: boolean;
  } {
    if (!detection) {
      return {
        level: 'poor',
        message: 'No face detected. Please face the camera.',
        canEnroll: false,
      };
    }

    if (score < 0.5) {
      return {
        level: 'poor',
        message:
          'Poor quality. Please improve lighting and face the camera directly.',
        canEnroll: false,
      };
    }

    if (score < 0.7) {
      return {
        level: 'fair',
        message: 'Fair quality. Try moving closer or improving lighting.',
        canEnroll: true,
      };
    }

    if (score < 0.85) {
      return {
        level: 'good',
        message: 'Good quality. Ready for enrollment.',
        canEnroll: true,
      };
    }

    return {
      level: 'excellent',
      message: 'Excellent quality!',
      canEnroll: true,
    };
  }

  /**
   * Preload models in background without blocking
   * Call this early (e.g., on dashboard load) for better UX
   */
  preloadModelsInBackground(): void {
    if (this.modelsLoaded || this.loadingPromise) {
      return;
    }

    // Load models silently in background
    this.loadModels().catch(error => {
      console.warn('[FaceRecognition] Background preload failed:', error);
    });
  }
}

// Export singleton instance getter for convenience
export const getFaceRecognitionService = () =>
  FaceRecognitionService.getInstance();
