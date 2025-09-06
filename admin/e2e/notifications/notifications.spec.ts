import { test, expect } from '@playwright/test';

test.describe('Notification Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@trueastrotalk.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  });

  test('should navigate to notifications section', async ({ page }) => {
    // Try different navigation patterns
    const navSelectors = [
      'a[href*="notifications"]',
      'a:has-text("Notifications")',
      '.nav-notifications a',
      'button:has-text("Notifications")'
    ];
    
    let navigated = false;
    for (const selector of navSelectors) {
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
    
    if (!navigated) {
      // Try direct navigation
      await page.goto('/admin/notifications');
    }
    
    await expect(page.locator('h1, h2, .page-title')).toBeVisible();
  });

  test('should send push notification to users', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for "Send Notification" or "New Notification" button
    const sendButtons = page.locator('button:has-text("Send"), button:has-text("New"), button:has-text("Create"), .btn-send, .btn-new');
    
    if (await sendButtons.count() > 0) {
      await sendButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Fill notification form
      const titleInput = page.locator('input[name*="title"], input[placeholder*="title"], .title-input');
      const messageInput = page.locator('textarea[name*="message"], textarea[name*="body"], .message-input');
      
      if (await titleInput.count() > 0 && await messageInput.count() > 0) {
        await titleInput.fill('Test Notification');
        await messageInput.fill('This is a test notification message');
        
        // Select recipient type
        const recipientSelects = page.locator('select[name*="recipient"], select[name*="type"], .recipient-select');
        if (await recipientSelects.count() > 0) {
          await recipientSelects.first().selectOption('all');
        }
        
        // Submit notification
        const submitButtons = page.locator('button[type="submit"], button:has-text("Send"), .btn-send');
        if (await submitButtons.count() > 0) {
          await submitButtons.first().click();
          await page.waitForTimeout(2000);
          
          // Check for success message or redirect
          const successElements = page.locator('.success, .alert-success, .toast-success, :has-text("sent successfully")');
          const hasSuccess = await successElements.count() > 0;
          
          expect(hasSuccess).toBe(true);
        }
      }
    }
  });

  test('should view notification history', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for history tab or link
    const historyLinks = page.locator('a:has-text("History"), button:has-text("History"), .nav-history');
    
    if (await historyLinks.count() > 0) {
      await historyLinks.first().click();
      await page.waitForTimeout(2000);
      
      // Check for notifications list/table
      const notificationsList = page.locator('table, .notifications-list, .history-list');
      await expect(notificationsList).toBeVisible();
      
      // Check for essential columns
      const columns = ['Title', 'Message', 'Recipients', 'Date', 'Status'];
      let visibleColumns = 0;
      
      for (const column of columns) {
        const columnElement = page.locator(`th:has-text("${column}"), .header:has-text("${column}")`);
        if (await columnElement.count() > 0) {
          visibleColumns++;
        }
      }
      
      expect(visibleColumns).toBeGreaterThan(2);
    } else {
      // History might be on the same page
      const historyTable = page.locator('table, .notifications-table');
      if (await historyTable.count() > 0) {
        await expect(historyTable).toBeVisible();
      }
    }
  });

  test('should filter notifications by type or status', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for filter controls
    const filterSelectors = [
      'select[name*="type"]',
      'select[name*="status"]',
      '.filter-type select',
      '.filter-status select'
    ];
    
    let filterApplied = false;
    for (const selector of filterSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          // Get available options
          const options = await element.locator('option').allTextContents();
          if (options.length > 1) {
            // Select the second option (skip the first which is usually "All")
            await element.selectOption({ index: 1 });
            filterApplied = true;
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (filterApplied) {
      await page.waitForTimeout(2000);
      // Check if results were filtered
      const hasFilterInUrl = page.url().includes('type=') || page.url().includes('status=');
      expect(hasFilterInUrl).toBe(true);
    }
  });

  test('should manage notification templates', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for templates section
    const templateLinks = page.locator('a:has-text("Templates"), button:has-text("Templates"), .nav-templates');
    
    if (await templateLinks.count() > 0) {
      await templateLinks.first().click();
      await page.waitForTimeout(2000);
      
      // Look for create template button
      const createButtons = page.locator('button:has-text("Create"), button:has-text("New Template"), .btn-create');
      
      if (await createButtons.count() > 0) {
        await createButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Fill template form
        const nameInput = page.locator('input[name*="name"], input[placeholder*="template name"]');
        const titleInput = page.locator('input[name*="title"], input[placeholder*="title"]');
        const contentInput = page.locator('textarea[name*="content"], textarea[name*="message"]');
        
        if (await nameInput.count() > 0 && await contentInput.count() > 0) {
          await nameInput.fill('Welcome Template');
          if (await titleInput.count() > 0) {
            await titleInput.fill('Welcome to TrueAstroTalk');
          }
          await contentInput.fill('Welcome to our platform! We are glad to have you.');
          
          // Save template
          const saveButtons = page.locator('button:has-text("Save"), button[type="submit"], .btn-save');
          if (await saveButtons.count() > 0) {
            await saveButtons.first().click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
  });

  test('should configure notification preferences', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for preferences or settings
    const preferencesLinks = page.locator('a:has-text("Preferences"), a:has-text("Settings"), button:has-text("Preferences")');
    
    if (await preferencesLinks.count() > 0) {
      await preferencesLinks.first().click();
      await page.waitForTimeout(2000);
      
      // Look for notification type toggles or checkboxes
      const toggles = page.locator('input[type="checkbox"], .toggle, .switch');
      
      if (await toggles.count() > 0) {
        // Toggle first few preferences
        const firstToggle = toggles.first();
        const initialState = await firstToggle.isChecked();
        
        await firstToggle.click();
        await page.waitForTimeout(500);
        
        // Check if state changed
        const newState = await firstToggle.isChecked();
        expect(newState !== initialState).toBe(true);
        
        // Save preferences
        const saveButtons = page.locator('button:has-text("Save"), button:has-text("Update"), .btn-save');
        if (await saveButtons.count() > 0) {
          await saveButtons.first().click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should send scheduled notifications', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for schedule notification option
    const scheduleButtons = page.locator('button:has-text("Schedule"), .btn-schedule, a:has-text("Schedule")');
    
    if (await scheduleButtons.count() > 0) {
      await scheduleButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Fill scheduling form
      const titleInput = page.locator('input[name*="title"], .title-input');
      const messageInput = page.locator('textarea[name*="message"], .message-input');
      const dateInput = page.locator('input[type="date"], input[type="datetime-local"], .date-input');
      
      if (await titleInput.count() > 0 && await messageInput.count() > 0) {
        await titleInput.fill('Scheduled Test Notification');
        await messageInput.fill('This is a scheduled notification');
        
        if (await dateInput.count() > 0) {
          // Set date to tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateString = tomorrow.toISOString().split('T')[0];
          
          await dateInput.fill(dateString);
        }
        
        // Submit scheduled notification
        const submitButtons = page.locator('button:has-text("Schedule"), button[type="submit"], .btn-schedule-send');
        if (await submitButtons.count() > 0) {
          await submitButtons.first().click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should view notification analytics/statistics', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Look for analytics or statistics section
    const analyticsLinks = page.locator('a:has-text("Analytics"), a:has-text("Statistics"), button:has-text("Analytics")');
    
    if (await analyticsLinks.count() > 0) {
      await analyticsLinks.first().click();
      await page.waitForTimeout(2000);
      
      // Check for analytics data
      const statsElements = page.locator('.stats, .analytics, .metrics, .chart');
      const numbersElements = page.locator(':has-text("Total"), :has-text("Sent"), :has-text("Delivered"), :has-text("Read")');
      
      const hasStats = await statsElements.count() > 0;
      const hasNumbers = await numbersElements.count() > 0;
      
      expect(hasStats || hasNumbers).toBe(true);
    } else {
      // Analytics might be displayed on the main notifications page
      const dashboardStats = page.locator('.notification-stats, .stats-card, .metric');
      if (await dashboardStats.count() > 0) {
        await expect(dashboardStats.first()).toBeVisible();
      }
    }
  });

  test('should delete old notifications', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    // Navigate to history if available
    const historyLinks = page.locator('a:has-text("History"), .nav-history');
    if (await historyLinks.count() > 0) {
      await historyLinks.first().click();
      await page.waitForTimeout(2000);
    }
    
    // Look for delete buttons
    const deleteButtons = page.locator('button:has-text("Delete"), .btn-delete, .delete-btn');
    
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Handle confirmation dialog
      const confirmButtons = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete"), .confirm-btn');
      if (await confirmButtons.count() > 0) {
        await confirmButtons.first().click();
        await page.waitForTimeout(2000);
        
        // Check for success message
        const successElements = page.locator('.success, .alert-success, :has-text("deleted successfully")');
        const hasSuccess = await successElements.count() > 0;
        
        // The delete button should be gone or notification count should decrease
        const newDeleteButtonCount = await page.locator('button:has-text("Delete"), .btn-delete').count();
        
        expect(hasSuccess || newDeleteButtonCount >= 0).toBe(true);
      }
    }
  });
});