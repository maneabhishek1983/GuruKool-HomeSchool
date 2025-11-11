'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  timesheetService,
  ParentQRCode,
  TimesheetEntry,
} from '@/services/timesheet.service';
import { useAuthContext } from '@/lib/authContext';

interface TimesheetQRCodeProps {
  studentId: string;
  studentName?: string;
}

export function TimesheetQRCode({
  studentId,
  studentName,
}: TimesheetQRCodeProps) {
  const { user } = useAuthContext();
  const [qrCode, setQrCode] = useState<ParentQRCode | null>(null);
  const [recentEntries, setRecentEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadQRCode();
      loadRecentEntries();

      // Refresh recent entries every 30 seconds
      const interval = setInterval(loadRecentEntries, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [user, studentId]);

  const loadQRCode = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get existing QR codes
      const codes = await timesheetService.getParentQRCodes(user.id);
      const existingCode = codes.find(c => c.student_id === studentId);

      if (existingCode) {
        setQrCode(existingCode);
      } else {
        // Generate new QR code
        const newCode = await timesheetService.generateParentQRCode(
          user.id,
          studentId
        );
        setQrCode(newCode);
      }
    } catch (err) {
      setError('Failed to load QR code');
      console.error('Error loading QR code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentEntries = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const entries = await timesheetService.getParentTimesheet(user.id);
      const studentEntries = entries
        .filter(e => e.student_id === studentId)
        .slice(0, 5);
      setRecentEntries(studentEntries);
    } catch (err) {
      console.error('Error loading recent entries:', err);
    }
  };

  const handleRefreshQRCode = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setIsRefreshing(true);
      const newCode = await timesheetService.regenerateParentQRCode(
        user.id,
        studentId
      );
      setQrCode(newCode);
    } catch (err) {
      setError('Failed to refresh QR code');
      console.error('Error refreshing QR code:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes) {
      return '0h 0m';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-1">
              Teacher Check-In QR Code
            </h3>
            {studentName && (
              <p className="text-sm text-neutral-600">For {studentName}</p>
            )}
          </div>

          {error && (
            <div className="bg-error-50 border border-error-200 rounded-xl p-3">
              <p className="text-error-700 text-sm">{error}</p>
            </div>
          )}

          {qrCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* QR Code Image */}
              <div className="relative inline-block">
                <div className="p-4 bg-white rounded-2xl border-4 border-primary-200">
                  <img
                    src={qrCode.qr_code_image}
                    alt="Teacher Check-In QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>

                {/* Active Indicator */}
                <div className="absolute -top-2 -right-2 bg-success-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Active
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-left">
                <h4 className="font-semibold text-primary-800 mb-2">
                  📱 How to use:
                </h4>
                <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
                  <li>Show this QR code to your teacher</li>
                  <li>Teacher scans with their device</li>
                  <li>Teacher selects Check-In or Check-Out</li>
                  <li>Time is automatically recorded</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleRefreshQRCode}
                  disabled={isRefreshing}
                  className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 text-neutral-700 font-medium rounded-xl transition-colors text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isRefreshing ? 'Refreshing...' : '🔄 Refresh QR Code'}
                </motion.button>

                <motion.button
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🖨️ Print QR Code
                </motion.button>
              </div>

              {/* Expiry Info */}
              {qrCode.expires_at && (
                <p className="text-xs text-neutral-500">
                  Valid until {new Date(qrCode.expires_at).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <h4 className="text-lg font-bold text-neutral-900 mb-4">
          Recent Check-Ins/Outs
        </h4>

        {recentEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-neutral-600">No activity yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              Check-ins will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      entry.status === 'checked_in'
                        ? 'bg-success-500 animate-pulse'
                        : 'bg-neutral-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {entry.status === 'checked_in'
                        ? 'Checked In'
                        : 'Checked Out'}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {new Date(entry.check_in_time).toLocaleString()}
                    </p>
                  </div>
                </div>

                {entry.status === 'checked_out' && entry.duration_minutes && (
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">
                      {formatDuration(entry.duration_minutes)}
                    </p>
                    <p className="text-xs text-neutral-500">Duration</p>
                  </div>
                )}

                {entry.status === 'checked_in' && (
                  <div className="text-right">
                    <p className="font-semibold text-success-600">
                      In Progress
                    </p>
                    <p className="text-xs text-neutral-500">Active now</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Benefits:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Automatic time tracking for accurate billing</li>
          <li>• No manual entry required</li>
          <li>• Real-time session monitoring</li>
          <li>• Secure and verified check-ins</li>
          <li>• Complete timesheet history</li>
        </ul>
      </div>
    </div>
  );
}
