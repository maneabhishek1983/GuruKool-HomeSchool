import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Face recognition E2E sanity. Camera input is faked via Chromium's
 * --use-fake-device-for-media-stream + --use-fake-ui-for-media-stream flags
 * (see playwright.config.ts launchOptions). face-api.js will run against a
 * synthetic green frame, which won't detect a face — that's intentional. We
 * assert the UI surfaces the right "no face detected" / fallback state, NOT
 * that a match succeeds (which requires a fixture frame harness).
 *
 * For real match testing, use the virtual authenticator pattern in
 * biometric-flow.spec.ts or a manual device test.
 */

const TEACHER_STORAGE = path.join(__dirname, '.auth', 'teacher.json');

test.describe('face recognition end-to-end (synthetic camera)', () => {
  test.skip(
    () => !fs.existsSync(TEACHER_STORAGE),
    'Missing e2e/.auth/teacher.json — run setup project first.'
  );

  test.use({ storageState: TEACHER_STORAGE });

  test('face check-in screen loads on mobile viewport without crashing', async ({
    page,
  }) => {
    await page.goto('/teacher/dashboard');

    // If face recognition is unavailable (no HTTPS or no camera API),
    // the UI must show the QR fallback rather than crash.
    const checkInUI = page
      .getByTestId('face-check-in')
      .or(page.getByText(/face check-in|verify with face|qr code/i));

    await expect(checkInUI.first()).toBeVisible({ timeout: 10000 });
  });

  test('camera permission denied → QR fallback', async ({ page, context }) => {
    // Clear granted permissions to simulate denial.
    await context.clearPermissions();
    await context.grantPermissions([]);

    await page.goto('/teacher/dashboard');

    // We expect *some* visible UI — either the camera-denied banner or the
    // automatic QR fallback. Both are acceptable behaviors.
    const fallback = page
      .getByText(/camera.*not available|use qr|scan qr|face.*unavailable/i)
      .or(page.getByTestId('qr-scanner'));

    await expect(fallback.first()).toBeVisible({ timeout: 10000 });
  });
});
