/**
 * Sentry Edge Configuration
 * This file configures the initialization of Sentry for edge features (Middleware, Edge Handlers).
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isEnabled = process.env.NODE_ENV === 'production' && !!SENTRY_DSN;

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Only enable in production
    enabled: isEnabled,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Set custom tags for all events
    initialScope: {
      tags: {
        app: 'gurukool-homeschool',
        environment: process.env.NODE_ENV || 'development',
        runtime: 'edge',
      },
    },
  });
}
