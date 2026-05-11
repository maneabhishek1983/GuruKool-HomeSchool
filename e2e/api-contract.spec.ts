import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * API contract — auth boundary
 *
 * Asserts every protected /api/* route refuses unauthenticated requests.
 * This is the regression net for accidental data leaks (e.g. a debug route
 * that uses the service role key without an auth check).
 *
 * Adding a new route? Append it to PROTECTED_ROUTES below. The default
 * acceptable statuses are 401/403/302/307/400/405.
 *   - 401/403: explicit reject — preferred
 *   - 302/307: redirect to login (Next.js middleware pattern)
 *   - 400: handler short-circuits on missing body before auth (acceptable)
 *   - 405: method not allowed (acceptable; route exists, method doesn't)
 *
 * A 2xx response on a protected route is a leak. Fix the route, not the test.
 */

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RouteCase {
  path: string;
  methods: Method[];
  /** Body to send for write methods. Empty body is fine for auth checks. */
  body?: unknown;
}

const PROTECTED_ROUTES: RouteCase[] = [
  { path: '/api/biometric/challenge', methods: ['GET', 'POST'] },
  { path: '/api/biometric/credentials', methods: ['GET'] },
  { path: '/api/biometric/register', methods: ['GET', 'POST'] },
  { path: '/api/biometric/revoke', methods: ['GET', 'POST'] },
  { path: '/api/biometric/verify', methods: ['GET', 'POST'] },
  { path: '/api/credentials', methods: ['GET', 'POST'] },
  { path: '/api/data-sheets/entries', methods: ['GET', 'POST'] },
  { path: '/api/data-sheets/student', methods: ['GET'] },
  { path: '/api/geofence/exception/approve', methods: ['GET', 'POST'] },
  { path: '/api/geofence/exception/request', methods: ['GET', 'POST'] },
  { path: '/api/invitations/accept', methods: ['GET', 'POST'] },
  { path: '/api/invitations/send', methods: ['POST'] },
  { path: '/api/location/verify', methods: ['GET', 'POST'] },
  { path: '/api/metrics', methods: ['GET'] },
  { path: '/api/parent/dashboard', methods: ['GET'] },
  { path: '/api/qr/generate', methods: ['GET', 'POST'] },
  { path: '/api/qr/validate', methods: ['POST'] },
  { path: '/api/sessions', methods: ['GET', 'POST'] },
  {
    path: '/api/sessions/00000000-0000-0000-0000-000000000000',
    methods: ['GET', 'PUT', 'DELETE'],
  },
  { path: '/api/student/face-enroll', methods: ['GET', 'POST', 'DELETE'] },
  { path: '/api/students', methods: ['GET', 'POST'] },
  {
    path: '/api/students/00000000-0000-0000-0000-000000000000',
    methods: ['GET', 'PUT', 'DELETE'],
  },
  { path: '/api/teacher/assigned-students', methods: ['GET'] },
  { path: '/api/teacher/dashboard', methods: ['GET'] },
  { path: '/api/teachers', methods: ['GET', 'POST'] },
  {
    path: '/api/teachers/00000000-0000-0000-0000-000000000000',
    methods: ['GET', 'PUT'],
  },
  {
    path: '/api/teachers/00000000-0000-0000-0000-000000000000/rates',
    methods: ['GET', 'POST', 'PUT'],
  },
  { path: '/api/teacher-sessions/active', methods: ['GET'] },
  {
    path: '/api/teacher-sessions/check-in-biometric',
    methods: ['GET', 'POST'],
  },
  { path: '/api/teacher-sessions/check-in-face', methods: ['POST'] },
  { path: '/api/teacher-sessions/face-challenge', methods: ['POST'] },
  {
    path: '/api/teacher-sessions/check-out-biometric',
    methods: ['GET', 'POST'],
  },
  { path: '/api/teacher-sessions/parent', methods: ['GET'] },
  { path: '/api/teacher-sessions/scan', methods: ['GET', 'POST'] },
  { path: '/api/teacher-sessions/unified-checkin', methods: ['GET', 'POST'] },
  { path: '/api/teacher-sessions/verify-face', methods: ['POST'] },
];

/**
 * Routes that are intentionally public. They MUST NOT return user data —
 * keep this list short and reviewed.
 */
const PUBLIC_ROUTES: RouteCase[] = [
  { path: '/api/health', methods: ['GET'] },
  { path: '/api/test', methods: ['GET', 'POST'] },
  { path: '/api/contact-admin', methods: ['POST'] },
];

/**
 * Routes guarded by a shared secret rather than user auth (cron, etc).
 * Verified separately: must reject when secret is absent.
 */
const SECRET_GUARDED_ROUTES: RouteCase[] = [
  { path: '/api/cron/qr-refresh', methods: ['GET'] },
];

const REJECT_STATUSES = [400, 401, 403, 405, 302, 307];

async function callRoute(
  request: APIRequestContext,
  method: Method,
  path: string,
  body?: unknown
) {
  const opts = body !== undefined ? { data: body } : undefined;
  switch (method) {
    case 'GET':
      return request.get(path);
    case 'POST':
      return request.post(path, opts ?? { data: {} });
    case 'PUT':
      return request.put(path, opts ?? { data: {} });
    case 'DELETE':
      return request.delete(path);
    case 'PATCH':
      return request.patch(path, opts ?? { data: {} });
  }
}

test.describe('API contract — unauthenticated requests', () => {
  // Keep these tests independent — no shared auth state.
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of PROTECTED_ROUTES) {
    for (const method of route.methods) {
      test(`${method} ${route.path} rejects unauthenticated`, async ({
        request,
      }) => {
        const res = await callRoute(request, method, route.path, route.body);
        const status = res.status();

        expect(
          REJECT_STATUSES,
          `${method} ${route.path} returned ${status}; expected one of ${REJECT_STATUSES.join(', ')}. ` +
            `If this route is intentionally public, move it to PUBLIC_ROUTES.`
        ).toContain(status);

        // Defense-in-depth: even if status is unexpectedly 200, body must not contain
        // sensitive shapes. Catches misconfigured routes that 200 with empty payloads.
        if (status === 200) {
          const text = await res.text();
          expect(
            text.length,
            `${method} ${route.path} returned 200 with body`
          ).toBe(0);
        }
      });
    }
  }
});

test.describe('API contract — public routes respond', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of PUBLIC_ROUTES) {
    for (const method of route.methods) {
      test(`${method} ${route.path} is reachable`, async ({ request }) => {
        const res = await callRoute(request, method, route.path, route.body);
        // Public routes may legitimately return 4xx for bad input,
        // but must not 5xx and must not 401/403.
        expect(res.status()).toBeLessThan(500);
        expect([401, 403]).not.toContain(res.status());
      });
    }
  }
});

test.describe('API contract — secret-guarded routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of SECRET_GUARDED_ROUTES) {
    for (const method of route.methods) {
      test(`${method} ${route.path} rejects without secret`, async ({
        request,
      }) => {
        const res = await callRoute(request, method, route.path, route.body);
        expect([400, 401, 403]).toContain(res.status());
      });
    }
  }
});
