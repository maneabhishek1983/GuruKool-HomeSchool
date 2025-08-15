'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../../lib/authContext';

export default function TestLoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [message, setMessage] = useState('');

  const handleTestLogin = () => {
    setMessage('Logging in...');

    // Simulate QR authentication success
    login(
      {
        id: 'test-teacher-qr',
        name: 'QR Test Teacher',
        role: 'teacher',
        email: 'qr-test@example.com',
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true,
            frequency: 'immediate',
          },
          dashboard: {
            layout: 'detailed',
            theme: 'light',
            widgets: ['sessions', 'analytics', 'notifications'],
          },
          privacy: {
            dataSharing: false,
            analytics: true,
            aiTraining: true,
          },
          accessibility: {
            fontSize: 'medium',
            highContrast: false,
            reducedMotion: false,
            screenReader: false,
          },
        },
        createdAt: new Date(),
        lastActive: new Date(),
      },
      'qr'
    );

    setMessage('✅ Login successful! Redirecting to dashboard...');

    setTimeout(() => {
      router.push('/teacher/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          🧪 QR Login Test
        </h1>

        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            This page tests QR authentication without the complex QR generation.
          </p>

          <button
            onClick={handleTestLogin}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            🔐 Simulate QR Login Success
          </button>

          {message && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-center">{message}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This simulates a successful QR scan and login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
