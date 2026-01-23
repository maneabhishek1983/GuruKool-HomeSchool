'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

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

          if (selectedCamera) {
            addDebugLog(`Using: ${selectedCamera.label || 'Default camera'}`);

            if (selectedCamera.id) {
              startScanning(selectedCamera.id);
            }
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

      // Create Html5Qrcode instance
      html5QrCodeRef.current = new Html5Qrcode('qr-scanner-container', {
        formatsToSupport: [0], // 0 = QR_CODE format only
        verbose: false, // Disable verbose to reduce console noise
      });

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10, // Keep FPS at 10 for better detection
          qrbox: function (viewfinderWidth, viewfinderHeight) {
            // Make qrbox 70% of the smaller dimension for better detection
            const minEdgePercentage = 0.7;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize,
            };
          },
          aspectRatio,
          disableFlip: false, // Enable flip for better detection
          // Advanced camera settings for better QR detection
          videoConstraints: {
            facingMode: { ideal: 'environment' }, // Back camera preferred
            width: { ideal: 1280 }, // Higher resolution for better QR detection
            height: { ideal: 720 },
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
          // Silently ignore routine scanning errors
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

  return (
    <div className="qr-scanner-wrapper">
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
          <p className="text-xs mt-2">Ensure good lighting for best results</p>
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
