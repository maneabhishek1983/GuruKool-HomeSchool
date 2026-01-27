'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TeacherQRService, TeacherQRCode } from '@/services/teacher-qr.service';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TeacherQRCodesProps {
  teacherId: string;
  parentId: string;
}

interface QRCodeWithDetails extends TeacherQRCode {
  students?: {
    name: string;
    age: number;
    grade: string;
  };
}

export default function TeacherQRCodes({
  teacherId,
  parentId,
}: TeacherQRCodesProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQRCode, setSelectedQRCode] =
    useState<QRCodeWithDetails | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [sessionNotification, setSessionNotification] = useState<{
    type: 'check_in' | 'check_out' | 'active';
    message: string;
  } | null>(null);

  // Check for existing active session when modal opens
  useEffect(() => {
    if (!showQRModal || !selectedQRCode) {
      return;
    }

    const checkActiveSession = async () => {
      try {
        // Query for active session (checked in but not checked out) for this QR code
        const { data: activeSession } = await supabase
          .from('teacher_sessions')
          .select('id, session_start, teacher_id')
          .eq('qr_code_used', selectedQRCode.id)
          .is('session_end', null)
          .order('session_start', { ascending: false })
          .limit(1)
          .single();

        if (activeSession) {
          setSessionNotification({
            type: 'active',
            message: 'Teacher is currently checked in!',
          });
        }
      } catch {
        // No active session found, which is fine
        console.log('No active session found for this QR code');
      }
    };

    checkActiveSession();
  }, [showQRModal, selectedQRCode]);

  // Real-time subscription for session updates
  useEffect(() => {
    if (!showQRModal || !selectedQRCode) {
      return;
    }

    // Subscribe to teacher_sessions changes for this QR code
    const channel = supabase
      .channel(`qr-session-${selectedQRCode.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher_sessions',
          filter: `qr_code_used=eq.${selectedQRCode.id}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>
        ) => {
          console.log('Session update received:', payload);

          if (payload.eventType === 'INSERT') {
            // Teacher checked in
            setSessionNotification({
              type: 'check_in',
              message: 'Teacher has checked in! Session started.',
            });
            // Close modal after showing notification
            setTimeout(() => {
              setShowQRModal(false);
              setSessionNotification(null);
            }, 2000);
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as { session_end?: string };
            if (newData.session_end) {
              // Teacher checked out
              setSessionNotification({
                type: 'check_out',
                message: 'Teacher has checked out! Session ended.',
              });
              // Close modal after showing notification
              setTimeout(() => {
                setShowQRModal(false);
                setSessionNotification(null);
              }, 2000);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription when modal closes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [showQRModal, selectedQRCode]);

  useEffect(() => {
    loadQRCodes();
  }, [teacherId]);

  const loadQRCodes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const codes = await TeacherQRService.getTeacherQRCodes(teacherId);
      setQrCodes(codes as QRCodeWithDetails[]);
    } catch (err) {
      console.error('Error loading QR codes:', err);
      setError('Failed to load QR codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQRCode = async (qrCode: QRCodeWithDetails) => {
    try {
      setSelectedQRCode(qrCode);
      setShowQRModal(true);
    } catch (err) {
      console.error('Error generating QR code image:', err);
      setError('Failed to generate QR code image');
    }
  };

  const handleRegenerateQRCode = async (qrCodeId: string) => {
    try {
      const regenerated = await TeacherQRService.regenerateQRCode(qrCodeId);
      if (regenerated) {
        await loadQRCodes(); // Reload the list
        setError(null);
      } else {
        setError('Failed to regenerate QR code');
      }
    } catch (err) {
      console.error('Error regenerating QR code:', err);
      setError('Failed to regenerate QR code');
    }
  };

  const handleDeactivateQRCode = async (qrCodeId: string) => {
    if (
      window.confirm(
        'Are you sure you want to deactivate this QR code? This action cannot be undone.'
      )
    ) {
      try {
        const success = await TeacherQRService.deactivateQRCode(qrCodeId);
        if (success) {
          await loadQRCodes(); // Reload the list
          setError(null);
        } else {
          setError('Failed to deactivate QR code');
        }
      } catch (err) {
        console.error('Error deactivating QR code:', err);
        setError('Failed to deactivate QR code');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading QR codes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={loadQRCodes}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No QR Codes Available
        </h3>
        <p className="text-gray-600">
          QR codes will be generated when this teacher is assigned to students.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Teacher QR Codes
        </h3>
        <button
          onClick={loadQRCodes}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qrCodes.map(qrCode => (
          <motion.div
            key={qrCode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  Student QR Code
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Used {qrCode.usage_count} times
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Student ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {qrCode.student_id.slice(0, 8)}...
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Last Used</p>
                <p className="text-sm text-gray-900">
                  {qrCode.last_used
                    ? new Date(qrCode.last_used).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewQRCode(qrCode)}
                  className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View QR Code
                </button>
                <button
                  onClick={() => handleRegenerateQRCode(qrCode.id)}
                  className="flex-1 bg-yellow-600 text-white text-sm px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Regenerate
                </button>
              </div>

              <button
                onClick={() => handleDeactivateQRCode(qrCode.id)}
                className="w-full bg-red-600 text-white text-sm px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            {/* Real-time Session Notification */}
            {sessionNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 p-4 rounded-lg ${
                  sessionNotification.type === 'check_in' || sessionNotification.type === 'active'
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-blue-100 border border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`text-3xl ${
                      sessionNotification.type === 'check_in'
                        ? 'animate-bounce'
                        : ''
                    }`}
                  >
                    {sessionNotification.type === 'check_in' || sessionNotification.type === 'active' ? '✅' : '👋'}
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${
                        sessionNotification.type === 'check_in' || sessionNotification.type === 'active'
                          ? 'text-green-800'
                          : 'text-blue-800'
                      }`}
                    >
                      {sessionNotification.message}
                    </p>
                    {sessionNotification.type !== 'active' && (
                      <p className="text-sm text-gray-600">
                        This window will close automatically...
                      </p>
                    )}
                    {sessionNotification.type === 'active' && (
                      <p className="text-sm text-green-600">
                        Session is in progress
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <QRCodeDisplay qrCodeId={selectedQRCode.id} />
              </div>

              {/* Real-time status indicator */}
              {!sessionNotification && (
                <div className="flex items-center justify-center space-x-2 mb-4 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Waiting for teacher to scan...</span>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Student ID:</strong> {selectedQRCode.student_id}
                </p>
                <p>
                  <strong>Usage Count:</strong> {selectedQRCode.usage_count}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(selectedQRCode.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// QR Code Display Component - Uses simple ID format for easier scanning
function QRCodeDisplay({ qrCodeId }: { qrCodeId: string }) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        // Use simple format: GK:{id} - much easier to scan than full JSON
        const simpleCode = `GK:${qrCodeId}`;
        const imageUrl = await TeacherQRService.generateQRCodeImage(simpleCode);
        setQrImageUrl(imageUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [qrCodeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <img
        src={qrImageUrl}
        alt="QR Code"
        className="w-48 h-48"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
