import { z } from 'zod';

/**
 * Contact Admin endpoint validation
 */
export const contactAdminSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  organization: z.string().optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  requestType: z.enum(['demo', 'support', 'sales', 'other']).optional(),
});

export type ContactAdminRequest = z.infer<typeof contactAdminSchema>;

/**
 * Demo Credentials endpoint validation
 */
export const credentialsSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type CredentialsRequest = z.infer<typeof credentialsSchema>;

/**
 * Student creation validation
 */
export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  age: z
    .number()
    .int()
    .min(3, 'Age must be at least 3')
    .max(18, 'Age must be at most 18'),
  country: z.enum(['UK', 'US', 'INDIA']),
  gradeLevel: z.string().min(1).max(50),
  gradeSystem: z.enum(['uk_year', 'us_grade', 'india_class']),
  birthDate: z.string().datetime().optional(),
  learningPreferences: z.record(z.any()).optional(),
  specialNeeds: z.array(z.any()).optional(),
  academicStandards: z.record(z.any()).optional(),
  profilePictureUrl: z.string().url().optional(),
});

export type CreateStudentRequest = z.infer<typeof createStudentSchema>;

/**
 * Teacher creation validation
 */
export const createTeacherSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional(),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  experienceYears: z.number().int().min(0).optional(),
  qualifications: z.array(z.any()).optional(),
  specializations: z.array(z.string()).optional(),
  hourlyRate: z.number().min(0).optional(),
  availability: z.record(z.any()).optional(),
  location: z.record(z.any()).optional(),
  bio: z.string().max(2000).optional(),
  profilePictureUrl: z.string().url().optional(),
});

export type CreateTeacherRequest = z.infer<typeof createTeacherSchema>;

/**
 * Session creation validation
 */
export const createSessionSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  teacherId: z.string().uuid('Invalid teacher ID'),
  subject: z.string().min(1, 'Subject is required').max(255),
  scheduledStart: z.string().datetime('Invalid date format'),
  scheduledEnd: z.string().datetime('Invalid date format'),
  location: z.record(z.any()),
  notes: z.string().max(5000).optional(),
});

export type CreateSessionRequest = z.infer<typeof createSessionSchema>;

/**
 * Session update validation
 */
export const updateSessionSchema = z.object({
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  status: z
    .enum(['scheduled', 'in-progress', 'completed', 'cancelled'])
    .optional(),
  notes: z.string().max(5000).optional(),
});

export type UpdateSessionRequest = z.infer<typeof updateSessionSchema>;

/**
 * QR code generation validation
 */
export const generateQRCodeSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  studentId: z.string().uuid('Invalid student ID'),
  expiresInMinutes: z.number().int().min(1).max(60).optional(),
});

export type GenerateQRCodeRequest = z.infer<typeof generateQRCodeSchema>;

/**
 * QR code verification validation
 */
export const verifyQRCodeSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
});

export type VerifyQRCodeRequest = z.infer<typeof verifyQRCodeSchema>;

/**
 * Pagination query params validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * Helper function to validate request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Array<{
  field: string;
  message: string;
}> {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
