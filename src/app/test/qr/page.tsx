'use client';

import { QRCodeTester } from '@/components/testing/QRCodeTester';

export default function QRTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-8">
      <QRCodeTester />
    </div>
  );
}