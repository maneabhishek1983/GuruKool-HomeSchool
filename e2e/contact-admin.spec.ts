import { test, expect } from '@playwright/test';

test.describe('Contact Administrator Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the contact admin page
    await page.goto('/contact-admin');
  });

  test('Contact admin page loads correctly', async ({ page }) => {
    // Verify page title and content (using the actual title)
    await expect(page).toHaveTitle(/Gurukool/);
    await expect(page.locator('h1')).toContainText('Contact Administrator');

    // Check for form elements using different approach
    const formCount = await page.locator('form').count();
    expect(formCount).toBeGreaterThan(0);

    const nameInputCount = await page.locator('input[name="name"]').count();
    expect(nameInputCount).toBeGreaterThan(0);

    const emailInputCount = await page.locator('input[name="email"]').count();
    expect(emailInputCount).toBeGreaterThan(0);

    const messageTextareaCount = await page
      .locator('textarea[name="message"]')
      .count();
    expect(messageTextareaCount).toBeGreaterThan(0);

    const requestTypeSelectCount = await page
      .locator('select[name="requestType"]')
      .count();
    expect(requestTypeSelectCount).toBeGreaterThan(0);
  });

  test('Contact form validation works', async ({ page }) => {
    // Check that required fields are marked as required
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator('textarea[name="message"]');

    await expect(nameInput).toHaveAttribute('required');
    await expect(emailInput).toHaveAttribute('required');
    await expect(messageInput).toHaveAttribute('required');
  });

  test('Contact form submission works', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Fill out the form using different approach
    await page.evaluate(() => {
      const nameInput = document.querySelector(
        'input[name="name"]'
      ) as HTMLInputElement;
      const emailInput = document.querySelector(
        'input[name="email"]'
      ) as HTMLInputElement;
      const messageInput = document.querySelector(
        'textarea[name="message"]'
      ) as HTMLTextAreaElement;
      const requestTypeSelect = document.querySelector(
        'select[name="requestType"]'
      ) as HTMLSelectElement;

      if (nameInput) {
        nameInput.value = 'Test User';
      }
      if (emailInput) {
        emailInput.value = 'test@example.com';
      }
      if (messageInput) {
        messageInput.value = 'This is a test contact request';
      }
      if (requestTypeSelect) {
        requestTypeSelect.value = 'account-creation';
      }
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(
      page.locator('text=Request Submitted Successfully')
    ).toBeVisible();
    await expect(
      page.locator("text=We've received your request")
    ).toBeVisible();
  });

  test('Contact admin link from login page works', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click the contact administrator link using different approach
    await page.evaluate(() => {
      const link = document.querySelector(
        'a[href="/contact-admin"]'
      ) as HTMLAnchorElement;
      if (link) {
        link.click();
      }
    });

    // Should navigate to contact admin page
    await expect(page).toHaveURL('/contact-admin');
    await expect(page.locator('h1')).toContainText('Contact Administrator');
  });

  test('Back to login link works', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click back to login link using different approach
    await page.evaluate(() => {
      const link = document.querySelector(
        'a[href="/login"]'
      ) as HTMLAnchorElement;
      if (link) {
        link.click();
      }
    });

    // Should navigate back to login page
    await expect(page).toHaveURL('/login');
  });

  test('Contact information is displayed correctly', async ({ page }) => {
    // Check that admin email is displayed using different approach
    const emailTextCount = await page
      .locator('text=abhishekumane@gmail.com')
      .count();
    expect(emailTextCount).toBeGreaterThan(0);

    const responseTimeCount = await page.locator('text=24-48 hours').count();
    expect(responseTimeCount).toBeGreaterThan(0);
  });

  test('API endpoint responds correctly', async ({ request }) => {
    // Test the API endpoint directly
    const response = await request.post('/api/contact-admin', {
      data: {
        name: 'API Test User',
        email: 'apitest@example.com',
        message: 'API test message',
        requestType: 'technical-support',
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBeTruthy();
    expect(result.contactId).toBeDefined();
  });
});
