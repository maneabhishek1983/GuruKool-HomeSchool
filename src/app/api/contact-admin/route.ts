import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/email.service';
import {
  contactAdminSchema,
  createValidationErrorResponse,
} from '@/lib/validation';
import { withRateLimit } from '@/lib/api-security';

export const POST = withRateLimit({
  keyPrefix: 'api:contact',
  max: 5,
  windowMs: 60 * 60 * 1000,
})(async function POST(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';

  try {
    // Parse request body
    const body = await request.json();

    // Validate request with Zod
    const validation = contactAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createValidationErrorResponse(validation.error),
        { status: 400 }
      );
    }

    const { name, email, subject, message, category } = validation.data;

    // Create contact request object
    const contactRequest = {
      id: `contact-${Date.now()}`,
      name,
      email,
      subject,
      message,
      category,
      adminEmail: 'abhishekumane@gmail.com',
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
    };

    // Log the contact request with request ID for correlation
    console.log('Contact request received:', {
      ...contactRequest,
      requestId,
    });

    // Process the contact request (send emails)
    const emailResults =
      await emailService.processContactRequest(contactRequest);

    console.log('Email processing results:', {
      requestId,
      results: emailResults,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contact request submitted successfully',
      contactId: contactRequest.id,
      estimatedResponseTime: '24-48 hours',
    });
  } catch (error) {
    console.error('Error processing contact request:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
});

export async function GET() {
  return NextResponse.json({
    message: 'Contact admin endpoint',
    adminEmail: 'abhishekumane@gmail.com',
    responseTime: '24-48 hours',
  });
}
