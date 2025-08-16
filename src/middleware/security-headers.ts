import { NextRequest, NextResponse } from 'next/server';

/**
 * Security headers configuration
 */
const securityHeaders = [
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },

  // Strict Transport Security (HSTS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },

  // XSS Protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },

  // Frame Options (prevent clickjacking)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },

  // Content Type Options (prevent MIME type sniffing)
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },

  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },

  // Permissions Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },

  // Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.supabase.co wss://*.supabase.co",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  securityHeaders.forEach(header => {
    response.headers.set(header.key, header.value);
  });

  // Additional security measures
  response.headers.set('X-Powered-By', ''); // Remove X-Powered-By header

  // Set secure cookie attributes for session cookies
  const cookies = request.cookies.getAll();
  cookies.forEach(cookie => {
    if (cookie.name.includes('session') || cookie.name.includes('auth')) {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
      });
    }
  });

  return response;
}

/**
 * Enhanced security headers for API routes
 */
export function apiSecurityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add all security headers
  securityHeaders.forEach(header => {
    response.headers.set(header.key, header.value);
  });

  // Additional API-specific headers
  response.headers.set('X-API-Version', '1.0');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // CORS headers for API routes
  const origin = request.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-CSRF-Token'
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

/**
 * Check if origin is allowed for CORS
 */
function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://gurukool-homeschool.vercel.app',
    'https://gurukool-homeschool.com',
  ];

  return allowedOrigins.includes(origin);
}

/**
 * Apply security headers based on route type
 */
export function applySecurityHeaders(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes get enhanced security headers
  if (pathname.startsWith('/api/')) {
    return apiSecurityHeadersMiddleware(request);
  }

  // All other routes get standard security headers
  return securityHeadersMiddleware(request);
}
