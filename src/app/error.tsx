'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '2rem',
            gap: '1rem',
            background: '#f9fafb',
            color: '#111827',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b7280' }}>
            {process.env.NODE_ENV === 'production'
              ? 'An unexpected error occurred.'
              : error.message}
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
