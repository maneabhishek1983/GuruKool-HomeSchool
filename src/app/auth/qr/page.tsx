"use client";

import React, { Suspense } from 'react';
import { QRAuthIntegration } from '@/components/auth/QRAuthIntegration';

function QRAuthContent() {
  return <QRAuthIntegration />;
}

function QRAuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        <p className="text-neutral-600">Loading authentication...</p>
      </div>
    </div>
  );
}

export default function QRAuthPage() {
  return (
    <Suspense fallback={<QRAuthLoading />}>
      <QRAuthContent />
    </Suspense>
  );
}


