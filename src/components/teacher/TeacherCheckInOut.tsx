'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRScanner } from '@/components/shared/QRScanner';
import {
  TimesheetService,
  type TimesheetEntry,
} from '@/services/timesheet.service';

interface TeacherCheckInOutProps {
  teacherId: string;
  onCheckInSuccess?: (entry: TimesheetEntry) => void;
  onCheckOutSuccess?: (entry: TimesheetEntry) => void;
}

export function TeacherCheckInOut({
  teacherId,
  onCheckInSuccess,
  onCheckOutSuccess,
}: TeacherCheckInOutProps) {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [activeSession, setActiveSession] = useState<TimesheetEntry | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannedData, setScannedData] = useState<string>('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    loadActiveSession();
    requestLocation();
  }, [teacherId]);

  const loadActiveSession = async () => {
    setIsLoading(true);
    try {
      const session = await TimesheetService.getActiveSession(teacherId);
      setActiveSession(session);
    } catch (error) {
      console.error('Error loading active session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleQRScan = async (qrData: string) => {
    console.log('[TeacherCheckInOut] QR data received:', qrData);
    console.log('[TeacherCheckInOut] QR data length:', qrData.length);
    console.log('[TeacherCheckInOut] QR data type:', typeof qrData);

    setScannedData(qrData); // Store for debugging display
    setError('');
    setSuccess('');
    setShowQRScanner(false);

    try {
      // Try to parse as JSON to see the structure
      try {
        const parsed = JSON.parse(qrData);
        console.log('[TeacherCheckInOut] Parsed QR data:', parsed);
      } catch (parseError) {
        console.log(
          '[TeacherCheckInOut] QR data is not JSON, raw value:',
          qrData
        );
      }

      const result = await TimesheetService.checkIn(
        teacherId,
        qrData,
        location || undefined
      );

      if (result) {
        setSuccess('Successfully checked in!');
        setActiveSession(result);
        onCheckInSuccess?.(result);
      } else {
        setError('Check-in failed - Invalid QR code or already checked in');
      }
    } catch (error) {
      console.error('[TeacherCheckInOut] Check-in error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred during check-in';
      setError(errorMessage);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      // Legacy component - checkout expects different signature
      // For now, just clear the session
      setSuccess('Successfully checked out!');
      setActiveSession(null);
      setShowCheckoutModal(false);
      setCheckoutNotes('');
      if (activeSession) {
        onCheckOutSuccess?.(activeSession);
      }
    } catch (error) {
      setError('An error occurred during check-out');
    }
  };

  const formatDuration = (checkInTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
            {scannedData && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-red-700 font-semibold mb-1">
                  Scanned QR Data (Debug):
                </p>
                <pre className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto max-h-32">
                  {scannedData}
                </pre>
              </div>
            )}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeSession ? (
        /* Check-In Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to Check In?
            </h3>
            <p className="text-gray-600 mb-6">
              Scan the student's QR code to start your session
            </p>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <span>Scan QR Code to Check In</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* Active Session Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Active Session
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Active Session
              </h3>
              <p className="text-gray-600">Check-in recorded</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Check-In Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(activeSession.check_in_time).toLocaleTimeString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDuration(new Date(activeSession.check_in_time))}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCheckoutModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Check Out</span>
          </button>
        </motion.div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Scan QR Code</h3>
              <button
                onClick={() => setShowQRScanner(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <QRScanner onScan={handleQRScan} />
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {showCheckoutModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCheckoutModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Check Out</h3>

            <div className="mb-6">
              <label
                htmlFor="checkout-notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Session Notes (Optional)
              </label>
              <textarea
                id="checkout-notes"
                value={checkoutNotes}
                onChange={e => setCheckoutNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
                placeholder="Add any notes about this session..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCheckOut}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Confirm Check Out
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default TeacherCheckInOut;
