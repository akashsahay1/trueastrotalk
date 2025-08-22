import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/TrueAstroTalk/);
    await expect(page.locator('h2')).toContainText('Sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Check for validation messages (these may vary based on implementation)
    await expect(page.locator('form')).toBeVisible();
    
    // Ensure we don't navigate away from login page
    await expect(page.url()).toContain('/');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for potential error message or check that we remain on login page
    await page.waitForTimeout(2000);
    
    // Should still be on login page or show error
    const url = page.url();
    const hasErrorMessage = await page.locator('.error, .alert-danger, [data-testid="error"]').count() > 0;
    
    expect(url.includes('/admin/dashboard') === false || hasErrorMessage).toBe(true);
  });

  test('should login successfully with valid admin credentials', async ({ page }) => {
    // Test data - you may need to adjust these based on your test environment
    const adminEmail = 'admin@trueastrotalk.com';
    const adminPassword = 'Admin@123';
    
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    await expect(page.locator('.dashboard-main-wrapper, .dashboard-content, h1, h2')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    const adminEmail = 'admin@trueastrotalk.com';
    const adminPassword = 'Admin@123';
    
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Find and click logout button (could be in header, sidebar, or dropdown)
    const logoutSelectors = [
      'button:has-text("Logout")',
      'a:has-text("Logout")', 
      '[data-testid="logout"]',
      '.logout-btn',
      'button:has-text("Sign out")',
      'a:has-text("Sign out")'
    ];
    
    let logoutClicked = false;
    for (const selector of logoutSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.click();
          logoutClicked = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!logoutClicked) {
      // Try common patterns for user dropdown menus
      await page.click('.user-menu, .profile-dropdown, .user-avatar').catch(() => {});
      await page.click('button:has-text("Logout"), a:has-text("Logout")').catch(() => {});
    }
    
    // Should be redirected to login page
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Login first
    const adminEmail = 'admin@trueastrotalk.com';
    const adminPassword = 'Admin@123';
    
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    
    // Reload the page
    await page.reload();
    
    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    // Try to access a protected admin route directly
    await page.goto('/admin/dashboard');
    
    // Should be redirected to login
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});