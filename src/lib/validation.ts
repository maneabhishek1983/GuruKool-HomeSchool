import { z } from 'zod';

/**
 * Reusable Zod validation schemas for API routes
 * 
 * This file contains all validation schemas used across the application.
 * Using Zod provides:
 * - Type-safe request validation
 * - Automatic TypeScript type inference
 * - Detailed error messages
 * - Input sanitization
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation using standard library
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Password validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL format').optional();

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z.string().datetime('Invalid date format');

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// User Schemas
// ============================================================================

/**
 * User role enum
 */
export const userRoleSchema = z.enum(['parent', 'teacher', 'admin']);

/**
 * Create user request
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(255).trim(),
  role: userRoleSchema,
  password: passwordSchema.optional(),
});

/**
 * Update user request
 */
export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  email: emailSchema.optional(),
  preferences: z.record(z.unknown()).optional(),
});

// ============================================================================
// Student Schemas
// ============================================================================

/**
 * Country enum
 */
export const countrySchema = z.enum(['UK', 'US', 'INDIA']);

/**
 * Grade system enum
 */
export const gradeSystemSchema = z.enum([
  'uk_year',
  'us_grade',
  'india_class',
]);

/**
 * Create student request
 */
export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  age: z.number().int().min(3).max(18),
  country: countrySchema,
  grade_level: z.string().min(1).max(50),
  grade_system: gradeSystemSchema,
  birth_date: dateStringSchema.optional(),
  learning_preferences: z.record(z.unknown()).optional(),
  special_needs: z.record(z.unknown()).optional(),
  academic_standards: z.record(z.unknown()).optional(),
  profile_picture_url: urlSchema,
  assigned_teachers: z.array(uuidSchema).default([]),
  teacher_notes: z.string().max(5000).optional(),
});

/**
 * Update student request
 */
export const updateStudentSchema = createStudentSchema.partial();

// ============================================================================
// Teacher Schemas
// ============================================================================

/**
 * Teacher status enum
 */
export const teacherStatusSchema = z.enum([
  'available',
  'assigned',
  'unavailable',
]);

/**
 * Verification status enum
 */
export const verificationStatusSchema = z.enum([
  'pending',
  'verified',
  'rejected',
]);

/**
 * Create teacher request
 */
export const createTeacherSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  email: emailSchema,
  phone: phoneSchema,
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  experience_years: z.number().int().min(0).max(50),
  qualifications: z.array(z.string()).min(1),
  specializations: z.array(z.string()).default([]),
  hourly_rate: z.number().min(0),
  availability: z.record(z.unknown()),
  location: z.record(z.unknown()),
  bio: z.string().max(2000).optional(),
  status: teacherStatusSchema.default('available'),
  verification_status: verificationStatusSchema.default('pending'),
  profile_picture_url: urlSchema,
});

/**
 * Update teacher request
 */
export const updateTeacherSchema = createTeacherSchema.partial();

// ============================================================================
// Session Schemas
// ============================================================================

/**
 * Session status enum
 */
export const sessionStatusSchema = z.enum([
  'scheduled',
  'in-progress',
  'completed',
  'cancelled',
]);

/**
 * Create session request
 */
export const createSessionSchema = z.object({
  student_id: uuidSchema,
  teacher_id: uuidSchema,
  subject: z.string().min(1).max(255),
  scheduled_start: dateStringSchema,
  scheduled_end: dateStringSchema,
  location: z.object({
    address: z.string().optional(),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
    verified: z.boolean().default(false),
  }),
  notes: z.string().max(5000).optional(),
  status: sessionStatusSchema.default('scheduled'),
});

/**
 * Update session request
 */
export const updateSessionSchema = z.object({
  scheduled_start: dateStringSchema.optional(),
  scheduled_end: dateStringSchema.optional(),
  actual_start: dateStringSchema.optional(),
  actual_end: dateStringSchema.optional(),
  location: z.record(z.unknown()).optional(),
  status: sessionStatusSchema.optional(),
  notes: z.string().max(5000).optional(),
});

// ============================================================================
// Data Sheet Schemas
// ============================================================================

/**
 * Create data sheet request
 */
export const createDataSheetSchema = z.object({
  student_id: uuidSchema,
  teacher_id: uuidSchema,
  date: dateStringSchema,
  subject: z.string().min(1).max(255),
  topic: z.string().min(1).max(500),
  objectives: z.array(z.string()).min(1),
  activities: z.array(
    z.object({
      description: z.string().min(1).max(1000),
      duration_minutes: z.number().int().positive(),
      materials: z.array(z.string()).default([]),
      notes: z.string().max(2000).optional(),
    })
  ),
  assessment: z
    .object({
      method: z.string(),
      criteria: z.array(z.string()),
      notes: z.string().max(2000).optional(),
    })
    .optional(),
  homework: z.string().max(1000).optional(),
  parent_notes: z.string().max(2000).optional(),
});

/**
 * Update data sheet request
 */
export const updateDataSheetSchema = createDataSheetSchema.partial();

// ============================================================================
// Contact/Communication Schemas
// ============================================================================

/**
 * Contact admin request
 */
export const contactAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).trim(),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(500).trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000).trim(),
  category: z
    .enum(['support', 'billing', 'feature-request', 'bug-report', 'other'])
    .default('support'),
});

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Login request
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register request
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(255).trim(),
  role: userRoleSchema.default('parent'),
});

/**
 * Password reset request
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirm
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate request body against a schema
 * Returns parsed data or throws validation error
 * 
 * @example
 * ```typescript
 * const body = await validateRequestBody(request, createUserSchema);
 * ```
 */
export async function validateRequestBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request body', error.errors);
    }
    throw error;
  }
}

/**
 * Validate query parameters against a schema
 * 
 * @example
 * ```typescript
 * const params = validateQueryParams(request, paginationSchema);
 * ```
 */
export function validateQueryParams<T extends z.ZodType>(
  request: Request,
  schema: T
): z.infer<T> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw error;
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Format errors for API response
   */
  toJSON() {
    return {
      error: this.message,
      code: 'VALIDATION_ERROR',
      details: this.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    };
  }
}

/**
 * Sanitize string input (remove HTML tags, trim whitespace)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = Array.isArray(value)
        ? value.map((item) =>
            typeof item === 'object' ? sanitizeObject(item) : item
          )
        : sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
