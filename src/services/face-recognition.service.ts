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
   */
  private async doLoadModels(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      onProgress?.(10);

      // Load SSD MobileNet for face detection
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      onProgress?.(40);

      // Load face landmark model for alignment
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      onProgress?.(70);

      // Load face recognition model for descriptor extraction
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      onProgress?.(100);

      console.log('[FaceRecognition] Models loaded successfully');
    } catch (error) {
      console.error('[FaceRecognition] Failed to load models:', error);
      throw new Error(
        `Failed to load face recognition models: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
