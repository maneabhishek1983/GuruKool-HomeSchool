import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

/**
 * Seeds 4 test users (admin, teacher, parent, student) and saves an
 * authenticated storageState per role under e2e/.auth/. Other Playwright
 * projects that depend on `setup` consume these states via `storageState`.
 *
 * Skips gracefully if Supabase test credentials are absent — useful for
 * contributors running E2Es locally without a test project.
 *
 * Required env (set in CI):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - E2E_TEST_PASSWORD (default: shared-test-only secret)
 */

const ROLES = ['admin', 'teacher', 'parent', 'student'] as const;
type Role = (typeof ROLES)[number];

const AUTH_DIR = path.join(__dirname, '.auth');
const PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2eTest!Password123';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_AVAILABLE = Boolean(url && serviceKey);

/**
 * Refuses to run against anything that looks like prod. The setup is
 * destructive (deletes + recreates users); pointing it at prod would
 * nuke real accounts. Pattern is configurable via E2E_PROD_HOST_PATTERN.
 *
 * Default rule: URL must contain "test" or "staging" or be explicitly
 * allow-listed via E2E_ALLOW_HOST.
 */
function assertNotProd(targetUrl: string): void {
  const allowHost = process.env.E2E_ALLOW_HOST;
  const prodPattern = process.env.E2E_PROD_HOST_PATTERN;

  if (allowHost && targetUrl.includes(allowHost)) {
    return;
  }

  if (prodPattern && new RegExp(prodPattern).test(targetUrl)) {
    throw new Error(
      `auth.setup.ts refusing to run: NEXT_PUBLIC_SUPABASE_URL matches E2E_PROD_HOST_PATTERN. ` +
        `URL=${targetUrl}`
    );
  }

  const looksLikeTest = /test|staging|preview|local|127\.0\.0\.1/i.test(
    targetUrl
  );
  if (!looksLikeTest) {
    throw new Error(
      `auth.setup.ts refusing to run against ${targetUrl}: URL does not contain ` +
        `"test"/"staging"/"preview"/"local". This is destructive — it deletes and recreates ` +
        `users. Set E2E_ALLOW_HOST to the hostname substring if this is genuinely a test project.`
    );
  }
}

function userEmail(role: Role): string {
  return `e2e-${role}@gurukool.test`;
}

setup.describe('auth fixtures', () => {
  setup.beforeAll(() => {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  });

  for (const role of ROLES) {
    setup(`seed and login: ${role}`, async ({ page }) => {
      setup.skip(
        !SUPABASE_AVAILABLE,
        'Supabase test credentials missing — skipping auth fixture seeding. ' +
          'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable.'
      );

      assertNotProd(url!);

      const admin = createClient(url!, serviceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const email = userEmail(role);

      // Idempotent: delete prior test user (cascades to users row via FK)
      const { data: existing } = await admin.auth.admin.listUsers();
      const prior = existing?.users?.find(u => u.email === email);
      if (prior) {
        await admin.auth.admin.deleteUser(prior.id);
      }

      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
        });
      if (createErr || !created.user) {
        throw new Error(`Failed to create ${role} user: ${createErr?.message}`);
      }

      const { error: profileErr } = await admin.from('users').upsert({
        id: created.user.id,
        email,
        name: `E2E ${role}`,
        role,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      });
      if (profileErr) {
        throw new Error(
          `Failed to upsert ${role} profile: ${profileErr.message}`
        );
      }

      // Login through the UI so storageState captures the same cookies/
      // localStorage the real client uses.
      await page.goto('/login');
      await page.getByTestId('login-email-input').fill(email);
      await page.getByTestId('login-password-input').fill(PASSWORD);
      await page.getByTestId('login-submit-button').click();

      const expectedPath =
        role === 'admin'
          ? /\/admin\/dashboard/
          : role === 'teacher'
            ? /\/teacher\/dashboard/
            : role === 'student'
              ? /\/student\/dashboard/
              : /\/parent\/dashboard/;
      await expect(page).toHaveURL(expectedPath, { timeout: 15000 });

      await page.context().storageState({
        path: path.join(AUTH_DIR, `${role}.json`),
      });
    });
  }

  /**
   * A second teacher that is intentionally NOT assigned to the E2E test
   * student. The face-api spec uses this to verify the 403 path on
   * /verify-face and /face-challenge. We don't bother logging in via the UI
   * — the API specs use the password grant directly to mint a bearer token.
   */
  setup('seed unassigned teacher (api-only fixture)', async () => {
    setup.skip(
      !SUPABASE_AVAILABLE,
      'Supabase test credentials missing — skipping unassigned teacher fixture.'
    );

    assertNotProd(url!);

    const admin = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = 'e2e-teacher-unassigned@gurukool.test';

    const { data: existing } = await admin.auth.admin.listUsers();
    const prior = existing?.users?.find(u => u.email === email);
    if (prior) {
      await admin.auth.admin.deleteUser(prior.id);
    }

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });
    if (createErr || !created.user) {
      throw new Error(
        `Failed to create unassigned teacher: ${createErr?.message}`
      );
    }

    const { error: profileErr } = await admin.from('users').upsert({
      id: created.user.id,
      email,
      name: 'E2E Unassigned Teacher',
      role: 'teacher',
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    });
    if (profileErr) {
      throw new Error(
        `Failed to upsert unassigned teacher profile: ${profileErr.message}`
      );
    }
    // Intentionally do NOT call ensureTestTeacher / assignTeacherToStudent
    // here — the face-api spec's beforeAll handles teacher-row creation and
    // explicitly leaves this user unassigned.
  });
});
