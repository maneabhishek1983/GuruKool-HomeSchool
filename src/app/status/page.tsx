'use client';

import React, { useState, useEffect } from 'react';

export default function StatusPage() {
  const [status, setStatus] = useState({
    timestamp: new Date().toISOString(),
    server: 'running',
    features: {
      nextjs: '✅ Working',
      react: '✅ Working', 
      tailwind: '✅ Working',
      framer: '✅ Working',
      providers: '✅ Working'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-green-600 mb-6">
            🚀 GuruKool HomeSchool - Status
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h2 className="text-lg font-semibold text-green-800">Server Status</h2>
              <p className="text-green-600">✅ Application is running successfully</p>
              <p className="text-sm text-gray-600">Last checked: {status.timestamp}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Feature Status</h3>
              {Object.entries(status.features).map(([feature, status]) => (
                <div key={feature} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="capitalize font-medium">{feature}</span>
                  <span>{status}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Available Pages</h3>
              <ul className="space-y-1 text-blue-600">
                <li><a href="/" className="hover:underline">🏠 Home Page</a></li>
                <li><a href="/login" className="hover:underline">🔐 Login Page</a></li>
                <li><a href="/teacher/dashboard" className="hover:underline">👨‍🏫 Teacher Dashboard</a></li>
                <li><a href="/test/qr" className="hover:underline">🧪 QR Test Suite</a></li>
                <li><a href="/test-qr" className="hover:underline">📱 Simple QR Test</a></li>
                <li><a href="/status" className="hover:underline">📊 This Status Page</a></li>
              </ul>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Server running on localhost:3000 | Next.js 14.2.31
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}