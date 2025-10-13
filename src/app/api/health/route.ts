import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api-security';
import { getSupabaseAdmin } from '@/lib/supabase';

export const GET = withRateLimit({ keyPrefix: 'api:health', max: 200 })(
  async function GET(request: NextRequest) {
    try {
      // Verify Supabase connectivity with a cheap query
      let supabaseOk = false;
      let supabaseLatencyMs: number | null = null;
      try {
        const admin = getSupabaseAdmin();
        const start = Date.now();
        const { error } = await admin.from('users').select('id').limit(1);
        supabaseLatencyMs = Date.now() - start;
        if (!error) {
          supabaseOk = true;
        }
      } catch {
        // swallow errors to avoid leaking internals in health
      }

      const health = {
        status: supabaseOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        checks: {
          supabase: {
            ok: supabaseOk,
            latencyMs: supabaseLatencyMs,
          },
        },
      };

      return NextResponse.json(health, { status: supabaseOk ? 200 : 503 });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }
);
