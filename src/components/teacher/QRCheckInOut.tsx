'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timesheetService, TimesheetEntry } from '@/services/timesheet.service';
import { useAuthContext } from '@/lib/authContext';
import { QRScanner } from '@/components/shared/QRScanner';

interface QRCheckInOutProps {
  onSuccess?: (entry: TimesheetEntry) => void;
  onError?: (error: string) => void;
}

export function QRCheckInOut({ onSuccess, onError }: QRCheckInOutProps) {
  const { user } = useAuthContext();
  const [step, setStep] = useState<
    'scan' | 'select_action' | 'processing' | 'success'
  >('scan');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [action, setAction] = useState<'check_in' | 'check_out' | null>(null);
  const [activeCheckIn, setActiveCheckIn] = useState<TimesheetEntry | null>(
    null
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Check for active check-in on mount
  useEffect(() => {
    if (user?.id) {
      checkActiveCheckIn();
    }
  }, [user]);

  const checkActiveCheckIn = async () => {
    if (!user?.id) {
      return;
    }

    try {
      // Use API endpoint to bypass RLS and get active session
      const response = await fetch(`/api/teacher-sessions/active?userId=${user.id}`);
      const data = await response.json();

      if (data.activeSession) {
        setActiveCheckIn(data.activeSession);
      } else {
        setActiveCheckIn(null);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      setActiveCheckIn(null);
    }
  };

  const handleQRScan = async (data: string) => {
    setScannedData(data);
    setError(null);

    // Check for new simple format: GK:{uuid}
    if (data.startsWith('GK:')) {
      // Valid simple format, refresh active session state and proceed
      await checkActiveCheckIn();
      setStep('select_action');
      return;
    }

    // Try legacy JSON format
    try {
      const parsedData = JSON.parse(data);

      // Check if it's the TeacherQRService format
      if (parsedData.type === 'teacher_auth') {
        // Valid format, refresh active session state and proceed
        await checkActiveCheckIn();
        setStep('select_action');
        return;
      }

      // Fall back to timesheet service validation for backward compatibility
      const qrData = timesheetService.validateQRCode(data);
      if (!qrData) {
        setError(
          'Invalid QR code. Please scan a valid teacher or parent QR code.'
        );
        return;
      }

      await checkActiveCheckIn();
      setStep('select_action');
    } catch (err) {
      setError('Invalid QR code format. Please scan a valid QR code.');
    }
  };

  const handleActionSelect = async (
    selectedAction: 'check_in' | 'check_out'
  ) => {
    if (!scannedData || !user?.id) {
      return;
    }

    setAction(selectedAction);
    setIsProcessing(true);
    setStep('processing');

    try {
      let result: TimesheetEntry | null = null;

      // Check if it's the new simple format (GK:{id}) or legacy JSON format
      const isSimpleFormat = scannedData.startsWith('GK:');
      const isTeacherAuthFormat = !isSimpleFormat && (() => {
        try {
          const parsed = JSON.parse(scannedData);
          return parsed.type === 'teacher_auth';
        } catch {
          return false;
        }
      })();

      // Use TeacherQRService API for both simple format and teacher_auth type
      if (isSimpleFormat || isTeacherAuthFormat) {
        // Call new API endpoint
        const response = await fetch('/api/teacher-sessions/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qrData: scannedData,
            sessionType: selectedAction === 'check_in' ? 'sign_in' : 'sign_out',
            notes: notes || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to process QR code');
        }

        // Convert to TimesheetEntry format for compatibility
        result = {
          id: data.session.id,
          teacher_id: data.session.teacher_id,
          student_id: data.session.student_id,
          parent_id: data.session.parent_id,
          check_in_time: data.session.session_start,
          check_out_time: data.session.session_end,
          duration_minutes: data.session.duration_minutes,
          location: data.session.location,
          notes: data.session.notes,
          qr_code_id: data.session.qr_code_used || '',
          status: selectedAction === 'check_in' ? 'checked_in' : 'checked_out',
          created_at: data.session.created_at,
          updated_at: data.session.updated_at,
        };
      } else {
        // Fall back to timesheet service for other formats
        if (selectedAction === 'check_in') {
          result = await timesheetService.checkIn(user.id, scannedData);
        } else {
          result = await timesheetService.checkOut(user.id, scannedData, notes);
        }
      }

      if (!result) {
        throw new Error('Failed to process action');
      }

      setStep('success');
      onSuccess?.(result);

      // Refresh active check-in status
      await checkActiveCheckIn();

      // Reset after 3 seconds
      setTimeout(() => {
        resetFlow();
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      setStep('scan');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setStep('scan');
    setScannedData(null);
    setAction(null);
    setNotes('');
    setError(null);
    setShowManualInput(false);
    setManualCode('');
  };

  // Mock QR scan function removed for production security

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Teacher Check-In/Out
        </h2>
        <p className="text-neutral-600">
          Scan parent's QR code to check in or check out
        </p>
      </div>

      {/* Active Check-In Status */}
      {activeCheckIn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <h3 className="font-semibold text-green-800">
                Currently Checked In
              </h3>
              <p className="text-sm text-green-600">
                Since{' '}
                {new Date(activeCheckIn.check_in_time).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error-50 border border-error-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-error-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-error-500 hover:text-error-700"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Scan QR Code */}
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              {!showScanner && !showManualInput ? (
                <>
                  <div className="w-64 h-64 mx-auto bg-neutral-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📱</div>
                      <p className="text-neutral-600">Ready to scan QR code</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setShowScanner(true)}
                      className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                    >
                      📷 Open Camera Scanner
                    </button>

                    <button
                      onClick={() => setShowManualInput(true)}
                      className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
                    >
                      📝 Enter Code Manually
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500">
                    Ask the parent to show their QR code, or have them copy the code for you
                  </p>
                </>
              ) : showScanner ? (
                <>
                  <div className="space-y-4">
                    <QRScanner
                      onScan={data => {
                        handleQRScan(data);
                        setShowScanner(false);
                      }}
                      onError={err => {
                        setError(err);
                        setShowScanner(false);
                      }}
                      width={400}
                      qrbox={250}
                      fps={10}
                    />

                    <button
                      onClick={() => setShowScanner(false)}
                      className="w-full px-6 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors text-sm"
                    >
                      ← Cancel Scanning
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500">
                    Position the QR code within the camera frame
                  </p>
                </>
              ) : (
                /* Manual Code Entry Form */
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">📝</div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Enter Code Manually
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Paste the code from the parent's QR code screen
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      QR Code Data:
                    </label>
                    <textarea
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                      rows={4}
                      placeholder='Paste the code here (starts with {"type":"teacher_auth"...})'
                      autoFocus
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        if (manualCode.trim()) {
                          handleQRScan(manualCode.trim());
                          setManualCode('');
                          setShowManualInput(false);
                        }
                      }}
                      disabled={!manualCode.trim()}
                      className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 text-white font-medium rounded-xl transition-colors"
                    >
                      Submit Code
                    </button>
                    <button
                      onClick={() => {
                        setShowManualInput(false);
                        setManualCode('');
                      }}
                      className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-700">
                      <strong>Tip:</strong> Ask the parent to click "Copy Code for Teacher" on their QR code screen, then paste it here.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Action */}
          {step === 'select_action' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  QR Code Scanned Successfully
                </h3>
                <p className="text-neutral-600">What would you like to do?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => handleActionSelect('check_in')}
                  disabled={!!activeCheckIn}
                  className="p-6 bg-success-50 hover:bg-success-100 disabled:bg-neutral-100 disabled:cursor-not-allowed border-2 border-success-200 disabled:border-neutral-200 rounded-xl transition-colors"
                  whileHover={{ scale: activeCheckIn ? 1 : 1.02 }}
                  whileTap={{ scale: activeCheckIn ? 1 : 0.98 }}
                >
                  <div className="text-4xl mb-2">🟢</div>
                  <h4 className="font-semibold text-success-800 mb-1">
                    Check In
                  </h4>
                  <p className="text-xs text-success-600">Start your session</p>
                  {activeCheckIn && (
                    <p className="text-xs text-error-600 mt-2">
                      Already checked in
                    </p>
                  )}
                </motion.button>

                <motion.button
                  onClick={() => handleActionSelect('check_out')}
                  disabled={!activeCheckIn}
                  className="p-6 bg-error-50 hover:bg-error-100 disabled:bg-neutral-100 disabled:cursor-not-allowed border-2 border-error-200 disabled:border-neutral-200 rounded-xl transition-colors"
                  whileHover={{ scale: activeCheckIn ? 1.02 : 1 }}
                  whileTap={{ scale: activeCheckIn ? 0.98 : 1 }}
                >
                  <div className="text-4xl mb-2">🔴</div>
                  <h4 className="font-semibold text-error-800 mb-1">
                    Check Out
                  </h4>
                  <p className="text-xs text-error-600">End your session</p>
                  {!activeCheckIn && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Not checked in
                    </p>
                  )}
                </motion.button>
              </div>

              {action === 'check_out' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-neutral-700">
                    Session Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add any notes about this session..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </motion.div>
              )}

              <button
                onClick={resetFlow}
                className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 py-12"
            >
              <motion.div
                className="w-16 h-16 mx-auto border-4 border-primary-600 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Processing {action === 'check_in' ? 'Check-In' : 'Check-Out'}
                  ...
                </h3>
                <p className="text-neutral-600">
                  Recording timestamp and updating timesheet
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto bg-success-100 rounded-full flex items-center justify-center"
              >
                <span className="text-5xl">✓</span>
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-success-800 mb-2">
                  {action === 'check_in' ? 'Checked In!' : 'Checked Out!'}
                </h3>
                <p className="text-neutral-600">
                  {action === 'check_in'
                    ? 'Your session has started. Time is being tracked.'
                    : 'Your session has ended. Time has been recorded.'}
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h4 className="font-semibold text-primary-800 mb-2">How it works:</h4>
        <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
          <li>Parent displays QR code in their portal</li>
          <li>Teacher scans QR code with camera</li>
          <li>Teacher selects Check-In or Check-Out</li>
          <li>Time is automatically recorded for timesheet</li>
        </ol>
      </div>
    </div>
  );
}
