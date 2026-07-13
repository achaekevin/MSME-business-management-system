import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/MSME/);
    await expect(page.locator('h1')).toContainText('Run Your Entire Business');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*auth\/login/);
    await expect(page.locator('h1, h2')).toContainText(/Login|Sign In/i);
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', 'admin@ssme.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin1');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*app\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*app\/dashboard/);
    
    // Verify dashboard elements
    await expect(page.locator('text=/Dashboard|Welcome/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid.*credentials|login failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=/Sign Up|Register|Create Account/i');
    await expect(page).toHaveURL(/.*auth\/register/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@ssme.com');
    await page.fill('input[type="password"]', 'admin1');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*app\/dashboard/);
    
    // Logout
    await page.click('[aria-label*="menu"], [aria-label*="user"], button:has-text("admin")');
    await page.click('text=/Logout|Sign Out/i');
    
    // Should redirect to login or landing
    await page.waitForURL(/.*\/(auth\/login|$)/, { timeout: 5000 });
  });
});
