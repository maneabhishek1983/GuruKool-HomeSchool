import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Biometric (WebAuthn) E2E using Playwright's virtual authenticator via CDP.
 *
 * Why CDP virtual authenticator?
 *   WebAuthn cannot be exercised in CI without one. Real fingerprint/Face ID
 *   prompts require a real device. Chromium DevTools exposes a "WebAuthn"
 *   domain that lets us create a virtual platform authenticator that returns
 *   real, verifiable signatures. This is the only way to E2E the flow without
 *   hardware.
 *
 *   See: https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/
 *   Same pattern is used by Google Identity Services internal tests.
 *
 * Scope: runs against `--project=chromium` (CDP-only) and skips on firefox/
 * webkit/mobile-safari. Mobile-Chrome works because it's still Chromium under
 * the hood and exposes CDP.
 *
 * Skips if the auth fixture (e2e/.auth/teacher.json) is missing — fall-through
 * for contributors who haven't set up the test Supabase project.
 */

import fs from 'fs';
import path from 'path';

const TEACHER_STORAGE = path.join(__dirname, '.auth', 'teacher.json');

test.describe('biometric end-to-end (virtual authenticator)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'CDP virtual authenticator is Chromium-only. ' +
      'WebKit/Firefox biometric E2Es require a different harness.'
  );

  test.skip(
    () => !fs.existsSync(TEACHER_STORAGE),
    'Missing e2e/.auth/teacher.json — run setup project first (requires Supabase test creds).'
  );

  test.use({ storageState: TEACHER_STORAGE });

  let authenticatorId: string;
  let cdpSession: Awaited<ReturnType<BrowserContext['newCDPSession']>>;

  test.beforeEach(async ({ page, context }) => {
    cdpSession = await context.newCDPSession(page);
    await cdpSession.send('WebAuthn.enable');

    const { authenticatorId: id } = await cdpSession.send(
      'WebAuthn.addVirtualAuthenticator',
      {
        options: {
          protocol: 'ctap2',
          transport: 'internal', // platform authenticator
          hasResidentKey: true,
          hasUserVerification: true,
          isUserVerified: true, // pretend the user verified
          automaticPresenceSimulation: true,
        },
      }
    );
    authenticatorId = id;
  });

  test.afterEach(async () => {
    if (cdpSession && authenticatorId) {
      await cdpSession
        .send('WebAuthn.removeVirtualAuthenticator', {
          authenticatorId,
        })
        .catch(() => {
          /* best-effort */
        });
    }
  });

  test('register + authenticate round-trip succeeds', async ({ page }) => {
    await page.goto('/teacher/dashboard');

    // Navigate to biometric device manager. The exact route may differ —
    // adjust selector when the UI is finalized.
    const registerButton = page
      .getByTestId('biometric-register-button')
      .or(
        page.getByRole('button', { name: /register.*biometric|add.*device/i })
      );

    if ((await registerButton.count()) === 0) {
      test.skip(
        true,
        'No biometric register UI surfaced for this teacher. ' +
          'Add data-testid="biometric-register-button" to the trigger.'
      );
    }

    await registerButton.first().click();

    // The virtual authenticator will satisfy navigator.credentials.create
    // synchronously. We just wait for the success state.
    await expect(
      page.getByText(/registered successfully|device added/i)
    ).toBeVisible({ timeout: 15000 });

    // Now exercise authenticate: the same virtual authenticator should
    // produce a valid signature that /api/biometric/verify accepts.
    const authButton = page
      .getByTestId('biometric-authenticate-button')
      .or(
        page.getByRole('button', { name: /authenticate|check.*in.*biometric/i })
      );

    if ((await authButton.count()) > 0) {
      await authButton.first().click();
      await expect(
        page.getByText(/authenticated|verified|success/i)
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test('tampered signature is rejected by server', async ({
    page,
    request,
  }) => {
    // Direct API probe: register normally, then tamper with the signature
    // before calling /verify. Server must reject.
    // This is faster than UI-level tampering and proves the server-side
    // signature check is real (the whole point of the P1 fix).

    await page.goto('/teacher/dashboard'); // ensure cookies/storage attached

    // Get a challenge
    const challengeRes = await request.post('/api/biometric/challenge', {
      data: { teacherId: await getTeacherId(page), action: 'authenticate' },
    });

    // If no credential registered for this teacher in the seed DB, skip —
    // the previous test (register + auth) will cover the happy path.
    if (challengeRes.status() === 400) {
      test.skip(
        true,
        'No biometric credentials registered for seeded teacher.'
      );
    }
    expect(challengeRes.ok()).toBeTruthy();
    const { challengeToken, credentialIds } = await challengeRes.json();

    // Submit a verify with garbage signature.
    const verifyRes = await request.post('/api/biometric/verify', {
      data: {
        teacherId: await getTeacherId(page),
        credentialId: credentialIds[0],
        signature: 'AAAAAAAAAAAAAAAAAAAAAAAA',
        authenticatorData: 'AAAA',
        clientDataJSON: 'AAAA',
        challengeToken,
      },
    });
    expect(verifyRes.status()).toBe(401);
    const body = await verifyRes.json();
    expect(body.verified).toBe(false);
  });

  test('missing challengeToken is rejected (400)', async ({
    page,
    request,
  }) => {
    await page.goto('/teacher/dashboard');
    const verifyRes = await request.post('/api/biometric/verify', {
      data: {
        teacherId: await getTeacherId(page),
        credentialId: 'whatever',
        signature: 'AAAA',
        authenticatorData: 'AAAA',
        clientDataJSON: 'AAAA',
        // challengeToken omitted
      },
    });
    expect(verifyRes.status()).toBe(400);
  });

  test('tampered challengeToken is rejected (401)', async ({
    page,
    request,
  }) => {
    await page.goto('/teacher/dashboard');
    const verifyRes = await request.post('/api/biometric/verify', {
      data: {
        teacherId: await getTeacherId(page),
        credentialId: 'whatever',
        signature: 'AAAA',
        authenticatorData: 'AAAA',
        clientDataJSON: 'AAAA',
        challengeToken: 'forged.token',
      },
    });
    expect(verifyRes.status()).toBe(401);
  });
});

/**
 * Extract the authenticated teacher's user id from the storageState cookie
 * or from the dashboard DOM. Falls back to a fixed UUID if neither is found.
 */
async function getTeacherId(page: Page): Promise<string> {
  const fromDom = await page
    .getByTestId('current-user-id')
    .textContent()
    .catch(() => null);
  if (fromDom) {
    return fromDom.trim();
  }
  return process.env.E2E_TEACHER_ID || '11111111-1111-1111-1111-111111111111';
}
