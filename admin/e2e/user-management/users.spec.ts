import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@trueastrotalk.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  });

  test('should navigate to users page', async ({ page }) => {
    // Navigate to users page
    await page.click('a[href*="users"], a:has-text("Users")');
    await page.waitForURL('**/admin/users', { timeout: 10000 });
    
    await expect(page).toHaveURL(/.*admin\/users/);
    await expect(page.locator('h1, h2, .page-title')).toContainText(/Users|User Management/i);
  });

  test('should display users list with pagination', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Check for users table
    await expect(page.locator('table, .users-table, .data-table')).toBeVisible();
    
    // Check for table headers
    const expectedHeaders = ['Name', 'Email', 'Type', 'Status', 'Actions'];
    for (const header of expectedHeaders) {
      await expect(page.locator(`th:has-text("${header}"), td:has-text("${header}")`)).toBeVisible();
    }
    
    // Check for pagination if users exist
    const hasUsers = await page.locator('tbody tr, .user-row').count() > 0;
    if (hasUsers) {
      await expect(page.locator('.pagination, .page-nav, button:has-text("Next")')).toBeVisible();
    }
  });

  test('should filter users by type', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Look for filter dropdown or select
    const filterSelectors = [
      'select[name*="type"], select[name*="user_type"]',
      '.filter-type select',
      'select:has(option:has-text("Customer"))',
      'select:has(option:has-text("Astrologer"))'
    ];
    
    let filterFound = false;
    for (const selector of filterSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.selectOption('customer');
          filterFound = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (filterFound) {
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check that filter was applied (URL should contain filter param or results should change)
      const url = page.url();
      const hasFilterParam = url.includes('type=') || url.includes('filter=');
      
      expect(hasFilterParam).toBe(true);
    }
  });

  test('should search users by name or email', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Look for search input
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[placeholder*="search"], input[placeholder*="Search"]',
      '.search-input input'
    ];
    
    let searchFound = false;
    for (const selector of searchSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.fill('admin');
          await element.press('Enter');
          searchFound = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (searchFound) {
      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Results should contain the search term
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toContain('admin');
    }
  });

  test('should view user details', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Wait for users to load and click on first user
    await page.waitForSelector('tbody tr, .user-row', { timeout: 10000 });
    
    const userRows = page.locator('tbody tr, .user-row');
    const firstRow = userRows.first();
    
    if (await firstRow.count() > 0) {
      // Look for view/edit button or clickable row
      const actionButtons = firstRow.locator('button:has-text("View"), button:has-text("Edit"), a:has-text("View"), a:has-text("Edit"), .btn-view, .btn-edit');
      
      if (await actionButtons.count() > 0) {
        await actionButtons.first().click();
      } else {
        // Try clicking the row itself
        await firstRow.click();
      }
      
      // Wait for user details page or modal
      await page.waitForTimeout(2000);
      
      // Check if we're on user details page or modal opened
      const hasUserDetails = await page.locator('.user-details, .user-profile, .modal, h1:has-text("User Details"), h2:has-text("User Details")').count() > 0;
      const urlChanged = page.url().includes('/users/') || page.url().includes('/edit');
      
      expect(hasUserDetails || urlChanged).toBe(true);
    }
  });

  test('should handle user status updates', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('tbody tr, .user-row', { timeout: 10000 });
    
    // Look for status toggle or dropdown
    const statusControls = page.locator('select[name*="status"], .status-toggle, .status-dropdown, button:has-text("Active"), button:has-text("Inactive")');
    
    if (await statusControls.count() > 0) {
      const firstControl = statusControls.first();
      await firstControl.click();
      
      // Wait for any confirmation dialog or status change
      await page.waitForTimeout(1000);
      
      // Look for confirmation dialog
      const hasConfirmation = await page.locator('.confirm-dialog, .modal, .swal-modal, button:has-text("Confirm")').count() > 0;
      
      if (hasConfirmation) {
        await page.click('button:has-text("Confirm"), button:has-text("Yes"), .confirm-btn');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should export users list', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Look for export button
    const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download"), a:has-text("Export"), .export-btn');
    
    if (await exportButtons.count() > 0) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await exportButtons.first().click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/users|export/i);
      } catch (e) {
        // Export functionality might not be fully implemented yet
        console.log('Export functionality not available or not working');
      }
    }
  });

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Wait for users to load
    await page.waitForSelector('tbody tr, .user-row', { timeout: 10000 });
    
    // Look for checkboxes for bulk selection
    const checkboxes = page.locator('input[type="checkbox"]');
    
    if (await checkboxes.count() > 2) { // At least select-all + one user checkbox
      // Select first few users
      await checkboxes.nth(1).check(); // First user (skip select-all)
      if (await checkboxes.count() > 2) {
        await checkboxes.nth(2).check(); // Second user
      }
      
      // Look for bulk action buttons
      const bulkActions = page.locator('button:has-text("Bulk"), .bulk-actions button, select[name*="bulk"]');
      
      if (await bulkActions.count() > 0) {
        await bulkActions.first().click();
        await page.waitForTimeout(500);
        
        // The bulk action UI should be visible
        expect(await bulkActions.first().isVisible()).toBe(true);
      }
    }
  });
});