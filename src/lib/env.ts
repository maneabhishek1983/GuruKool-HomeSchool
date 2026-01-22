import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Supabase Configuration (CRITICAL)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'Supabase anon key too short'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'Supabase service role key too short'),

  // Authentication (CRITICAL)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters for security'),
  QR_SECRET: z.string().min(32, 'QR secret must be at least 32 characters for security'),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().optional(),

  // Redis (Recommended for production)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // AI Services (Optional - for AI features)
  OPENAI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_ENVIRONMENT: z.string().optional(),

  // Error Tracking (Optional but recommended)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // MCP Endpoints (Optional)
  MCP_EDUCATION_ENDPOINT: z.string().url().optional(),
  MCP_SECURITY_ENDPOINT: z.string().url().optional(),
  MCP_COMMUNICATION_ENDPOINT: z.string().url().optional(),

  // Demo Credentials (MUST be disabled in production)
  ENABLE_DEMO_CREDENTIALS: z.enum(['true', 'false']).default('false'),
  DEMO_PARENT_PASSWORD: z.string().optional(),
  DEMO_ADMIN_PASSWORD: z.string().optional(),
  DEMO_TEACHER_PASSWORD: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validate environment variables
 * Throws error if validation fails
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);

    // Additional security checks for production
    if (parsed.NODE_ENV === 'production') {
      // Ensure demo credentials are disabled
      if (parsed.ENABLE_DEMO_CREDENTIALS === 'true') {
        console.warn('⚠️  WARNING: Demo credentials are enabled in production! This is a security risk.');
      }

      // Warn if Redis is not configured
      if (!parsed.UPSTASH_REDIS_REST_URL || !parsed.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('⚠️  WARNING: Redis is not configured. Rate limiting will not work correctly in production.');
      }

      // Warn if error tracking is not configured
      if (!parsed.SENTRY_DSN) {
        console.warn('⚠️  WARNING: Sentry is not configured. Production errors will not be tracked.');
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration. Please check your .env file.');
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Check if demo credentials are enabled
 */
export const isDemoEnabled = env.ENABLE_DEMO_CREDENTIALS === 'true' && !isProduction;

/**
 * Check if Redis is configured
 */
export const isRedisConfigured = !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Check if Sentry is configured
 */
export const isSentryConfigured = !!env.SENTRY_DSN;

/**
 * Check if AI services are configured
 */
export const isAIConfigured = !!(env.OPENAI_API_KEY && env.PINECONE_API_KEY);

/**
 * Get public environment variables (safe to expose to client)
 */
export const publicEnv = {
  SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  APP_URL: env.NEXT_PUBLIC_APP_URL,
  WS_URL: env.NEXT_PUBLIC_WS_URL,
  NODE_ENV: env.NODE_ENV,
};

/**
 * Log environment configuration status
 */
export function logEnvStatus() {
  console.log('🔧 Environment Configuration:');
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - Supabase: ✅ Configured`);
  console.log(`  - JWT Secret: ✅ Configured`);
  console.log(`  - QR Secret: ✅ Configured`);
  console.log(`  - Redis: ${isRedisConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  - Sentry: ${isSentryConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  - AI Services: ${isAIConfigured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  - Demo Credentials: ${isDemoEnabled ? '⚠️  Enabled' : '✅ Disabled'}`);
}
