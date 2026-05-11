import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for running against a remote URL (Vercel preview).
 * No local webServer — baseURL comes from PW_TEST_BASE_URL / BASE_URL.
 * No auth.setup.ts dependency — preview DB is shared, we don't seed it.
 *
 * Used by .github/workflows/e2e-against-preview.yml.
 */

const baseURL =
  process.env.PW_TEST_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [
    ['html'],
    ['github'],
    ['json', { outputFile: 'test-results/preview-results.json' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Bypass Vercel preview password protection when token is provided.
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          'x-vercel-protection-bypass':
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        }
      : undefined,
  },

  projects: [
    {
      name: 'api-contract',
      testMatch: /api-contract\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // No setup project — preview DB is shared. Spec files that
      // require auth must log in inline or be skipped.
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },
  ],

  expect: { timeout: 15000 },
  timeout: 60000,
});
