'use client';

import React from 'react';
import { QRAuthProvider } from '@/components/auth/QRAuthProvider';
import { useQRAuth } from '@/components/auth/QRAuthProvider';

function QRAuthContent() {
  const { qrAuthState, generateQR, isLoading, error } = useQRAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="text-center space-y-4">
        {qrAuthState.qrCode && (
          <div>
            <img src={qrAuthState.qrCode} alt="QR Code" className="mx-auto" />
          </div>
        )}
        {!qrAuthState.qrCode && (
          <button
            onClick={generateQR}
            disabled={isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg"
          >
            {isLoading ? 'Generating...' : 'Generate QR Code'}
          </button>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function QRAuthPage() {
  return (
    <QRAuthProvider>
      <QRAuthContent />
    </QRAuthProvider>
  );
}
