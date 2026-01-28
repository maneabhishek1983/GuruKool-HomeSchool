/**
 * Face Matching Service (Server-Side Only)
 * Provides secure face descriptor comparison
 *
 * SECURITY CRITICAL:
 * - All matching calculations MUST happen on the server
 * - Never trust client-provided confidence scores
 * - Always calculate distance and confidence server-side
 */

/**
 * Match confidence thresholds
 * Based on face-api.js recommendations for FaceNet descriptor distances
 */
export const FACE_MATCH_THRESHOLDS = {
  /** Very high confidence match (< 0.3 distance) */
  HIGH_CONFIDENCE: 0.3,
  /** Standard match threshold (< 0.4 distance) - recommended default */
  MEDIUM_CONFIDENCE: 0.4,
  /** Loose match threshold (< 0.5 distance) - use with caution */
  LOW_CONFIDENCE: 0.5,
  /** Maximum acceptable distance (0.6) - rarely recommended */
  MAX_DISTANCE: 0.6,
} as const;

/**
 * Get the configured match threshold from environment
 * Falls back to MEDIUM_CONFIDENCE (0.4) if not set
 */
export function getMatchThreshold(): number {
  const envThreshold = process.env.FACE_MATCH_THRESHOLD;
  if (envThreshold) {
    const parsed = parseFloat(envThreshold);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1) {
      return parsed;
    }
  }
  return FACE_MATCH_THRESHOLDS.MEDIUM_CONFIDENCE;
}

/**
 * Calculate Euclidean distance between two face descriptors
 *
 * @param descriptor1 - First 128-dimensional face descriptor
 * @param descriptor2 - Second 128-dimensional face descriptor
 * @returns Euclidean distance (lower = more similar)
 * @throws Error if descriptors are invalid
 *
 * @example
 * const distance = calculateEuclideanDistance(enrolledDescriptor, capturedDescriptor);
 * if (distance < 0.4) {
 *   // Match!
 * }
 */
export function calculateEuclideanDistance(
  descriptor1: number[],
  descriptor2: number[]
): number {
  // Validate inputs
  if (!Array.isArray(descriptor1) || !Array.isArray(descriptor2)) {
    throw new Error('Descriptors must be arrays');
  }

  if (descriptor1.length !== 128) {
    throw new Error(
      `Descriptor 1 must be 128-dimensional, got ${descriptor1.length}`
    );
  }

  if (descriptor2.length !== 128) {
    throw new Error(
      `Descriptor 2 must be 128-dimensional, got ${descriptor2.length}`
    );
  }

  // Calculate sum of squared differences
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const val1 = descriptor1[i];
    const val2 = descriptor2[i];
    // These are guaranteed to exist since we validated length = 128
    if (val1 !== undefined && val2 !== undefined) {
      const diff = val1 - val2;
      sum += diff * diff;
    }
  }

  return Math.sqrt(sum);
}

/**
 * Convert Euclidean distance to confidence score
 * Uses a linear mapping where distance 0 = confidence 1, distance 1 = confidence 0
 *
 * @param distance - Euclidean distance between descriptors
 * @returns Confidence score between 0 and 1
 *
 * @example
 * const confidence = distanceToConfidence(0.3); // ~0.7
 */
export function distanceToConfidence(distance: number): number {
  // Clamp distance to [0, 1] range
  const clampedDistance = Math.max(0, Math.min(1, distance));
  return 1 - clampedDistance;
}

/**
 * Determine match confidence level based on distance
 *
 * @param distance - Euclidean distance between descriptors
 * @returns Confidence level string
 */
export function getConfidenceLevel(
  distance: number
): 'high' | 'medium' | 'low' | 'no_match' {
  if (distance <= FACE_MATCH_THRESHOLDS.HIGH_CONFIDENCE) {
    return 'high';
  }
  if (distance <= FACE_MATCH_THRESHOLDS.MEDIUM_CONFIDENCE) {
    return 'medium';
  }
  if (distance <= FACE_MATCH_THRESHOLDS.LOW_CONFIDENCE) {
    return 'low';
  }
  return 'no_match';
}

/**
 * Match result from server-side verification
 */
export interface FaceMatchResult {
  /** Whether the face matched within threshold */
  matched: boolean;
  /** Euclidean distance between descriptors */
  distance: number;
  /** Confidence score (0-1, higher = more confident) */
  confidence: number;
  /** Confidence level category */
  confidenceLevel: 'high' | 'medium' | 'low' | 'no_match';
  /** The threshold used for matching */
  threshold: number;
}

/**
 * Compare two face descriptors and determine if they match
 *
 * @param enrolledDescriptor - The stored (enrolled) face descriptor
 * @param capturedDescriptor - The newly captured face descriptor
 * @param threshold - Optional custom threshold (defaults to env or 0.4)
 * @returns Match result with distance and confidence
 *
 * @example
 * const enrolled = await decryptFaceDescriptor(dbRecord.face_descriptor_encrypted);
 * const result = compareFaceDescriptors(enrolled, capturedDescriptor);
 * if (result.matched) {
 *   // Allow check-in
 * }
 */
export function compareFaceDescriptors(
  enrolledDescriptor: number[],
  capturedDescriptor: number[],
  threshold?: number
): FaceMatchResult {
  const effectiveThreshold = threshold ?? getMatchThreshold();

  // Calculate distance
  const distance = calculateEuclideanDistance(
    enrolledDescriptor,
    capturedDescriptor
  );

  // Calculate confidence
  const confidence = distanceToConfidence(distance);

  // Determine match
  const matched = distance <= effectiveThreshold;

  // Get confidence level
  const confidenceLevel = getConfidenceLevel(distance);

  return {
    matched,
    distance,
    confidence,
    confidenceLevel,
    threshold: effectiveThreshold,
  };
}

/**
 * Validate that a descriptor has valid structure and values
 *
 * @param descriptor - Face descriptor to validate
 * @returns Validation result with any errors
 */
export function validateDescriptor(descriptor: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(descriptor)) {
    return { valid: false, errors: ['Descriptor must be an array'] };
  }

  if (descriptor.length !== 128) {
    errors.push(`Descriptor must have 128 elements, got ${descriptor.length}`);
  }

  for (let i = 0; i < descriptor.length; i++) {
    const value = descriptor[i];
    if (typeof value !== 'number') {
      errors.push(`Element at index ${i} is not a number`);
      if (errors.length >= 5) {
        errors.push('... (more errors)');
        break;
      }
    } else if (!Number.isFinite(value)) {
      errors.push(`Element at index ${i} is not finite (${value})`);
      if (errors.length >= 5) {
        errors.push('... (more errors)');
        break;
      }
    } else if (value < -10 || value > 10) {
      // Face descriptors typically have values between -1 and 1,
      // but we allow a wider range for safety
      errors.push(`Element at index ${i} has unusual value (${value})`);
      if (errors.length >= 5) {
        errors.push('... (more errors)');
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Normalize a descriptor (ensure L2 norm = 1)
 * Face-api.js descriptors are typically already normalized,
 * but this can help with edge cases
 *
 * @param descriptor - Face descriptor to normalize
 * @returns Normalized descriptor
 */
export function normalizeDescriptor(descriptor: number[]): number[] {
  // Calculate L2 norm
  let normSquared = 0;
  for (const value of descriptor) {
    normSquared += value * value;
  }
  const norm = Math.sqrt(normSquared);

  if (norm === 0) {
    throw new Error('Cannot normalize zero-norm descriptor');
  }

  // Normalize
  return descriptor.map(value => value / norm);
}

/**
 * Calculate the L2 norm of a descriptor
 * Useful for validation (should be close to 1 for normalized descriptors)
 */
export function calculateDescriptorNorm(descriptor: number[]): number {
  let normSquared = 0;
  for (const value of descriptor) {
    normSquared += value * value;
  }
  return Math.sqrt(normSquared);
}
