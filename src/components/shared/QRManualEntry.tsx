'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * QRManualEntry - Manual QR code entry component (fallback)
 *
 * This component provides a manual text entry interface for QR codes
 * when camera scanning is not available or fails. It does NOT perform
 * actual QR code scanning - use QRScanner from shared/ for real scanning.
 *
 * @component
 * @example
 * <QRManualEntry
 *   onScan={(data) => handleQRData(data)}
 *   onClose={() => setModalOpen(false)}
 *   isOpen={isModalOpen}
 * />
 */

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {!useManualEntry ? (
            <>
              {/* Camera Scanner Placeholder */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg aspect-square flex items-center justify-center mb-6 relative overflow-hidden">
                {/* Scanning Animation */}
                <motion.div
                  className="absolute inset-0 border-4 border-white/30 rounded-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="text-center text-white z-10">
                  <svg
                    className="w-24 h-24 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="text-lg font-medium">Camera QR Scanner</p>
                  <p className="text-sm text-white/80 mt-2">
                    Position QR code within the frame
                  </p>
                </div>
              </div>

              {scanError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{scanError}</p>
                </div>
              )}

              {/* Manual Entry Option */}
              <div className="text-center">
                <button
                  onClick={() => setUseManualEntry(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Enter code manually
                </button>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How to use:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Point your camera at the QR code</li>
                      <li>• Hold steady until it scans</li>
                      <li>• Or click "Enter code manually" below</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manual Entry Form */}
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="qr-code"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Enter QR Code
                  </label>
                  <input
                    id="qr-code"
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the QR code value"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter the code from the teacher's QR code sheet
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Submit Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseManualEntry(false)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                  >
                    Back to Scanner
                  </button>
                </div>
              </form>

              {/* Info */}
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs text-amber-800">
                    Make sure to enter the exact code as shown on the QR sheet.
                    The code is case-sensitive.
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default QRScanner;
