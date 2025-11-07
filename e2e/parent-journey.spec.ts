import { test, expect } from '@playwright/test';

test.describe('Parent Journey E2E', () => {
  test('parent session loads dashboard with core actions', async ({ page }) => {
    // Seed parent session and users before app scripts load
    await page.addInitScript(() => {
      const parentUser = {
        id: 'user-parent-1',
        name: 'Pat Parent',
        email: 'parent@example.com',
        password: 'password123',
        role: 'parent',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      } as any;
      localStorage.setItem('user', JSON.stringify(parentUser));
      localStorage.setItem('allUsers', JSON.stringify([parentUser]));
    });

    // Go directly to parent dashboard (bypass login redirect logic)
    await page.goto('/parent/dashboard');

    // Ensure dashboard shell renders
    await expect(page.getByRole('heading', { name: /Parent Dashboard/i })).toBeVisible();

    // Validate presence of key actions (no external API calls)
    await expect(page.getByRole('button', { name: /Add Student/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Teacher/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Data Sheets/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage Assignments/i })).toBeVisible();
  });
});


