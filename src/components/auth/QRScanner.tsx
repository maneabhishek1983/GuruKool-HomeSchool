'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  isActive?: boolean;
  onScanComplete?: (data: string) => void;
  className?: string;
}

export function QRScanner({ isActive = false, onScanComplete, className = '' }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (isActive && !isScanning) {
      startScan();
    }
  }, [isActive, isScanning, startScan]);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          onScanComplete?.('scanned-qr-data');
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  }, [onScanComplete]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden"
          >
            {/* Camera viewfinder effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900">
              <div className="absolute inset-4 border-2 border-primary-400 rounded-xl">
                {/* Scanning line animation */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-primary-400 shadow-lg shadow-primary-400/50"
                      initial={{ top: 0, opacity: 0 }}
                      animate={{ 
                        top: '100%', 
                        opacity: [0, 1, 1, 0],
                        transition: { 
                          duration: 2, 
                          repeat: Infinity, 
                          ease: 'linear' 
                        }
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-400" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-400" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-400" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-400" />

                {/* Center target */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="w-16 h-16 border-2 border-primary-400 rounded-lg"
                    animate={{
                      scale: isScanning ? [1, 1.1, 1] : 1,
                      opacity: isScanning ? [0.5, 1, 0.5] : 0.7,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: isScanning ? Infinity : 0,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            {isScanning && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-50 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-neutral-700 rounded-full h-1">
                      <motion.div
                        className="bg-primary-400 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <span className="text-white text-xs font-medium">
                      {Math.round(scanProgress)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status text */}
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-black bg-opacity-50 rounded-lg p-2 text-center">
                <span className="text-white text-sm font-medium">
                  {isScanning ? 'Scanning QR Code...' : 'Position QR code in frame'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Mobile QR Scanner Simulation Component
 */
interface MobileQRScannerProps {
  onScan?: (data: string) => void;
  className?: string;
}

export function MobileQRScanner({ onScan, className = '' }: MobileQRScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestCameraPermission = async () => {
    try {
      // Simulate camera permission request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasPermission(true);
      setIsActive(true);
    } catch (error) {
      setHasPermission(false);
    }
  };

  const handleScanComplete = (data: string) => {
    setIsActive(false);
    onScan?.(data);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {hasPermission === null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 mb-2">
              Scan QR Code
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Use your device camera to scan the QR code for quick authentication
            </p>
            <motion.button
              onClick={requestCameraPermission}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Open Camera
            </motion.button>
          </div>
        </motion.div>
      )}

      {hasPermission === false && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 p-6 bg-error-50 border border-error-200 rounded-2xl"
        >
          <div className="w-16 h-16 mx-auto bg-error-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <div>
            <h3 className="font-semibold text-error-800 mb-2">
              Camera Access Denied
            </h3>
            <p className="text-sm text-error-600 mb-4">
              Please enable camera permissions to scan QR codes
            </p>
            <motion.button
              onClick={() => setHasPermission(null)}
              className="px-4 py-2 bg-error-600 hover:bg-error-700 text-white font-medium rounded-lg transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try Again
            </motion.button>
          </div>
        </motion.div>
      )}

      {hasPermission === true && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <QRScanner
            isActive={isActive}
            onScanComplete={handleScanComplete}
            className="mx-auto"
          />
          
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-600">
              Point your camera at the QR code
            </p>
            <motion.button
              onClick={() => setIsActive(false)}
              className="text-sm text-neutral-500 hover:text-neutral-700 underline"
              whileHover={{ scale: 1.05 }}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}