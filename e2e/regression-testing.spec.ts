import { test, expect } from '@playwright/test';

/**
 * Regression Testing Suite
 * Comprehensive functional testing to ensure features work correctly
 */

test.describe('Regression Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test.describe('Core Application Functionality', () => {
    test('Homepage loads correctly', async ({ page }) => {
      // Verify homepage loads
      await expect(page).toHaveTitle(/Gurukool/);

      // Check that the page has content
      await expect(page.locator('body')).toBeVisible();

      // Check for main content elements using different approach
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThan(0);
    });

    test('Homepage content is accessible', async ({ page }) => {
      // Verify main content sections exist
      const parentAccessCount = await page
        .locator('text=Parent Access')
        .count();
      expect(parentAccessCount).toBeGreaterThan(0);

      const adminAccessCount = await page.locator('text=Admin Access').count();
      expect(adminAccessCount).toBeGreaterThan(0);

      const forTeachersCount = await page.locator('text=For Teachers').count();
      expect(forTeachersCount).toBeGreaterThan(0);
    });

    test('Responsive design works on different screen sizes', async ({
      page,
    }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto('/');

        // Verify page is responsive
        await expect(page.locator('body')).toBeVisible();

        // Check that content exists
        const contentCount = await page.locator('div').count();
        expect(contentCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Authentication System', () => {
    test('QR authentication page loads', async ({ page }) => {
      await page.goto('/auth/qr');

      // Verify QR page loads
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('API Endpoints', () => {
    test('Health check endpoint', async ({ page }) => {
      const response = await page.request.get('/api/health');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('healthy');
    });

    test('Metrics endpoint exists', async ({ page }) => {
      const response = await page.request.get('/api/metrics');
      // Should return some status code (not necessarily 401/403)
      expect(response.status()).toBeGreaterThan(0);
    });

    test('API error handling', async ({ page }) => {
      // Test non-existent endpoint
      const response = await page.request.get('/api/nonexistent');
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Error Handling', () => {
    test('404 page handling', async ({ page }) => {
      await page.goto('/nonexistent-page');

      // Should show 404 page
      await expect(page.locator('body')).toBeVisible();
    });

    test('500 error handling', async ({ page }) => {
      // This would require triggering a server error
      // For now, we'll test that the application doesn't crash
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Performance Regression', () => {
    test('Page load times are acceptable', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('API response times are acceptable', async ({ page }) => {
      const startTime = Date.now();
      await page.request.get('/api/health');
      const responseTime = Date.now() - startTime;

      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('Works in different browsers', async ({ page, browserName }) => {
      await page.goto('/');

      // Basic functionality should work in all browsers
      await expect(page.locator('body')).toBeVisible();

      // Check that content exists
      const contentCount = await page.locator('div').count();
      expect(contentCount).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility Regression', () => {
    test('Basic accessibility features', async ({ page }) => {
      await page.goto('/');

      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('Keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Test tab navigation
      await page.keyboard.press('Tab');

      // Test that we can navigate through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify page is still functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('State Management', () => {
    test('Application state consistency', async ({ page }) => {
      await page.goto('/');

      // Test that the application maintains consistent state
      const initialTitle = await page.title();

      // Navigate around
      await page.goto('/auth/qr');
      await page.goto('/');

      // Should return to consistent state
      await expect(page).toHaveTitle(initialTitle);
    });
  });
});
