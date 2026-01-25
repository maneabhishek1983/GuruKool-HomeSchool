'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  disableFlip?: boolean;
}

export function QRScanner({
  onScan,
  onError,
  width = 400,
  height = 400,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
}: QRScannerProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanAttempts, setScanAttempts] = useState(0);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => [...prev.slice(-4), logMessage]); // Keep last 5 logs
  };

  // Get available cameras on mount
  useEffect(() => {
    addDebugLog('Initializing camera...');

    Html5Qrcode.getCameras()
      .then(devices => {
        addDebugLog(`Found ${devices.length} cameras`);

        if (devices && devices.length) {
          setCameras(devices);
          // Auto-start with back camera on mobile, or first camera
          const backCamera = devices.find(
            device =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('environment')
          );
          const selectedCamera = backCamera || devices[0];

          addDebugLog(`Using: ${selectedCamera?.label || 'Default camera'}`);

          if (selectedCamera?.id) {
            startScanning(selectedCamera.id);
          }
        } else {
          addDebugLog('ERROR: No cameras found');
          setError('No cameras found on this device.');
          onError?.('No cameras found');
        }
      })
      .catch(err => {
        addDebugLog(`ERROR: ${err.message || 'Camera access failed'}`);
        setError('Unable to access cameras. Please check permissions.');
        onError?.('Unable to access cameras');
      });

    return () => {
      if (html5QrCodeRef.current && cameraStarted) {
        html5QrCodeRef.current
          .stop()
          .catch(err => console.error('Error stopping scanner:', err))
          .finally(() => {
            html5QrCodeRef.current = null;
            setCameraStarted(false);
          });
      }
    };
  }, []);

  const startScanning = async (cameraId: string) => {
    try {
      addDebugLog('Starting scanner...');

      // Create Html5Qrcode instance with multiple format support
      html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 15, // Higher FPS for better screen scanning
          qrbox: function (viewfinderWidth, viewfinderHeight) {
            // Make qrbox 80% of the smaller dimension for better detection from screens
            const minEdgePercentage = 0.8;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize,
            };
          },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            // Request autofocus for better screen scanning
            advanced: [
              { focusMode: 'continuous' } as MediaTrackConstraintSet,
            ],
          },
        },
        decodedText => {
          addDebugLog(`✅ QR SCANNED: ${decodedText.substring(0, 50)}...`);
          setError(null);
          onScan(decodedText);

          // Stop scanning after successful scan
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().catch(err => {
              console.error('[QRScanner] Error stopping scanner:', err);
            });
            setCameraStarted(false);
            setIsScanning(false);
          }
        },
        errorMessage => {
          // Track scan attempts for user feedback
          setScanAttempts(prev => prev + 1);
        }
      );

      addDebugLog('✅ Scanner ready - scanning...');
      setCameraStarted(true);
      setIsScanning(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start camera';
      addDebugLog(`❌ ERROR: ${errorMessage}`);

      if (
        errorMessage.includes('NotAllowedError') ||
        errorMessage.includes('Permission')
      ) {
        setError('Camera permission denied. Please allow camera access.');
        onError?.('Camera permission denied');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No camera found on this device.');
        onError?.('No camera found');
      } else if (errorMessage.includes('NotReadableError')) {
        setError('Camera is already in use by another application.');
        onError?.('Camera in use');
      } else {
        setError(
          'Failed to start camera. Please check permissions and try again.'
        );
        onError?.(errorMessage);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      addDebugLog(`Manual entry: ${manualCode.substring(0, 30)}...`);
      onScan(manualCode.trim());
      setManualCode('');
      setShowManualEntry(false);
    }
  };

  return (
    <div className="qr-scanner-wrapper">
      {!showManualEntry ? (
        <>
          <div
            id="qr-scanner-container"
            style={{
              width: '100%',
              maxWidth: `${width}px`,
              margin: '0 auto',
            }}
          />

          {isScanning && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>📱 Position QR code in the camera view</p>
              <p className="text-xs mt-2">
                {scanAttempts > 50
                  ? '⚠️ Having trouble? Try the manual entry option below'
                  : 'Hold steady - scanning from screen may take a moment'}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Debug Log Overlay */}
          {debugLog.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                📋 Scanner Debug Log:
              </p>
              <div className="space-y-1">
                {debugLog.map((log, index) => (
                  <p key={index} className="text-xs text-blue-700 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Manual Entry Fallback Button */}
          {isScanning && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowManualEntry(true)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                📝 Camera not working? Enter code manually
              </button>
            </div>
          )}
        </>
      ) : (
        /* Manual Entry Form */
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📝 Manual Code Entry
          </h3>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste or type the QR code data:
              </label>
              <textarea
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                rows={4}
                placeholder='{"type":"teacher_auth","teacherId":"...","studentId":"...","parentId":"...","timestamp":...,"signature":"..."}'
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Click "Test QR Code Format" on the QR code modal, then copy the JSON data
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Submit Code
              </button>
              <button
                type="button"
                onClick={() => setShowManualEntry(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Back to Camera
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .qr-scanner-wrapper :global(#qr-scanner-container) {
          border-radius: 12px;
          overflow: hidden;
        }

        .qr-scanner-wrapper :global(#qr-scanner-container video) {
          border-radius: 8px;
          width: 100% !important;
          height: auto !important;
        }

        .qr-scanner-wrapper :global(#qr-shaded-region) {
          border-radius: 12px;
        }

        .qr-scanner-wrapper :global(.qr-code-success-frame) {
          border: 4px solid #10b981 !important;
          border-radius: 8px;
        }

        .qr-scanner-wrapper :global(#html5-qrcode-button-camera-permission) {
          background: #2563eb !important;
          color: white !important;
          border-radius: 8px;
          padding: 12px 24px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .qr-scanner-wrapper
          :global(#html5-qrcode-button-camera-permission):hover {
          background: #1d4ed8 !important;
        }

        .qr-scanner-wrapper :global(#html5-qrcode-button-camera-stop) {
          background: #dc2626 !important;
          color: white !important;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          margin-top: 12px;
        }

        .qr-scanner-wrapper :global(#html5-qrcode-button-camera-stop):hover {
          background: #b91c1c !important;
        }
      `}</style>
    </div>
  );
}

export default QRScanner;
