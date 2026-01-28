/**
 * Face Verification Audit Logging Service
 * Logs all face verification attempts for security monitoring and compliance
 *
 * IMPORTANT:
 * - Never log actual face descriptors (sensitive biometric data)
 * - Log all verification attempts regardless of outcome
 * - Include enough context for security investigations
 */

import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Verification result types
 */
export type VerificationResult =
  | 'success'
  | 'failed'
  | 'no_match'
  | 'rate_limited'
  | 'error';

/**
 * Audit entry for a face verification attempt
 */
export interface FaceVerificationAuditEntry {
  teacherId: string;
  studentId: string;
  result: VerificationResult;
  confidence: number;
  distance: number;
  deviceInfo: Record<string, unknown>;
  ipAddress: string;
  /** Optional error message for failed attempts */
  errorMessage?: string;
  /** Optional request ID for tracing */
  requestId?: string;
}

/**
 * Log a face verification attempt to the audit table
 *
 * @param entry - Audit entry details
 * @throws Error if logging fails (should be caught and not block verification)
 *
 * @example
 * await logFaceVerificationAttempt({
 *   teacherId: teacher.id,
 *   studentId: student.id,
 *   result: 'success',
 *   confidence: 0.85,
 *   distance: 0.15,
 *   deviceInfo: getDeviceInfo(request),
 *   ipAddress: getClientIP(request),
 * });
 */
export async function logFaceVerificationAttempt(
  entry: FaceVerificationAuditEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getSupabaseAdmin();

    const { error } = await adminClient.from('face_verification_audit').insert({
      teacher_id: entry.teacherId,
      student_id: entry.studentId,
      verification_result: entry.result,
      confidence_score: entry.confidence,
      distance: entry.distance,
      device_info: {
        ...entry.deviceInfo,
        requestId: entry.requestId,
        errorMessage: entry.errorMessage,
      },
      ip_address: entry.ipAddress,
    });

    if (error) {
      console.error('[FaceAudit] Failed to log verification attempt:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[FaceAudit] Exception logging verification attempt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Query verification audit logs for a specific teacher
 *
 * @param teacherId - Teacher ID to query
 * @param limit - Maximum number of results (default 100)
 * @param offset - Offset for pagination (default 0)
 */
export async function getTeacherVerificationHistory(
  teacherId: string,
  limit = 100,
  offset = 0
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    student_id: string;
    verification_result: VerificationResult;
    confidence_score: number;
    distance: number;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const adminClient = getSupabaseAdmin();

    const { data, error } = await adminClient
      .from('face_verification_audit')
      .select(
        'id, student_id, verification_result, confidence_score, distance, created_at'
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    // Type assertion since Supabase returns unknown types
    const typedData = (data || []).map(row => ({
      id: String(row.id),
      student_id: String(row.student_id),
      verification_result: row.verification_result as VerificationResult,
      confidence_score: Number(row.confidence_score),
      distance: Number(row.distance),
      created_at: String(row.created_at),
    }));

    return { success: true, data: typedData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get verification statistics for security monitoring
 *
 * @param hours - Number of hours to look back (default 24)
 */
export async function getVerificationStats(hours = 24): Promise<{
  success: boolean;
  data?: {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    rateLimitedAttempts: number;
    uniqueTeachers: number;
    uniqueStudents: number;
  };
  error?: string;
}> {
  try {
    const adminClient = getSupabaseAdmin();
    const cutoffTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await adminClient
      .from('face_verification_audit')
      .select('verification_result, teacher_id, student_id')
      .gte('created_at', cutoffTime);

    if (error) {
      return { success: false, error: error.message };
    }

    const stats = {
      totalAttempts: data?.length || 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      rateLimitedAttempts: 0,
      uniqueTeachers: new Set<string>(),
      uniqueStudents: new Set<string>(),
    };

    for (const row of data || []) {
      const result = row.verification_result as string;
      const teacherId = String(row.teacher_id);
      const studentId = String(row.student_id);

      if (result === 'success') {
        stats.successfulAttempts++;
      } else if (result === 'failed' || result === 'no_match') {
        stats.failedAttempts++;
      } else if (result === 'rate_limited') {
        stats.rateLimitedAttempts++;
      }
      stats.uniqueTeachers.add(teacherId);
      stats.uniqueStudents.add(studentId);
    }

    return {
      success: true,
      data: {
        totalAttempts: stats.totalAttempts,
        successfulAttempts: stats.successfulAttempts,
        failedAttempts: stats.failedAttempts,
        rateLimitedAttempts: stats.rateLimitedAttempts,
        uniqueTeachers: stats.uniqueTeachers.size,
        uniqueStudents: stats.uniqueStudents.size,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect potential security anomalies
 *
 * @param hours - Number of hours to look back (default 1)
 * @returns List of suspicious patterns
 */
export async function detectSecurityAnomalies(hours = 1): Promise<{
  success: boolean;
  anomalies?: Array<{
    type: 'high_failure_rate' | 'rate_limit_abuse' | 'unusual_volume';
    teacherId: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  error?: string;
}> {
  try {
    const adminClient = getSupabaseAdmin();
    const cutoffTime = new Date(
      Date.now() - hours * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await adminClient
      .from('face_verification_audit')
      .select('teacher_id, verification_result')
      .gte('created_at', cutoffTime);

    if (error) {
      return { success: false, error: error.message };
    }

    // Group by teacher
    const teacherStats = new Map<
      string,
      { total: number; failed: number; rateLimited: number }
    >();

    for (const row of data || []) {
      const teacherId = String(row.teacher_id);
      const result = row.verification_result as string;

      const stats = teacherStats.get(teacherId) || {
        total: 0,
        failed: 0,
        rateLimited: 0,
      };
      stats.total++;
      if (result === 'failed' || result === 'no_match') {
        stats.failed++;
      }
      if (result === 'rate_limited') {
        stats.rateLimited++;
      }
      teacherStats.set(teacherId, stats);
    }

    const anomalies: Array<{
      type: 'high_failure_rate' | 'rate_limit_abuse' | 'unusual_volume';
      teacherId: string;
      details: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const [teacherId, stats] of teacherStats) {
      // High failure rate (> 70% failures with at least 5 attempts)
      if (stats.total >= 5 && stats.failed / stats.total > 0.7) {
        anomalies.push({
          type: 'high_failure_rate',
          teacherId,
          details: `${stats.failed}/${stats.total} failed attempts (${Math.round((stats.failed / stats.total) * 100)}%)`,
          severity: stats.failed > 20 ? 'high' : 'medium',
        });
      }

      // Rate limit abuse (more than 3 rate-limited attempts)
      if (stats.rateLimited > 3) {
        anomalies.push({
          type: 'rate_limit_abuse',
          teacherId,
          details: `${stats.rateLimited} rate-limited attempts`,
          severity: stats.rateLimited > 10 ? 'high' : 'medium',
        });
      }

      // Unusual volume (more than 50 attempts per hour)
      if (stats.total > 50) {
        anomalies.push({
          type: 'unusual_volume',
          teacherId,
          details: `${stats.total} verification attempts in ${hours} hour(s)`,
          severity: stats.total > 100 ? 'high' : 'low',
        });
      }
    }

    return { success: true, anomalies };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
