'use client';

import { useState } from 'react';

export default function QRTestPage() {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpass123');
  const [qrCode, setQrCode] = useState<string>('');
  const [error, setError] = useState<string>('');

  const generateQRCode = (email: string, password: string) => {
    try {
      // Generate a simple QR code data string
      const qrData = JSON.stringify({
        email,
        password,
        timestamp: new Date().toISOString(),
        type: 'login',
      });

      // Create SVG content
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8">${qrData}</text>
        </svg>
      `;

      // Convert to base64
      const base64Data = btoa(svgContent);
      const qrCodeUrl = `data:image/svg+xml;base64,${base64Data}`;

      console.log('QR Code generated successfully:', {
        email,
        qrCodeLength: qrCodeUrl.length,
        hasData: qrCodeUrl.includes(email),
      });

      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const handleGenerateQR = () => {
    try {
      setError('');
      const generatedQR = generateQRCode(testEmail, testPassword);
      setQrCode(generatedQR);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Generate QR Code
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
                  Contains Email:{' '}
                  {qrCode.includes(testEmail) ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-gray-600">
                  Contains Password:{' '}
                  {qrCode.includes(testPassword) ? '✅ Yes' : '❌ No'}
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
            <li>• Click "Generate QR Code" to test the generation</li>
            <li>• Check the browser console for detailed logs</li>
            <li>• Use "Copy QR Code Data" to inspect the generated data</li>
            <li>• If QR code doesn't display, check for console errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
