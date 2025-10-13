import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '2rem',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
        404 - Page not found
      </h1>
      <p style={{ color: '#6b7280' }}>
        The page you are looking for might have been moved or deleted.
      </p>
      <Link href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
        Go back home
      </Link>
    </div>
  );
}
