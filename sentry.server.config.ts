/**
 * Sentry Server Configuration
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isEnabled = process.env.NODE_ENV === 'production' && !!SENTRY_DSN;

/**
 * Redact sensitive data from error messages
 */
function redactSensitiveData(message: string): string {
  // Redact email addresses
  message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED_EMAIL]');

  // Redact JWT tokens
  message = message.replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, '[REDACTED_JWT]');

  // Redact UUIDs (potential user IDs)
  message = message.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[REDACTED_UUID]'
  );

  // Redact potential API keys
  message = message.replace(/sk_[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');
  message = message.replace(/pk_[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');

  return message;
}

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

    // Filter out certain errors
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }

      const error = hint.originalException;
      if (error instanceof Error) {
        // Redact sensitive information from error messages
        if (event.message) {
          event.message = redactSensitiveData(event.message);
        }
        if (error.message) {
          error.message = redactSensitiveData(error.message);
        }
      }

      return event;
    },

    // Set custom tags for all events
    initialScope: {
      tags: {
        app: 'gurukool-homeschool',
        environment: process.env.NODE_ENV || 'development',
        runtime: 'server',
      },
    },
  });
}
