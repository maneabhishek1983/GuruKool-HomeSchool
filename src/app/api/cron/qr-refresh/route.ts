import '@/lib/server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/qr-refresh
 *
 * Scheduled endpoint for automatic QR code refresh
 * Triggered by Vercel Cron or external scheduler
 *
 * Security: Requires CRON_SECRET header for authorization
 *
 * Schedule recommendation: Daily at 2:00 AM UTC
 * vercel.json config:
 * {
 *   "crons": [{
 *     "path": "/api/cron/qr-refresh",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find QR codes expiring within the next 24 hours
    // QR codes have qr_code_data that contains expiresAt timestamp
    const { data: qrCodes, error } = await supabase
      .from('teacher_qr_codes')
      .select(
        'id, teacher_id, student_id, parent_id, qr_code_data, created_at, updated_at'
      )
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching QR codes:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Filter codes that are expiring soon (within 24 hours)
    const now = Date.now();
    const refreshWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const expiringQRCodes = (qrCodes || []).filter(qr => {
      try {
        const qrData = JSON.parse(qr.qr_code_data);
        const expiresAt = qrData.expiresAt;

        // Check if expires within the refresh window
        if (expiresAt && expiresAt - now <= refreshWindow) {
          return true;
        }

        // Also refresh codes older than 20 hours (to ensure freshness)
        const updatedAt = new Date(qr.updated_at).getTime();
        const codeAge = now - updatedAt;
        return codeAge >= 20 * 60 * 60 * 1000; // 20 hours
      } catch {
        // If QR data is invalid, refresh it
        return true;
      }
    });

    console.log(
      `Found ${expiringQRCodes.length} QR codes to refresh out of ${qrCodes?.length || 0} total`
    );

    if (expiringQRCodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No QR codes need refresh',
        processed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Process each expiring QR code
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const qrCode of expiringQRCodes) {
      try {
        // Generate new QR data using server-side API
        const qrSecret = process.env.QR_SECRET;
        if (!qrSecret || qrSecret.length < 32) {
          throw new Error('QR_SECRET not configured');
        }

        // Generate new signature
        const signature = await generateSignature(
          qrCode.teacher_id,
          qrCode.student_id,
          qrCode.parent_id,
          qrSecret
        );

        // Create new QR code data with fresh expiration
        const newQRData = {
          type: 'teacher_auth',
          teacherId: qrCode.teacher_id,
          studentId: qrCode.student_id,
          parentId: qrCode.parent_id,
          timestamp: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          signature,
        };

        // Update the QR code in database
        const { error: updateError } = await supabase
          .from('teacher_qr_codes')
          .update({
            qr_code_data: JSON.stringify(newQRData),
            updated_at: new Date().toISOString(),
          })
          .eq('id', qrCode.id);

        if (updateError) {
          throw updateError;
        }

        results.successful++;
      } catch (err) {
        results.failed++;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`${qrCode.id}: ${errorMsg}`);
        console.error(`Failed to refresh QR code ${qrCode.id}:`, errorMsg);
      }
    }

    // Log results
    console.log(
      `QR refresh completed: ${results.successful} successful, ${results.failed} failed`
    );

    // Note: AI Agent notification removed for simplicity
    // The Task Automation Agent can be triggered separately if needed

    return NextResponse.json({
      success: true,
      message: `Refreshed ${results.successful} QR codes`,
      processed: expiringQRCodes.length,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit errors in response
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('QR refresh cron error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate HMAC-SHA256 signature for QR code validation
 */
async function generateSignature(
  teacherId: string,
  studentId: string,
  parentId: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${teacherId}-${studentId}-${parentId}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...signatureArray)).slice(0, 32);
}
