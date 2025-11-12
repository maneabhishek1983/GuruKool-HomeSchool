'use client';

import { useState } from 'react';
import { QRScanner } from '@/components/shared/QRScanner';
import { TeacherQRService } from '@/services/teacher-qr.service';

export default function TestQRScannerPage() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [testQRImage, setTestQRImage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (data: string) => {
    setScannedData(data);
    setError(null);

    // Try to parse the data
    try {
      const parsed = JSON.parse(data);
      setParsedData(parsed);
    } catch (err) {
      setParsedData(null);
      setError('Invalid JSON data in QR code');
    }
  };

  const handleError = (err: string) => {
    setError(err);
  };

  const generateTestQR = async () => {
    try {
      // Generate a test QR code
      const testData = await TeacherQRService.generateQRCodeData(
        'test-teacher-123',
        'test-student-456',
        'test-parent-789'
      );

      const qrImage = await TeacherQRService.generateQRCodeImage(testData);
      setTestQRImage(qrImage);
    } catch (err) {
      setError('Failed to generate test QR code');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧪 QR Scanner Test Page
          </h1>
          <p className="text-gray-600">
            Test QR code scanning functionality with real camera
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              📷 QR Scanner
            </h2>

            {!showScanner ? (
              <div className="space-y-4">
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Camera Scanner
                </button>

                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-gray-600 text-sm">
                    Click button above to start scanning
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <QRScanner
                  onScan={data => {
                    handleScan(data);
                    setShowScanner(false);
                  }}
                  onError={handleError}
                  width={400}
                  qrbox={250}
                  fps={10}
                />

                <button
                  onClick={() => setShowScanner(false)}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Stop Scanner
                </button>
              </div>
            )}
          </div>

          {/* Test QR Code Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🎯 Test QR Code
            </h2>

            <button
              onClick={generateTestQR}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors mb-4"
            >
              Generate Test QR Code
            </button>

            {testQRImage && (
              <div className="space-y-3">
                <div className="bg-white border-2 border-gray-300 rounded-xl p-4 flex items-center justify-center">
                  <img
                    src={testQRImage}
                    alt="Test QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR code with the scanner on the left
                </p>
              </div>
            )}

            {!testQRImage && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-600 text-sm">
                  Click button above to generate test QR
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="mt-6 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">❌</div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanned Data Display */}
          {scannedData && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-xl font-semibold text-green-800 mb-1">
                    QR Code Scanned Successfully!
                  </h3>
                  <p className="text-green-700 text-sm">
                    Data extracted from QR code
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Raw Data */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Raw Data:
                  </h4>
                  <pre className="bg-white p-4 rounded-lg text-xs overflow-x-auto border border-green-200">
                    {scannedData}
                  </pre>
                </div>

                {/* Parsed Data */}
                {parsedData && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Parsed Data:
                    </h4>
                    <pre className="bg-white p-4 rounded-lg text-xs overflow-x-auto border border-green-200">
                      {JSON.stringify(parsedData, null, 2)}
                    </pre>

                    {/* Data Fields */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {Object.entries(parsedData).map(([key, value]) => {
                        // Sanitize key and value to prevent XSS
                        const sanitizedKey = String(key).replace(/[<>]/g, '');
                        const sanitizedValue = String(value).replace(
                          /[<>]/g,
                          ''
                        );

                        return (
                          <div
                            key={sanitizedKey}
                            className="bg-white p-3 rounded-lg border border-green-200"
                          >
                            <p className="text-xs text-gray-500 uppercase">
                              {sanitizedKey}
                            </p>
                            <p className="text-sm font-mono text-gray-900 truncate">
                              {sanitizedValue}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setScannedData(null);
                  setParsedData(null);
                  setError(null);
                }}
                className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Scan Another QR Code
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📝 Testing Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Click "Generate Test QR Code" to create a sample QR code</li>
            <li>Click "Start Camera Scanner" to activate your camera</li>
            <li>Grant camera permissions when prompted</li>
            <li>
              Hold the generated QR code in front of your camera (or scan from
              another device)
            </li>
            <li>
              The scanner will automatically detect and decode the QR code
            </li>
            <li>View the scanned data in the results section below</li>
          </ol>
        </div>

        {/* Browser Compatibility */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            🌐 Browser Requirements
          </h4>
          <ul className="text-yellow-800 text-sm space-y-1">
            <li>✅ Chrome/Edge 90+</li>
            <li>✅ Firefox 88+</li>
            <li>✅ Safari 14.1+ (iOS 14.5+)</li>
            <li>⚠️ Must be served over HTTPS (localhost is OK)</li>
            <li>⚠️ Camera permissions required</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
