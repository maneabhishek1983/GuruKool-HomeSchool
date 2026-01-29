/**
 * FaceCheckIn Component
 * Teacher check-in interface with face recognition and QR code fallback
 *
 * Primary: Face Recognition (server-side verification)
 * Fallback: QR Code scanning (always available)
 *
 * SECURITY NOTES:
 * - Face verification is performed SERVER-SIDE
 * - Never trust client-provided confidence scores
 * - QR code is always available as fallback
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/authContext';
import { FaceScanner } from '@/components/shared/FaceScanner';
import { QRScanner } from '@/components/shared/QRScanner';
import type { FaceDetectionResult, FaceVerifyResponse } from '@/types';

type VerificationMethod = 'face' | 'qr';
type CheckInStep =
  | 'select_method'
  | 'select_student'
  | 'scanning'
  | 'verifying'
  | 'result'
  | 'processing'
  | 'success'
  | 'error';

interface Student {
  id: string;
  name: string;
  grade: string;
  hasFaceEnrolled: boolean;
  hasActiveSession: boolean;
}

interface FaceCheckInProps {
  onSuccess?: (sessionId: string, action: 'check_in' | 'check_out') => void;
  onError?: (error: string) => void;
}

/**
 * FaceCheckIn - Face recognition check-in with QR code fallback
 */
export function FaceCheckIn({ onSuccess, onError }: FaceCheckInProps) {
  const { user } = useAuthContext();
  const [method, setMethod] = useState<VerificationMethod>('face');
  const [step, setStep] = useState<CheckInStep>('select_method');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [verifyResult, setVerifyResult] = useState<FaceVerifyResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    studentId: string;
  } | null>(null);

  // Load assigned students
  useEffect(() => {
    if (user?.id) {
      loadStudents();
      checkActiveSession();
    }
  }, [user]);

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/teacher/assigned-students');
      const data = await response.json();

      if (response.ok && data.data?.students) {
        setStudents(data.data.students);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const checkActiveSession = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher-sessions/active?userId=${user.id}`
      );
      const data = await response.json();

      if (data.activeSession) {
        setActiveSession({
          id: data.activeSession.id,
          studentId: data.activeSession.student_id,
        });
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to check active session:', err);
    }
  };

  // Handle face detection
  const handleFaceDetected = useCallback(
    async (result: FaceDetectionResult) => {
      if (!selectedStudent || step !== 'scanning') {
        return;
      }

      setStep('verifying');

      try {
        // Send descriptor to server for verification with timeout for mobile networks
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('/api/teacher-sessions/verify-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: selectedStudent.id,
            capturedDescriptor: result.descriptor,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data: FaceVerifyResponse = await response.json();
        setVerifyResult(data);
        setStep('result');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Face verification failed';
        setError(
          err instanceof DOMException && err.name === 'AbortError'
            ? 'Verification timed out. Please check your connection and try again.'
            : message
        );
        setStep('error');
      }
    },
    [selectedStudent, step]
  );

  // Handle QR scan
  const handleQRScan = async (data: string) => {
    setStep('processing');
    setError(null);

    try {
      const action = activeSession ? 'sign_out' : 'sign_in';

      const response = await fetch('/api/teacher-sessions/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: data,
          sessionType: action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'QR scan failed');
      }

      setStep('success');
      await checkActiveSession();
      onSuccess?.(
        result.session.id,
        action === 'sign_in' ? 'check_in' : 'check_out'
      );

      setTimeout(() => resetFlow(), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QR scan failed');
      setStep('error');
      onError?.(err instanceof Error ? err.message : 'QR scan failed');
    }
  };

  // Handle face check-in/out
  const handleFaceCheckIn = async (action: 'check_in' | 'check_out') => {
    if (!selectedStudent || !verifyResult?.matched) {
      return;
    }

    setStep('processing');

    try {
      const response = await fetch('/api/teacher-sessions/check-in-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          action,
          verificationConfidence: verifyResult.confidence,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Check-in failed');
      }

      setStep('success');
      await checkActiveSession();
      onSuccess?.(data.sessionId, action);

      setTimeout(() => resetFlow(), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
      setStep('error');
      onError?.(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  // Reset flow
  const resetFlow = () => {
    setStep('select_method');
    setSelectedStudent(null);
    setVerifyResult(null);
    setError(null);
  };

  // Switch to QR fallback
  const switchToQRFallback = () => {
    setMethod('qr');
    setStep('scanning');
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Teacher Check-In/Out
        </h2>
        <p className="text-neutral-600">
          Verify student attendance using face recognition or QR code
        </p>
      </div>

      {/* Active Session Banner */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <h3 className="font-semibold text-green-800">
                Active Session in Progress
              </h3>
              <p className="text-sm text-green-600">
                Student:{' '}
                {students.find(s => s.id === activeSession.studentId)?.name ||
                  'Unknown'}
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
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                &#10005;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
        <AnimatePresence mode="wait">
          {/* Step: Select Method */}
          {step === 'select_method' && (
            <motion.div
              key="select_method"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 text-center">
                Choose Verification Method
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Face Recognition Option */}
                <motion.button
                  onClick={() => {
                    setMethod('face');
                    setStep('select_student');
                  }}
                  className="p-6 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl transition-colors text-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-4xl mb-3">&#128100;</div>
                  <h4 className="font-semibold text-purple-800 mb-1">
                    Face Scan
                  </h4>
                  <p className="text-xs text-purple-600">
                    Verify with face recognition
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                    Recommended
                  </span>
                </motion.button>

                {/* QR Code Option (Always Available) */}
                <motion.button
                  onClick={() => {
                    setMethod('qr');
                    setStep('scanning');
                  }}
                  className="p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-colors text-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-4xl mb-3">&#128247;</div>
                  <h4 className="font-semibold text-blue-800 mb-1">QR Code</h4>
                  <p className="text-xs text-blue-600">Scan parent's QR code</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                    Fallback
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step: Select Student (for Face Recognition) */}
          {step === 'select_student' && method === 'face' && (
            <motion.div
              key="select_student"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Select Student
                </h3>
                <button
                  onClick={switchToQRFallback}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Switch to QR Code &#8594;
                </button>
              </div>

              <div className="grid gap-3 max-h-80 overflow-y-auto">
                {students.map(student => (
                  <motion.button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setStep('scanning');
                    }}
                    disabled={!student.hasFaceEnrolled}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      student.hasFaceEnrolled
                        ? 'bg-white hover:bg-neutral-50 border-neutral-200'
                        : 'bg-neutral-100 border-neutral-200 cursor-not-allowed opacity-60'
                    }`}
                    whileHover={student.hasFaceEnrolled ? { scale: 1.01 } : {}}
                    whileTap={student.hasFaceEnrolled ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-neutral-900">
                          {student.name}
                        </h4>
                        <p className="text-sm text-neutral-500">
                          {student.grade}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {student.hasActiveSession && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        )}
                        {student.hasFaceEnrolled ? (
                          <span className="text-green-500">&#10004;</span>
                        ) : (
                          <span className="text-xs text-neutral-400">
                            No face enrolled
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}

                {students.length === 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <p>No assigned students found</p>
                  </div>
                )}
              </div>

              <button
                onClick={resetFlow}
                className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* Step: Scanning (Face) */}
          {step === 'scanning' && method === 'face' && selectedStudent && (
            <motion.div
              key="scanning_face"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Verify: {selectedStudent.name}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Position student's face in frame
                  </p>
                </div>
                <button
                  onClick={switchToQRFallback}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Use QR Instead
                </button>
              </div>

              <FaceScanner
                mode="verify"
                onFaceDetected={handleFaceDetected}
                onError={err => {
                  setError(err.message);
                  setStep('error');
                }}
                minQualityScore={0.6}
                enabled={step === 'scanning'}
              />

              <button
                onClick={() => setStep('select_student')}
                className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Back to Student Selection
              </button>
            </motion.div>
          )}

          {/* Step: Scanning (QR) */}
          {step === 'scanning' && method === 'qr' && (
            <motion.div
              key="scanning_qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Scan QR Code
                </h3>
                <button
                  onClick={() => {
                    setMethod('face');
                    setStep('select_student');
                  }}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  Use Face Scan &#8594;
                </button>
              </div>

              <QRScanner
                onScan={handleQRScan}
                onError={err => {
                  setError(err);
                  setStep('error');
                }}
                width={Math.min(
                  typeof window !== 'undefined' ? window.innerWidth - 48 : 400,
                  400
                )}
                qrbox={Math.min(
                  typeof window !== 'undefined' ? window.innerWidth - 96 : 250,
                  250
                )}
                fps={10}
              />

              <button
                onClick={resetFlow}
                className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Step: Verifying */}
          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Verifying Face...
              </h3>
              <p className="text-neutral-600">
                Checking against enrolled face data
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                Server-side verification in progress
              </p>
            </motion.div>
          )}

          {/* Step: Result */}
          {step === 'result' && verifyResult && selectedStudent && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    verifyResult.matched ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <span className="text-4xl">
                    {verifyResult.matched ? '&#10004;' : '&#10006;'}
                  </span>
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    verifyResult.matched ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {verifyResult.matched
                    ? 'Face Verified!'
                    : 'Face Does Not Match'}
                </h3>
                <p className="text-neutral-600">
                  {Math.round(verifyResult.confidence * 100)}% confidence
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Server Verified
                </span>
              </div>

              {verifyResult.matched ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <h4 className="font-semibold text-green-900">
                      {selectedStudent.name}
                    </h4>
                    <p className="text-sm text-green-700">
                      {selectedStudent.grade}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleFaceCheckIn('check_in')}
                      disabled={selectedStudent.hasActiveSession}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-300 text-white font-medium rounded-xl transition-colors"
                    >
                      Check In
                    </button>
                    <button
                      onClick={() => handleFaceCheckIn('check_out')}
                      disabled={!selectedStudent.hasActiveSession}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white font-medium rounded-xl transition-colors"
                    >
                      Check Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-neutral-600">
                    The captured face does not match the enrolled face for this
                    student.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setStep('scanning')}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={switchToQRFallback}
                      className="w-full px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-xl transition-colors"
                    >
                      Use QR Code Instead
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={resetFlow}
                className="w-full px-6 py-2 text-neutral-600 hover:text-neutral-800 text-sm"
              >
                Start Over
              </button>
            </motion.div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Processing...
              </h3>
              <p className="text-neutral-600">Recording session</p>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <span className="text-5xl">&#10004;</span>
              </motion.div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">
                Success!
              </h3>
              <p className="text-neutral-600">Session recorded successfully</p>
            </motion.div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">&#10006;</span>
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setError(null);
                    setStep(method === 'face' ? 'scanning' : 'select_method');
                  }}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={switchToQRFallback}
                  className="w-full px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-xl transition-colors"
                >
                  Switch to QR Code
                </button>
                <button
                  onClick={resetFlow}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h4 className="font-semibold text-primary-800 mb-2">How it works:</h4>
        <ul className="text-sm text-primary-700 space-y-1">
          <li>
            <strong>Face Scan:</strong> Select student, then verify their face
            via camera
          </li>
          <li>
            <strong>QR Code:</strong> Scan the parent's QR code (always
            available as fallback)
          </li>
          <li>All face verification happens securely on our servers</li>
        </ul>
      </div>
    </div>
  );
}

export default FaceCheckIn;
