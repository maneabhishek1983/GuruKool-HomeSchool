'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function TestQRPage() {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [rawData, setRawData] = useState<string>('');

  useEffect(() => {
    const generateTestQR = async () => {
      try {
        setLoading(true);
        setError('');
        
        const testData = JSON.stringify({
          test: 'Simple QR Test',
          timestamp: Date.now(),
          type: 'authentication',
          url: 'https://gurukool.example.com/auth'
        });
        
        setRawData(testData); // Show what data we're encoding
        
        const qrCodeDataURL = await QRCode.toDataURL(testData, {
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
        setLoading(false);
      }
    };

    generateTestQR();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">QR Code Test</h1>
        
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generating QR code...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {qrCode && !loading && !error && (
          <div className="text-center">
            <img 
              src={qrCode} 
              alt="Test QR Code" 
              className="mx-auto mb-4 border border-gray-200 rounded-lg"
            />
            <p className="text-sm text-gray-600 mb-4">Simple QR code generation test</p>
            
            <div className="text-left bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Raw data encoded in QR:</p>
              <code className="text-xs bg-white p-2 rounded border block break-all">
                {rawData}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}