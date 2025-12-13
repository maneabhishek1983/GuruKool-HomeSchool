/**
 * Sentry Client Configuration
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
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

    // Replay configuration
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    // Integration configuration
    integrations: [
      Sentry.replayIntegration({
        // Additional SDK configuration goes here
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out certain errors
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }

      // Filter out common noise errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors that are often user-side issues
        if (error.message.includes('Failed to fetch')) {
          return null;
        }
        // Ignore cancelled requests
        if (error.message.includes('AbortError')) {
          return null;
        }
      }

      return event;
    },

    // Set custom tags for all events
    initialScope: {
      tags: {
        app: 'gurukool-homeschool',
        environment: process.env.NODE_ENV || 'development',
      },
    },
  });
}
