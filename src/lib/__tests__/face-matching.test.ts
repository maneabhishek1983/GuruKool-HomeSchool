/**
 * Face Matching Service Unit Tests
 */

import {
  calculateEuclideanDistance,
  distanceToConfidence,
  getConfidenceLevel,
  compareFaceDescriptors,
  validateDescriptor,
  normalizeDescriptor,
  calculateDescriptorNorm,
  FACE_MATCH_THRESHOLDS,
  getMatchThreshold,
} from '../face-matching';

describe('Face Matching Service', () => {
  // Create test descriptors
  const createTestDescriptor = (seed: number): number[] =>
    Array.from({ length: 128 }, (_, i) => Math.sin(seed + i * 0.1));

  const identicalDescriptor1 = createTestDescriptor(1);
  const identicalDescriptor2 = [...identicalDescriptor1];
  const differentDescriptor = createTestDescriptor(100);
  const similarDescriptor = identicalDescriptor1.map(v => v + 0.05);

  describe('calculateEuclideanDistance', () => {
    it('should return 0 for identical descriptors', () => {
      const distance = calculateEuclideanDistance(
        identicalDescriptor1,
        identicalDescriptor2
      );
      expect(distance).toBeCloseTo(0, 10);
    });

    it('should return positive distance for different descriptors', () => {
      const distance = calculateEuclideanDistance(
        identicalDescriptor1,
        differentDescriptor
      );
      expect(distance).toBeGreaterThan(0);
    });

    it('should return smaller distance for similar descriptors', () => {
      const distanceSimilar = calculateEuclideanDistance(
        identicalDescriptor1,
        similarDescriptor
      );
      const distanceDifferent = calculateEuclideanDistance(
        identicalDescriptor1,
        differentDescriptor
      );

      expect(distanceSimilar).toBeLessThan(distanceDifferent);
    });

    it('should be symmetric', () => {
      const distance1 = calculateEuclideanDistance(
        identicalDescriptor1,
        differentDescriptor
      );
      const distance2 = calculateEuclideanDistance(
        differentDescriptor,
        identicalDescriptor1
      );

      expect(distance1).toBeCloseTo(distance2, 10);
    });

    it('should throw for non-array inputs', () => {
      expect(() => {
        // @ts-expect-error - testing invalid input
        calculateEuclideanDistance('not an array', identicalDescriptor1);
      }).toThrow('Descriptors must be arrays');
    });

    it('should throw for wrong length descriptor1', () => {
      const shortDescriptor = Array.from({ length: 64 }, () => 0);

      expect(() => {
        calculateEuclideanDistance(shortDescriptor, identicalDescriptor1);
      }).toThrow('Descriptor 1 must be 128-dimensional');
    });

    it('should throw for wrong length descriptor2', () => {
      const shortDescriptor = Array.from({ length: 64 }, () => 0);

      expect(() => {
        calculateEuclideanDistance(identicalDescriptor1, shortDescriptor);
      }).toThrow('Descriptor 2 must be 128-dimensional');
    });
  });

  describe('distanceToConfidence', () => {
    it('should return 1 for distance 0', () => {
      expect(distanceToConfidence(0)).toBe(1);
    });

    it('should return 0 for distance 1', () => {
      expect(distanceToConfidence(1)).toBe(0);
    });

    it('should return 0.6 for distance 0.4', () => {
      expect(distanceToConfidence(0.4)).toBeCloseTo(0.6);
    });

    it('should clamp values below 0', () => {
      expect(distanceToConfidence(-0.5)).toBe(1);
    });

    it('should clamp values above 1', () => {
      expect(distanceToConfidence(1.5)).toBe(0);
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return "high" for distance <= 0.3', () => {
      expect(getConfidenceLevel(0.1)).toBe('high');
      expect(getConfidenceLevel(0.3)).toBe('high');
    });

    it('should return "medium" for distance <= 0.4', () => {
      expect(getConfidenceLevel(0.35)).toBe('medium');
      expect(getConfidenceLevel(0.4)).toBe('medium');
    });

    it('should return "low" for distance <= 0.5', () => {
      expect(getConfidenceLevel(0.45)).toBe('low');
      expect(getConfidenceLevel(0.5)).toBe('low');
    });

    it('should return "no_match" for distance > 0.5', () => {
      expect(getConfidenceLevel(0.6)).toBe('no_match');
      expect(getConfidenceLevel(1.0)).toBe('no_match');
    });
  });

  describe('compareFaceDescriptors', () => {
    it('should return matched=true for identical descriptors', () => {
      const result = compareFaceDescriptors(
        identicalDescriptor1,
        identicalDescriptor2
      );

      expect(result.matched).toBe(true);
      expect(result.distance).toBeCloseTo(0, 5);
      expect(result.confidence).toBeCloseTo(1, 5);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should return matched=false for different descriptors', () => {
      const result = compareFaceDescriptors(
        identicalDescriptor1,
        differentDescriptor
      );

      expect(result.matched).toBe(false);
      expect(result.distance).toBeGreaterThan(0.4);
    });

    it('should use custom threshold when provided', () => {
      // Create a descriptor with known distance
      const descriptor1 = Array.from({ length: 128 }, () => 0);
      const descriptor2 = Array.from({ length: 128 }, () => 0.1);

      // With low threshold
      const resultLow = compareFaceDescriptors(descriptor1, descriptor2, 0.1);
      expect(resultLow.threshold).toBe(0.1);

      // With high threshold
      const resultHigh = compareFaceDescriptors(descriptor1, descriptor2, 2.0);
      expect(resultHigh.threshold).toBe(2.0);
    });

    it('should return complete result structure', () => {
      const result = compareFaceDescriptors(
        identicalDescriptor1,
        similarDescriptor
      );

      expect(result).toHaveProperty('matched');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('confidenceLevel');
      expect(result).toHaveProperty('threshold');
    });
  });

  describe('validateDescriptor', () => {
    it('should return valid=true for valid descriptor', () => {
      const result = validateDescriptor(identicalDescriptor1);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-array input', () => {
      const result = validateDescriptor('not an array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Descriptor must be an array');
    });

    it('should reject wrong length array', () => {
      const result = validateDescriptor(Array.from({ length: 64 }, () => 0));
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must have 128 elements');
    });

    it('should reject non-number elements', () => {
      const badDescriptor = Array.from({ length: 128 }, () => 0);
      // @ts-expect-error - testing invalid input
      badDescriptor[10] = 'not a number';

      const result = validateDescriptor(badDescriptor);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not a number');
    });

    it('should reject non-finite values', () => {
      const badDescriptor = Array.from({ length: 128 }, () => 0);
      badDescriptor[5] = Infinity;

      const result = validateDescriptor(badDescriptor);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('not finite');
    });

    it('should warn about unusual values', () => {
      const unusualDescriptor = Array.from({ length: 128 }, () => 0);
      unusualDescriptor[0] = 100; // Very large value

      const result = validateDescriptor(unusualDescriptor);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('unusual value');
    });
  });

  describe('normalizeDescriptor', () => {
    it('should normalize to L2 norm of 1', () => {
      const unnormalized = Array.from({ length: 128 }, () => 2);
      const normalized = normalizeDescriptor(unnormalized);

      const norm = calculateDescriptorNorm(normalized);
      expect(norm).toBeCloseTo(1, 10);
    });

    it('should throw for zero-norm descriptor', () => {
      const zeroDescriptor = Array.from({ length: 128 }, () => 0);

      expect(() => {
        normalizeDescriptor(zeroDescriptor);
      }).toThrow('Cannot normalize zero-norm descriptor');
    });

    it('should preserve direction', () => {
      const descriptor = [1, 2, 3, ...Array(125).fill(0)];
      const normalized = normalizeDescriptor(descriptor);

      // Check proportions are preserved
      expect(normalized[1]! / normalized[0]!).toBeCloseTo(2, 10);
      expect(normalized[2]! / normalized[0]!).toBeCloseTo(3, 10);
    });
  });

  describe('calculateDescriptorNorm', () => {
    it('should calculate correct norm', () => {
      const descriptor = Array.from({ length: 128 }, () => 1);
      const norm = calculateDescriptorNorm(descriptor);

      // sqrt(128 * 1^2) = sqrt(128) ≈ 11.31
      expect(norm).toBeCloseTo(Math.sqrt(128), 10);
    });

    it('should return 0 for zero descriptor', () => {
      const descriptor = Array.from({ length: 128 }, () => 0);
      const norm = calculateDescriptorNorm(descriptor);

      expect(norm).toBe(0);
    });
  });

  describe('FACE_MATCH_THRESHOLDS', () => {
    it('should have expected threshold values', () => {
      expect(FACE_MATCH_THRESHOLDS.HIGH_CONFIDENCE).toBe(0.3);
      expect(FACE_MATCH_THRESHOLDS.MEDIUM_CONFIDENCE).toBe(0.4);
      expect(FACE_MATCH_THRESHOLDS.LOW_CONFIDENCE).toBe(0.5);
      expect(FACE_MATCH_THRESHOLDS.MAX_DISTANCE).toBe(0.6);
    });
  });

  describe('getMatchThreshold', () => {
    it('should return env value when set', () => {
      process.env.FACE_MATCH_THRESHOLD = '0.35';
      expect(getMatchThreshold()).toBe(0.35);
      delete process.env.FACE_MATCH_THRESHOLD;
    });

    it('should return default when not set', () => {
      delete process.env.FACE_MATCH_THRESHOLD;
      expect(getMatchThreshold()).toBe(FACE_MATCH_THRESHOLDS.MEDIUM_CONFIDENCE);
    });

    it('should return default for invalid env value', () => {
      process.env.FACE_MATCH_THRESHOLD = 'invalid';
      expect(getMatchThreshold()).toBe(FACE_MATCH_THRESHOLDS.MEDIUM_CONFIDENCE);
      delete process.env.FACE_MATCH_THRESHOLD;
    });

    it('should return default for out-of-range value', () => {
      process.env.FACE_MATCH_THRESHOLD = '5.0';
      expect(getMatchThreshold()).toBe(FACE_MATCH_THRESHOLDS.MEDIUM_CONFIDENCE);
      delete process.env.FACE_MATCH_THRESHOLD;
    });
  });
});
