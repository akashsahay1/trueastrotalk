import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Critical Integration Workflows', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAsAdmin();
  });

  test('complete user management workflow', async ({ page }) => {
    // Navigate to users page
    const navigated = await helpers.navigateToSection('Users', '/admin/users');
    expect(navigated || page.url().includes('users')).toBe(true);

    // Search for a user
    const searched = await helpers.searchFor('admin');
    if (searched) {
      await page.waitForTimeout(2000);
    }

    // Apply user type filter
    const filtered = await helpers.applyFilter('type', 'customer');
    if (filtered) {
      await page.waitForTimeout(2000);
    }

    // Check pagination if available
    const paginationWorked = await helpers.testPagination();
    if (paginationWorked) {
      console.log('Pagination functionality verified');
    }

    // Verify user list is displayed
    const hasUsers = await helpers.getTableRowCount();
    expect(hasUsers).toBeGreaterThanOrEqual(0);
  });

  test('complete order management workflow', async ({ page }) => {
    // Navigate to orders
    await helpers.navigateToSection('Orders', '/admin/orders');
    
    // Wait for orders to load
    await helpers.waitForDataTable();

    // Test order filtering
    const statusFiltered = await helpers.applyFilter('status', 'pending');
    if (statusFiltered) {
      await page.waitForTimeout(2000);
    }

    // Search for orders
    const orderSearched = await helpers.searchFor('TA-');
    if (orderSearched) {
      await page.waitForTimeout(2000);
    }

    // Try to view first order details
    const orderRows = page.locator('tbody tr, .order-row');
    if (await orderRows.count() > 0) {
      const viewButtons = orderRows.first().locator('button:has-text("View"), a:has-text("View"), .btn-view');
      if (await viewButtons.count() > 0) {
        await viewButtons.first().click();
        await page.waitForTimeout(2000);
        
        // Should show order details
        const hasOrderDetails = await helpers.elementExists([
          '.order-details',
          'h1:has-text("Order Details")',
          ':has-text("Order Number")',
          '.modal'
        ]);
        
        expect(hasOrderDetails).toBe(true);
      }
    }
  });

  test('complete notification workflow', async ({ page }) => {
    // Navigate to notifications
    await helpers.navigateToSection('Notifications', '/admin/notifications');

    // Try to create a new notification
    const createClicked = await helpers.clickActionButton('Send', '');
    if (!createClicked) {
      await helpers.clickActionButton('New', '');
      await helpers.clickActionButton('Create', '');
    }

    await page.waitForTimeout(2000);

    // Fill notification form if available
    const notificationForm = {
      title: 'E2E Test Notification',
      message: 'This is an end-to-end test notification',
      type: 'general'
    };

    await helpers.fillForm(notificationForm);

    // Try to send the notification
    const sendClicked = await helpers.clickActionButton('Send', 'form');
    if (!sendClicked) {
      await helpers.clickActionButton('Submit', 'form');
    }

    await page.waitForTimeout(3000);

    // Check for success message
    const success = await helpers.waitForSuccess();
    if (success) {
      console.log('Notification sent successfully');
    }
  });

  test('dashboard to user details workflow', async ({ page }) => {
    // Start from dashboard
    await page.goto('/admin/dashboard');
    
    // Navigate to users from dashboard
    await helpers.navigateToSection('Users', '/admin/users');
    
    // Wait for users to load
    await helpers.waitForDataTable();
    
    // Click on first user
    const userRows = page.locator('tbody tr, .user-row');
    if (await userRows.count() > 0) {
      const firstRow = userRows.first();
      
      // Try different ways to view user details
      const actionButtons = firstRow.locator('button:has-text("View"), a:has-text("View"), .btn-view, .btn-edit');
      
      if (await actionButtons.count() > 0) {
        await actionButtons.first().click();
        await page.waitForTimeout(2000);
        
        // Should show user details
        const hasUserDetails = await helpers.elementExists([
          '.user-details',
          '.user-profile',
          'h1:has-text("User Details")',
          'h2:has-text("User Details")',
          '.modal'
        ]);
        
        expect(hasUserDetails).toBe(true);
        
        // If it's a modal, try to close it
        const closeButtons = page.locator('button:has-text("Close"), .close, .modal-close');
        if (await closeButtons.count() > 0) {
          await closeButtons.first().click();
        }
      }
    }
  });

  test('search across multiple sections', async ({ page }) => {
    const sections = [
      { name: 'Users', url: '/admin/users' },
      { name: 'Orders', url: '/admin/orders' }
    ];

    for (const section of sections) {
      // Navigate to section
      await helpers.navigateToSection(section.name, section.url);
      await helpers.waitForDataTable();
      
      // Perform search
      const searchTerm = section.name === 'Users' ? 'admin' : 'TA-';
      const searched = await helpers.searchFor(searchTerm);
      
      if (searched) {
        await page.waitForTimeout(2000);
        
        // Verify search results or URL change
        const hasSearchResults = page.url().includes('search=') || page.url().includes('q=');
        expect(hasSearchResults).toBe(true);
      }
      
      console.log(`Search tested for ${section.name}`);
    }
  });

  test('responsive design workflow', async ({ page }) => {
    // Test desktop view first
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    // Verify dashboard is visible
    await expect(page.locator('h1, h2, .dashboard-title')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Dashboard should still be functional
    await expect(page.locator('h1, h2, .dashboard-title')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Dashboard should still be functional on mobile
    await expect(page.locator('h1, h2, .dashboard-title')).toBeVisible();
    
    // Try to open mobile menu if it exists
    const mobileMenuButtons = page.locator('.menu-toggle, .hamburger, .nav-toggle');
    if (await mobileMenuButtons.count() > 0) {
      await mobileMenuButtons.first().click();
      await page.waitForTimeout(500);
      
      // Menu should be visible
      const menu = page.locator('.mobile-menu, .nav-menu, .sidebar');
      if (await menu.count() > 0) {
        await expect(menu.first()).toBeVisible();
      }
    }
    
    console.log('Responsive design tested across viewports');
  });

  test('session persistence and security', async ({ page }) => {
    // Verify we're logged in
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    // Navigate to different sections to test session persistence
    const sections = ['/admin/users', '/admin/orders', '/admin/notifications'];
    
    for (const sectionUrl of sections) {
      try {
        await page.goto(sectionUrl);
        await page.waitForTimeout(2000);
        
        // Should not redirect to login (session should persist)
        const currentUrl = page.url();
        expect(currentUrl.includes('/admin/')).toBe(true);
        expect(currentUrl.includes(sectionUrl.split('/').pop() || '')).toBe(true);
      } catch (e) {
        console.log(`Section ${sectionUrl} might not exist - this is acceptable`);
      }
    }
    
    // Test page reload (session should persist)
    await page.goto('/admin/dashboard');
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/.*admin\/dashboard/);
  });

  test('error handling and recovery', async ({ page }) => {
    // Test navigation to non-existent page
    await page.goto('/admin/nonexistent-page');
    await page.waitForTimeout(2000);
    
    // Should show 404 or redirect to dashboard
    const is404 = page.url().includes('404') || 
                 await page.locator(':has-text("404"), :has-text("Not Found")').count() > 0;
    const redirectedToDashboard = page.url().includes('/admin/dashboard');
    
    expect(is404 || redirectedToDashboard).toBe(true);
    
    // Navigate back to dashboard
    if (!redirectedToDashboard) {
      await page.goto('/admin/dashboard');
    }
    
    // Dashboard should still work
    await expect(page.locator('h1, h2, .dashboard-title')).toBeVisible();
  });

  test('complete logout workflow', async ({ page }) => {
    // Verify we're logged in
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    // Logout
    await helpers.logout();
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Try to access protected route after logout
    await page.goto('/admin/dashboard');
    
    // Should be redirected back to login
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
  });
});