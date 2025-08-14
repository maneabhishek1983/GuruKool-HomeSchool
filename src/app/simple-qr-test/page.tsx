'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';

export default function SimpleQRTest() {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateSimpleQR = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const testData = {
        type: 'auth',
        sessionId: `test-${Date.now()}`,
        timestamp: Date.now(),
        version: '1.0'
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(testData), {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
        width: 256,
      });

      setQrCode(qrCodeDataURL);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Simple QR Test
          </h1>
          
          <button
            onClick={generateSimpleQR}
            disabled={isLoading}
            className="mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Test QR Code'}
          </button>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {qrCode && (
            <div className="mb-6">
              <img 
                src={qrCode} 
                alt="Test QR Code"
                className="mx-auto border border-gray-300 rounded"
              />
              <p className="text-sm text-gray-600 mt-2">
                ✅ QR Code generated successfully!
              </p>
            </div>
          )}

          <div className="text-left bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Test Purpose:</h3>
            <p className="text-sm text-gray-600">
              This tests basic QR code generation without complex services.
              If this works, the issue is in the authentication service layers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}