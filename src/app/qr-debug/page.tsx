'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';

export default function QRDebugPage() {
  const [qrCodes, setQrCodes] = useState<Array<{type: string, data: string, qrCode: string}>>([]);
  const [loading, setLoading] = useState(false);

  const generateTestQRCodes = async () => {
    setLoading(true);
    const testCases = [
      {
        type: 'Plain Text',
        data: 'Hello World'
      },
      {
        type: 'URL',
        data: 'https://example.com'
      },
      {
        type: 'JSON Data',
        data: JSON.stringify({ type: 'auth', timestamp: Date.now() })
      },
      {
        type: 'Auth Token',
        data: JSON.stringify({
          token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test',
          sessionId: 'sess_123',
          timestamp: Date.now(),
          version: '2.0'
        })
      },
      {
        type: 'Phone Number (Test)',
        data: 'tel:+1234567890'
      }
    ];

    const results = [];
    for (const testCase of testCases) {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(testCase.data, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 200,
        });
        results.push({
          ...testCase,
          qrCode: qrCodeDataURL
        });
      } catch (error) {
        results.push({
          ...testCase,
          qrCode: '',
          error: error instanceof Error ? error.message : 'Failed'
        });
      }
    }
    
    setQrCodes(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🔍 QR Code Debug Tool
          </h1>
          
          <button
            onClick={generateTestQRCodes}
            disabled={loading}
            className="mb-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Test QR Codes'}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">{item.type}</h3>
                
                {item.qrCode ? (
                  <img 
                    src={item.qrCode} 
                    alt={`${item.type} QR Code`}
                    className="mx-auto mb-3 border border-gray-300 rounded"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto mb-3 border border-red-300 rounded bg-red-50 flex items-center justify-center">
                    <span className="text-red-600 text-sm">Generation Failed</span>
                  </div>
                )}
                
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <p className="text-gray-600 mb-1">Data:</p>
                  <code className="text-gray-800 break-all">{item.data}</code>
                </div>
              </div>
            ))}
          </div>

          {qrCodes.length > 0 && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">📱 Scanner Notes:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• URL QR codes will open in browser/app</li>
                <li>• Phone QR codes (tel:) will prompt to call</li>
                <li>• JSON/Text QR codes should show raw content</li>
                <li>• If JSON shows as phone number, there&apos;s a bug in the data</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}