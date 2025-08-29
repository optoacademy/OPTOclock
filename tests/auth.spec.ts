import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation', () => {
  test('should allow an admin to log in and navigate to the employees page', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Fichaje SaaS/);

    // 2. Fill in the login form
    // Note: This test requires the demo users to be created in Supabase.
    await page.getByLabel('Email').fill('admin@demo.com');
    await page.getByLabel('Password').fill('password123');

    // 3. Click the login button
    await page.getByRole('button', { name: 'Login with Password' }).click();

    // 4. Wait for navigation and verify the destination
    // The middleware should redirect to a dashboard page.
    await page.waitForURL('**/admin');

    // 5. Navigate to the employees page (assuming a link exists or direct nav)
    // For this test, we'll navigate directly.
    await page.goto('/admin/employees');

    // 6. Verify the page content
    await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
  });
});
