import { test, expect } from '@playwright/test';

test.describe('PolicyManager Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Check if we are redirected to login
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'rajanbpatel2017@gmail.com');
      await page.fill('input[type="password"]', 'Admin@123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });

  test('should display dashboard statistics', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for premium cards
    const statsCards = page.locator('.stats-card');
    await expect(statsCards).toHaveCount({ min: 3 });
  });

  test('should open command palette with Cmd+K', async ({ page }) => {
    // Simulate Cmd+K (Meta+K) or Ctrl+K
    await page.keyboard.press('Control+k');
    
    const palette = page.locator('.command-modal');
    await expect(palette).toBeVisible();
    
    const input = palette.locator('input');
    await expect(input).toHavePlaceholder(/Type a command/);
  });

  test('should navigate to policies page', async ({ page }) => {
    await page.click('nav a:has-text("Policies")');
    await expect(page).toHaveURL(/.*policies/);
    await expect(page.locator('h2')).toContainText('Policy Inventory');
  });

  test('should verify tax planner access', async ({ page }) => {
    await page.click('nav a:has-text("Tax Planner")');
    await expect(page).toHaveURL(/.*tax-planner/);
    await expect(page.locator('h1')).toContainText('Tax Intelligence');
  });
});
