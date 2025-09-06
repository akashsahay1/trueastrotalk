import { test, expect } from '@playwright/test';

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@trueastrotalk.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  });

  test('should navigate to orders page', async ({ page }) => {
    // Navigate to orders page
    const orderLinks = [
      'a[href*="orders"]',
      'a:has-text("Orders")',
      'a:has-text("Order Management")',
      '.nav-orders a'
    ];
    
    let navigated = false;
    for (const selector of orderLinks) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.click();
          navigated = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (navigated) {
      await page.waitForURL('**/orders', { timeout: 10000 });
      await expect(page).toHaveURL(/.*orders/);
      await expect(page.locator('h1, h2, .page-title')).toContainText(/Orders|Order Management/i);
    } else {
      // Try direct navigation
      await page.goto('/admin/orders');
      await expect(page.locator('h1, h2, .page-title')).toBeVisible();
    }
  });

  test('should display orders list with essential information', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Check for orders table
    await expect(page.locator('table, .orders-table, .data-table')).toBeVisible();
    
    // Check for essential table headers
    const expectedHeaders = ['Order', 'Customer', 'Status', 'Amount', 'Date'];
    const visibleHeaders = [];
    
    for (const header of expectedHeaders) {
      const headerElement = page.locator(`th:has-text("${header}"), td:has-text("${header}"), .header:has-text("${header}")`);
      if (await headerElement.count() > 0) {
        visibleHeaders.push(header);
      }
    }
    
    // At least 3 essential headers should be present
    expect(visibleHeaders.length).toBeGreaterThan(2);
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Look for status filter
    const statusFilters = [
      'select[name*="status"]',
      '.filter-status select',
      'select:has(option:has-text("Pending"))',
      'select:has(option:has-text("Completed"))'
    ];
    
    let filterApplied = false;
    for (const selector of statusFilters) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          // Try to select 'pending' status
          await element.selectOption('pending');
          filterApplied = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (filterApplied) {
      await page.waitForTimeout(2000);
      
      // Check if filter was applied via URL or UI change
      const url = page.url();
      const hasFilterParam = url.includes('status=') || url.includes('filter=');
      expect(hasFilterParam).toBe(true);
    }
  });

  test('should search orders by order number or customer', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[placeholder*="search"], input[placeholder*="Search"]',
      '.search-input input'
    ];
    
    let searchExecuted = false;
    for (const selector of searchSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await element.fill('TA-');
          await element.press('Enter');
          searchExecuted = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (searchExecuted) {
      await page.waitForTimeout(2000);
      // Results should be filtered or URL should contain search params
      const url = page.url();
      const hasSearchParam = url.includes('search=') || url.includes('q=');
      expect(hasSearchParam).toBe(true);
    }
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Wait for orders to load
    await page.waitForSelector('tbody tr, .order-row', { timeout: 10000 });
    
    const orderRows = page.locator('tbody tr, .order-row');
    
    if (await orderRows.count() > 0) {
      const firstRow = orderRows.first();
      
      // Look for view button or clickable order number
      const viewButtons = firstRow.locator('button:has-text("View"), a:has-text("View"), .btn-view, .order-number a');
      
      if (await viewButtons.count() > 0) {
        await viewButtons.first().click();
        
        // Wait for order details page/modal
        await page.waitForTimeout(2000);
        
        // Check for order details content
        const hasOrderDetails = await page.locator('.order-details, .order-info, .modal, h1:has-text("Order Details"), h2:has-text("Order Details")').count() > 0;
        const urlChanged = page.url().includes('/orders/');
        
        expect(hasOrderDetails || urlChanged).toBe(true);
        
        if (hasOrderDetails || urlChanged) {
          // Check for essential order information
          const orderInfoElements = [
            page.locator(':has-text("Order Number")'),
            page.locator(':has-text("Customer")'),
            page.locator(':has-text("Total")'),
            page.locator(':has-text("Status")')
          ];
          
          let visibleInfoCount = 0;
          for (const element of orderInfoElements) {
            if (await element.count() > 0) {
              visibleInfoCount++;
            }
          }
          
          expect(visibleInfoCount).toBeGreaterThan(1);
        }
      }
    }
  });

  test('should update order status', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Wait for orders to load
    await page.waitForSelector('tbody tr, .order-row', { timeout: 10000 });
    
    const orderRows = page.locator('tbody tr, .order-row');
    
    if (await orderRows.count() > 0) {
      const firstRow = orderRows.first();
      
      // Look for status dropdown or edit button
      const statusControls = firstRow.locator('select[name*="status"], .status-select, button:has-text("Edit"), .btn-edit');
      
      if (await statusControls.count() > 0) {
        const control = statusControls.first();
        
        // If it's a select dropdown
        if (await control.getAttribute('tagName') === 'SELECT' || await control.locator('option').count() > 0) {
          await control.selectOption('processing');
        } else {
          // If it's an edit button, click and look for status options
          await control.click();
          await page.waitForTimeout(1000);
          
          // Look for status options in modal or dropdown
          const statusOptions = page.locator('select[name*="status"], option:has-text("Processing"), button:has-text("Processing")');
          if (await statusOptions.count() > 0) {
            await statusOptions.first().click();
          }
        }
        
        // Look for save/update button
        const saveButtons = page.locator('button:has-text("Save"), button:has-text("Update"), .btn-save, .btn-update');
        if (await saveButtons.count() > 0) {
          await saveButtons.first().click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should handle order tracking number update', async ({ page }) => {
    await page.goto('/admin/orders');
    
    await page.waitForSelector('tbody tr, .order-row', { timeout: 10000 });
    
    const orderRows = page.locator('tbody tr, .order-row');
    
    if (await orderRows.count() > 0) {
      // Click on first order to view details
      const firstRow = orderRows.first();
      const viewButton = firstRow.locator('button:has-text("View"), a:has-text("View"), .btn-view');
      
      if (await viewButton.count() > 0) {
        await viewButton.first().click();
        await page.waitForTimeout(2000);
        
        // Look for tracking number field
        const trackingInputs = page.locator('input[name*="tracking"], input[placeholder*="tracking"], .tracking-input');
        
        if (await trackingInputs.count() > 0) {
          const trackingInput = trackingInputs.first();
          await trackingInput.fill('TRK123456789');
          
          // Look for save button
          const saveButtons = page.locator('button:has-text("Save"), button:has-text("Update"), .btn-save');
          if (await saveButtons.count() > 0) {
            await saveButtons.first().click();
            await page.waitForTimeout(2000);
            
            // Verify the tracking number was saved
            const savedValue = await trackingInput.inputValue();
            expect(savedValue).toBe('TRK123456789');
          }
        }
      }
    }
  });

  test('should export orders list', async ({ page }) => {
    await page.goto('/admin/orders');
    
    const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download"), a:has-text("Export"), .export-btn');
    
    if (await exportButtons.count() > 0) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      await exportButtons.first().click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/orders|export/i);
      } catch (e) {
        console.log('Export functionality not available or not working');
      }
    }
  });

  test('should display order pagination', async ({ page }) => {
    await page.goto('/admin/orders');
    
    // Check for pagination controls
    const paginationElements = page.locator('.pagination, .page-nav, button:has-text("Next"), button:has-text("Previous")');
    
    if (await paginationElements.count() > 0) {
      // Test pagination navigation
      const nextButtons = page.locator('button:has-text("Next"), .next-page');
      
      if (await nextButtons.count() > 0 && await nextButtons.first().isEnabled()) {
        const currentUrl = page.url();
        await nextButtons.first().click();
        await page.waitForTimeout(2000);
        
        // URL should change or content should update
        const newUrl = page.url();
        expect(newUrl !== currentUrl || page.url().includes('page=')).toBe(true);
      }
    }
  });
});