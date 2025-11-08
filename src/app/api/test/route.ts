import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection, withRateLimit } from '@/lib/api-security';
import { withRedisRateLimit } from '@/lib/rate-limit-redis';
import { z } from 'zod';

export const POST = (
  await withRedisRateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: 'api:test',
  })
)(
  withRateLimit({ keyPrefix: 'api:test', max: 20 })(
    withCSRFProtection(async function POST(request: NextRequest) {
      try {
        const body = await request.json();
        const schema = z.object({ echo: z.any().optional() });
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Test endpoint working',
          data: parsed.data,
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    })
  )
);

export const GET = withRateLimit({ keyPrefix: 'api:test', max: 60 })(
  withCSRFProtection(async function GET() {
    return NextResponse.json({
      success: true,
      message: 'Test endpoint accessible',
    });
  })
);
