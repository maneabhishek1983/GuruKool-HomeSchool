'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Global Error Boundary for Root Layout
 *
 * This catches errors that occur in the root layout and provides
 * a fallback UI. It must be a Client Component.
 *
 * Note: This only catches errors in production. In development,
 * Next.js shows the error overlay instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send error to Sentry for monitoring
    Sentry.captureException(error, {
      tags: {
        errorType: 'global',
        digest: error.digest || 'unknown',
      },
      extra: {
        componentStack: error.stack,
      },
    });
    console.error('Global error caught:', error);
  }, [error]);

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
            gap: '1.5rem',
            background: '#f9fafb',
            color: '#111827',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '4rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: '#6b7280',
                marginBottom: '2rem',
                fontSize: '1.125rem',
              }}
            >
              {process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Our team has been notified and is working on a fix.'
                : error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p
                style={{
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  marginBottom: '2rem',
                  fontFamily: 'monospace',
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#1d4ed8';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#2563eb';
                }}
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  background: 'white',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Go to homepage
              </button>
            </div>
          </div>
          {process.env.NODE_ENV !== 'production' && (
            <details
              style={{
                maxWidth: '800px',
                width: '100%',
                background: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  color: '#ef4444',
                  background: '#fef2f2',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
