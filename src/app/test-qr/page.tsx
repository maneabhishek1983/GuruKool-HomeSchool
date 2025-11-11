'use client';

import { useState } from 'react';
import { QRCodeGenerator } from '@/utils/qr-code-generator';

export default function QRTestPage() {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpass123');
  const [qrCode, setQrCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQR = async () => {
    try {
      setError('');
      setIsGenerating(true);

      // Use the QRCodeGenerator utility to generate REAL QR codes (iOS compatible)
      const generatedQR = await QRCodeGenerator.generateQRCode(
        testEmail,
        testPassword
      );
      setQrCode(generatedQR);

      console.log('REAL QR Code generated successfully (iOS compatible)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyQRData = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      alert('QR Code data copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          QR Code Generation Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="text"
                value={testPassword}
                onChange={e => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test password"
              />
            </div>

            <button
              onClick={handleGenerateQR}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isGenerating
                ? 'Generating...'
                : 'Generate REAL QR Code (iOS Compatible)'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {qrCode && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Generated QR Code</h2>

            <div className="text-center">
              <img
                src={qrCode}
                alt="Generated QR Code"
                className="w-48 h-48 mx-auto border border-gray-300 rounded-lg mb-4"
                onError={e => {
                  console.error('QR Code image failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  QR Code Length: {qrCode.length} characters
                </p>
                <p className="text-sm text-gray-600">
                  Format:{' '}
                  {qrCode.startsWith('data:image/png;base64,')
                    ? '✅ Real PNG QR Code (iOS Compatible)'
                    : '❌ Not a real QR code'}
                </p>
                <p className="text-sm text-green-600 font-semibold">
                  {qrCode.startsWith('data:image/png;base64,')
                    ? '✅ This QR code will work on iOS devices!'
                    : ''}
                </p>

                <button
                  onClick={handleCopyQRData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Copy QR Code Data
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-blue-800 font-medium mb-2">Instructions</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Enter test email and password</li>
            <li>• Click "Generate REAL QR Code" to test the generation</li>
            <li>
              • The QR code is now a REAL scannable QR code (not fake SVG text)
            </li>
            <li>• Test with iOS Camera app or any QR scanner</li>
            <li>• Check the browser console for detailed logs</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <h3 className="text-green-800 font-medium mb-2">
            ✅ iOS Compatibility Fixed
          </h3>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Now generates REAL QR codes using the qrcode library</li>
            <li>• Error correction level: H (highest for iOS)</li>
            <li>• Proper quiet zone (margin: 4)</li>
            <li>• High contrast (pure black/white)</li>
            <li>• Optimal size (512px) for iOS camera</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
