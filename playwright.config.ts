import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, 'e2e', '.auth');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Let Playwright pick the worker count; per-test isolation is handled via storageState.
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Auto-grant camera + geolocation so face/biometric specs don't hang on
    // permission prompts. WebAuthn is exercised via CDP virtual authenticator
    // (see e2e/biometric-flow.spec.ts), no permission needed.
    permissions: ['camera', 'geolocation'],
    launchOptions: {
      // Chromium fake camera: yields a green frame. face-api.js won't detect a
      // face — face-flow.spec.ts only asserts the UI handles the no-face state.
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },

  projects: [
    // Seed test users + capture storageState per role.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Unauthenticated API contract suite — runs independently, no login required.
    {
      name: 'api-contract',
      testMatch: /api-contract\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // UI specs — share auth state from `setup`. Skip auth.setup.ts itself.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro 11'] },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /api-contract\.spec\.ts/],
    },

    // Role-scoped projects — pre-authenticated. Tag a spec with @role-admin etc.
    {
      name: 'role-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'admin.json'),
      },
      dependencies: ['setup'],
      testMatch: /.*@role-admin.*\.spec\.ts/,
    },
    {
      name: 'role-teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'teacher.json'),
      },
      dependencies: ['setup'],
      testMatch: /.*@role-teacher.*\.spec\.ts/,
    },
    {
      name: 'role-parent',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'parent.json'),
      },
      dependencies: ['setup'],
      testMatch: /.*@role-parent.*\.spec\.ts/,
    },
    {
      name: 'role-student',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'student.json'),
      },
      dependencies: ['setup'],
      testMatch: /.*@role-student.*\.spec\.ts/,
    },
  ],

  webServer: {
    // CI overrides via PLAYWRIGHT_WEB_SERVER_COMMAND (set to "npm run start" after build).
    command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  expect: {
    timeout: 10000,
  },

  timeout: 30000,
});
