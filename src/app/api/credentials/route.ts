import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Demo Credentials Endpoint - DISABLED IN PRODUCTION
 *
 * SECURITY NOTICE:
 * This endpoint exposes demo credentials for testing purposes only.
 * It is automatically disabled in production environments.
 *
 * For staging/development use only.
 */

// Demo credentials (only accessible in non-production environments)
const demoCredentials: Record<string, { password: string; role: string }> = {
  'parent@example.com': {
    password: process.env.DEMO_PARENT_PASSWORD || 'parent123',
    role: 'parent',
  },
  'admin@example.com': {
    password: process.env.DEMO_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  },
  'teacher@example.com': {
    password: process.env.DEMO_TEACHER_PASSWORD || 'teacher123',
    role: 'teacher',
  },
};

/**
 * Check if this endpoint should be enabled
 */
function isEndpointEnabled(): boolean {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Allow override with environment variable (for staging)
  if (process.env.ENABLE_DEMO_CREDENTIALS === 'true') {
    return true;
  }

  // Default: enabled in development, disabled otherwise
  return process.env.NODE_ENV === 'development';
}

export async function POST(request: NextRequest) {
  // Block in production
  if (!isEndpointEnabled()) {
    return NextResponse.json(
      {
        error: 'Endpoint disabled in production',
        code: 'ENDPOINT_DISABLED',
      },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const { email } = parsed.data;

    // Type-safe credential lookup
    const credentials = demoCredentials[email as keyof typeof demoCredentials];

    if (!credentials) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Log access (for security monitoring)
    console.warn('⚠️  Demo credentials accessed:', {
      email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      email,
      password: credentials.password,
      role: credentials.role,
      message: 'Demo credentials retrieved successfully',
      warning: '⚠️  This endpoint is for development/staging only',
    });
  } catch (error) {
    console.error('Error in demo credentials endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Block in production
  if (!isEndpointEnabled()) {
    return NextResponse.json(
      {
        error: 'Endpoint disabled in production',
        code: 'ENDPOINT_DISABLED',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Demo credentials endpoint (Development/Staging only)',
    environment: process.env.NODE_ENV,
    availableEmails: Object.keys(demoCredentials),
    warning: '⚠️  This endpoint is automatically disabled in production',
  });
}
