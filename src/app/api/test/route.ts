import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection, withRateLimit } from '@/lib/api-security';

export const POST = withRateLimit({ keyPrefix: 'api:test', max: 20 })(
  withCSRFProtection(async function POST(request: NextRequest) {
    try {
      const body = await request.json();

      return NextResponse.json({
        success: true,
        message: 'Test endpoint working',
        data: body,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  })
);

export const GET = withRateLimit({ keyPrefix: 'api:test', max: 60 })(
  withCSRFProtection(async function GET() {
    return NextResponse.json({
      success: true,
      message: 'Test endpoint accessible',
    });
  })
);
