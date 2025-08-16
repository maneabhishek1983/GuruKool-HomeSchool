import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, organization, message, requestType } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create contact request object
    const contactRequest = {
      id: `contact-${Date.now()}`,
      name,
      email,
      phone: phone || 'Not provided',
      organization: organization || 'Not provided',
      message,
      requestType,
      adminEmail: 'abhishekumane@gmail.com',
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
    };

    // Log the contact request (in production, this would be stored in a database)
    console.log('Contact request received:', contactRequest);

    // Process the contact request (send emails)
    const emailResults =
      await emailService.processContactRequest(contactRequest);

    console.log('Email processing results:', emailResults);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contact request submitted successfully',
      contactId: contactRequest.id,
      estimatedResponseTime: '24-48 hours',
    });
  } catch (error) {
    console.error('Error processing contact request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Contact admin endpoint',
    adminEmail: 'abhishekumane@gmail.com',
    responseTime: '24-48 hours',
  });
}
