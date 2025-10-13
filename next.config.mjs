import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = (config) => {
  if (process.env.ANALYZE === 'true') {
    try {
      // Dynamically require to avoid dependency in prod
      const { default: withAnalyzer } = await import('@next/bundle-analyzer');
      return withAnalyzer({ enabled: true })(config);
    } catch {
      return config;
    }
  }
  return config;
};

const nextConfig = withBundleAnalyzer({
  reactStrictMode: true,
  poweredByHeader: false,
  // Add webpack configuration to handle missing modules and path aliases
  webpack: (config, { isServer }) => {
    // Add webpack alias for @/ path resolution
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    
    // Add fallback for missing modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: process.env.CI ? false : true,
    dirs: ['src'],
  },
  typescript: {
    ignoreBuildErrors: process.env.CI ? false : true,
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    const scriptSrc = isProd
      ? [
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        ]
      : [
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app https://cdn.jsdelivr.net",
        ];

    const connectSrc = isProd
      ? [
          "connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co",
        ]
      : [
          "connect-src 'self' https://*.supabase.co https://api.openai.com https://vercel.live http://localhost:* https://localhost:* wss://*.supabase.co",
        ];

    const frameSrc = isProd
      ? ["frame-src 'self'"]
      : ["frame-src 'self' https://vercel.live https://*.vercel.app"];

    const cspDirectives = [
      "default-src 'self'",
      ...scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      ...connectSrc,
      ...frameSrc,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: cspDirectives },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
});

export default nextConfig;


