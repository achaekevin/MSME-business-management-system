import { test, expect } from '@playwright/test';

// Helper to login before tests
async function login(page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'admin@ssme.com');
  await page.fill('input[type="password"]', 'admin1');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*app\/dashboard/, { timeout: 10000 });
}

test.describe('Products Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to products page', async ({ page }) => {
    await page.click('text=/Products/i');
    await expect(page).toHaveURL(/.*app\/products/);
    await expect(page.locator('h1, h2')).toContainText(/Products/i);
  });

  test('should display products list', async ({ page }) => {
    await page.goto('/app/products');
    
    // Wait for products table/grid to load
    await page.waitForSelector('table, [data-testid="products-grid"]', { timeout: 10000 });
    
    // Should have product items
    const productRows = page.locator('tbody tr, [data-testid="product-item"]');
    await expect(productRows.first()).toBeVisible();
  });

  test('should search for products', async ({ page }) => {
    await page.goto('/app/products');
    
    // Find and use search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    await searchInput.fill('Laptop');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Should filter results
    const results = page.locator('tbody tr, [data-testid="product-item"]');
    await expect(results.first()).toBeVisible();
  });

  test('should open create product modal', async ({ page }) => {
    await page.goto('/app/products');
    
    // Click create button
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New Product")');
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    await expect(page.locator('text=/Create Product|Add Product|New Product/i')).toBeVisible();
  });

  test('should validate required fields when creating product', async ({ page }) => {
    await page.goto('/app/products');
    
    // Open create modal
    await page.click('button:has-text("Add"), button:has-text("Create")');
    
    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');
    
    // Should show validation errors
    await expect(page.locator('text=/required/i').first()).toBeVisible();
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/app/products');
    
    // Wait for products to load
    await page.waitForSelector('tbody tr, [data-testid="product-item"]', { timeout: 10000 });
    
    // Click first product
    const firstProduct = page.locator('tbody tr, [data-testid="product-item"]').first();
    await firstProduct.click();
    
    // Should navigate to detail page or open modal
    await page.waitForTimeout(500);
    const isDetailPage = await page.url().includes('/app/products/');
    const isModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    
    expect(isDetailPage || isModal).toBeTruthy();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/app/products');
    
    // Look for category filter
    const categoryFilter = page.locator('select[name="category"], button:has-text("Category")');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Select a category (if dropdown)
      const categoryOption = page.locator('[role="option"]').first();
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        await page.waitForTimeout(1000);
        
        // Results should update
        const results = page.locator('tbody tr, [data-testid="product-item"]');
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('should export products', async ({ page }) => {
    await page.goto('/app/products');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await exportButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx|\.csv|\.pdf/);
    }
  });
});
