import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page with QR code option', async ({ page }) => {
    // Check if login page loads correctly
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Check for QR code option
    await expect(page.getByText(/qr code/i)).toBeVisible();
    
    // Check for traditional login form
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show QR code when QR option is selected', async ({ page }) => {
    // Click on QR code option
    await page.getByText(/qr code/i).click();
    
    // Wait for QR code to appear
    await expect(page.getByTestId('qr-code-display')).toBeVisible();
    
    // Check for refresh button
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('should handle traditional login with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/dashboard|teacher|parent/);
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should handle QR code authentication flow', async ({ page }) => {
    // Mock QR code authentication
    await page.route('**/api/auth/qr/verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          token: 'mock-jwt-token',
          user: { id: '123', role: 'teacher' }
        })
      });
    });

    // Click QR code option
    await page.getByText(/qr code/i).click();
    
    // Wait for QR code
    await expect(page.getByTestId('qr-code-display')).toBeVisible();
    
    // Simulate QR code scan (this would normally be done by mobile app)
    await page.evaluate(() => {
      // Simulate QR code scan event
      window.dispatchEvent(new CustomEvent('qr-scanned', {
        detail: { token: 'mock-qr-token' }
      }));
    });
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should handle logout flow', async ({ page }) => {
    // First login (mock)
    await page.goto('/dashboard');
    
    // Click logout button
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should protect routes from unauthorized access', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/teacher/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should handle role-based access control', async ({ page }) => {
    // Mock teacher login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          token: 'mock-jwt-token',
          user: { id: '123', role: 'teacher' }
        })
      });
    });

    // Login as teacher
    await page.getByLabel(/email/i).fill('teacher@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should access teacher dashboard
    await expect(page).toHaveURL(/teacher/);
    
    // Try to access admin route
    await page.goto('/admin/dashboard');
    
    // Should show access denied or redirect
    await expect(page.getByText(/access denied|unauthorized/i)).toBeVisible();
  });

  test('should handle session timeout', async ({ page }) => {
    // Mock expired token
    await page.route('**/api/auth/verify', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });

    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login with session expired message
    await expect(page).toHaveURL(/login/);
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/login', async route => {
      await route.abort('failed');
    });

    // Try to login
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show network error message
    await expect(page.getByText(/network error|connection failed/i)).toBeVisible();
  });
});
