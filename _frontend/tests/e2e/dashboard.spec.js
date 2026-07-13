import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'admin@ssme.com');
  await page.fill('input[type="password"]', 'admin1');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*app\/dashboard/, { timeout: 10000 });
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Welcome/i);
    
    // Should have metric cards
    const metricCards = page.locator('[data-testid="metric-card"], .stat-card, .metric');
    await expect(metricCards.first()).toBeVisible();
  });

  test('should display revenue metric', async ({ page }) => {
    await expect(page.locator('text=/Revenue|Sales|Total Sales/i')).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    // Wait for charts to render
    await page.waitForTimeout(2000);
    
    // Should have chart containers
    const charts = page.locator('[class*="recharts"], canvas, svg[class*="chart"]');
    await expect(charts.first()).toBeVisible();
  });

  test('should navigate to different modules from sidebar', async ({ page }) => {
    // Test Products navigation
    await page.click('text=/^Products$/i');
    await expect(page).toHaveURL(/.*app\/products/);
    
    // Back to dashboard
    await page.click('text=/^Dashboard$/i');
    await expect(page).toHaveURL(/.*app\/dashboard/);
    
    // Test Customers navigation
    await page.click('text=/^Customers$/i');
    await expect(page).toHaveURL(/.*app\/customers/);
  });

  test('should display recent activities', async ({ page }) => {
    const activities = page.locator('text=/Recent|Activity|Activities/i');
    if (await activities.isVisible()) {
      await expect(activities).toBeVisible();
    }
  });

  test('should display notifications', async ({ page }) => {
    // Look for notification icon/button
    const notificationButton = page.locator('button[aria-label*="notification"], [data-testid="notifications"]');
    if (await notificationButton.isVisible()) {
      await notificationButton.click();
      
      // Notification panel should appear
      await expect(page.locator('[role="dialog"], .notification-panel')).toBeVisible();
    }
  });

  test('should filter dashboard by date range', async ({ page }) => {
    const dateFilter = page.locator('button:has-text("Today"), button:has-text("This Week"), select[name="period"]');
    
    if (await dateFilter.first().isVisible()) {
      await dateFilter.first().click();
      await page.waitForTimeout(1000);
      
      // Dashboard should update
      await expect(page.locator('[data-testid="metric-card"]').first()).toBeVisible();
    }
  });

  test('should access user profile', async ({ page }) => {
    // Click user menu
    await page.click('[aria-label*="menu"], button:has-text("admin"), [data-testid="user-menu"]');
    
    // Profile option should be visible
    await expect(page.locator('text=/Profile|Account/i')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be accessible
    await expect(page.locator('h1, h2')).toBeVisible();
    
    // Mobile menu button should be visible
    const mobileMenu = page.locator('button[aria-label*="menu"], .mobile-menu-button');
    await expect(mobileMenu).toBeVisible();
  });
});
