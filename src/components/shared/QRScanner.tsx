'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
      // Create scanner instance
      scannerRef.current = new Html5QrcodeScanner(
        'qr-scanner-container',
        {
          fps,
          qrbox: { width: qrbox, height: qrbox },
          aspectRatio,
          disableFlip,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        },
        /* verbose= */ false
      );

      // Start scanning
      scannerRef.current.render(
        (decodedText, decodedResult) => {
          // Successfully scanned QR code
          console.log('QR Code scanned:', decodedText);
          setIsScanning(false);
          onScan(decodedText);

          // Clear scanner after successful scan
          scannerRef.current?.clear().catch(err => {
            console.error('Error clearing scanner:', err);
          });
        },
        errorMessage => {
          // Handle scan errors (most are just "no QR code detected")
          // Only log actual errors, not routine scanning messages
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.debug('QR Scan error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error('Error clearing scanner on unmount:', err);
        });
        scannerRef.current = null;
      }
    };
  }, [onScan, fps, qrbox, aspectRatio, disableFlip]);

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

// Alternative implementation using Html5Qrcode directly (more control)
export function QRScannerAdvanced({
  onScan,
  onError,
  width = 400,
  height = 400,
}: {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
}) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera on mobile
          const backCamera = devices.find(device =>
            device.label.toLowerCase().includes('back')
          );
          setSelectedCamera(backCamera?.id || devices[0]?.id || null);
        }
      })
      .catch(err => {
        console.error('Error getting cameras:', err);
        onError?.('Unable to access cameras');
      });

    return () => {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current
          .stop()
          .catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      onError?.('No camera selected');
      return;
    }

    try {
      html5QrCodeRef.current = new Html5Qrcode('qr-reader-advanced');

      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        decodedText => {
          console.log('QR Code scanned:', decodedText);
          onScan(decodedText);
          stopScanning();
        },
        errorMessage => {
          // Ignore routine scanning errors
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.debug('QR Scan error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      onError?.(
        'Failed to start camera. Please check permissions and try again.'
      );
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <div className="qr-scanner-advanced-wrapper">
      <div
        id="qr-reader-advanced"
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          margin: '0 auto',
        }}
      />

      {!isScanning && cameras.length > 0 && (
        <div className="mt-4 space-y-3">
          <select
            value={selectedCamera || ''}
            onChange={e => setSelectedCamera(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>

          <button
            onClick={startScanning}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Scanning
          </button>
        </div>
      )}

      {isScanning && (
        <div className="mt-4 space-y-3">
          <div className="text-center text-sm text-gray-600">
            <p>📱 Position QR code in the camera view</p>
          </div>

          <button
            onClick={stopScanning}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Stop Scanning
          </button>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
