'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col p-8 gap-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Admin Dashboard Error
        </h2>
        <p className="text-gray-600 mb-4">
          {process.env.NODE_ENV === 'production'
            ? 'Something went wrong loading the admin dashboard.'
            : error.message}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
