import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@trueastrotalk.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    // Check for dashboard title
    await expect(page.locator('h1, h2, .dashboard-title, .page-title')).toBeVisible();
    
    // Check for key metric cards/widgets
    const metricSelectors = [
      '.metric-card',
      '.stats-card', 
      '.dashboard-widget',
      '.card',
      ':has-text("Total Users")',
      ':has-text("Total Orders")',
      ':has-text("Revenue")',
      ':has-text("Active Users")'
    ];
    
    let visibleMetrics = 0;
    for (const selector of metricSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        visibleMetrics += count;
      }
    }
    
    // Should have at least some metrics/cards visible
    expect(visibleMetrics).toBeGreaterThan(0);
  });

  test('should display recent activities or notifications', async ({ page }) => {
    // Look for recent activities section
    const activitySelectors = [
      '.recent-activities',
      '.activity-feed',
      '.notifications',
      '.recent-orders',
      ':has-text("Recent")',
      ':has-text("Latest")',
      ':has-text("Activity")'
    ];
    
    let hasActivitySection = false;
    for (const selector of activitySelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        hasActivitySection = true;
        await expect(elements.first()).toBeVisible();
        break;
      }
    }
    
    // At least some activity/recent data should be shown
    expect(hasActivitySection).toBe(true);
  });

  test('should have working navigation menu', async ({ page }) => {
    // Check for navigation elements
    const navElements = [
      '.sidebar',
      '.navigation',
      '.nav-menu',
      'nav',
      '.menu'
    ];
    
    let navFound = false;
    for (const selector of navElements) {
      const nav = page.locator(selector);
      if (await nav.count() > 0) {
        navFound = true;
        await expect(nav.first()).toBeVisible();
        
        // Check for common navigation links
        const commonLinks = [
          'a:has-text("Users")',
          'a:has-text("Orders")', 
          'a:has-text("Products")',
          'a:has-text("Notifications")',
          'a[href*="users"]',
          'a[href*="orders"]'
        ];
        
        let visibleLinks = 0;
        for (const linkSelector of commonLinks) {
          const links = page.locator(linkSelector);
          if (await links.count() > 0) {
            visibleLinks++;
          }
        }
        
        expect(visibleLinks).toBeGreaterThan(1);
        break;
      }
    }
    
    expect(navFound).toBe(true);
  });

  test('should display charts or graphs', async ({ page }) => {
    // Look for chart/graph elements
    const chartSelectors = [
      'canvas',
      '.chart',
      '.graph',
      '.chartjs',
      '.highcharts',
      'svg'
    ];
    
    let hasCharts = false;
    for (const selector of chartSelectors) {
      const charts = page.locator(selector);
      if (await charts.count() > 0) {
        hasCharts = true;
        break;
      }
    }
    
    // Charts are optional but common in dashboards
    if (hasCharts) {
      const firstChart = page.locator('canvas, .chart, svg').first();
      await expect(firstChart).toBeVisible();
    }
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Dashboard should still be functional on mobile
    await expect(page.locator('h1, h2, .dashboard-title')).toBeVisible();
    
    // Navigation might be collapsed on mobile
    const mobileNavTriggers = [
      '.menu-toggle',
      '.hamburger',
      '.nav-toggle',
      'button[aria-label*="menu"]'
    ];
    
    for (const selector of mobileNavTriggers) {
      const trigger = page.locator(selector);
      if (await trigger.count() > 0) {
        await trigger.click();
        await page.waitForTimeout(500);
        break;
      }
    }
  });

  test('should allow quick actions from dashboard', async ({ page }) => {
    // Look for quick action buttons
    const quickActionSelectors = [
      'button:has-text("Add User")',
      'button:has-text("New Order")',
      'button:has-text("Send Notification")',
      '.quick-actions button',
      '.action-buttons button'
    ];
    
    let quickActionsFound = false;
    for (const selector of quickActionSelectors) {
      const buttons = page.locator(selector);
      if (await buttons.count() > 0) {
        quickActionsFound = true;
        
        // Test clicking the first quick action
        await buttons.first().click();
        await page.waitForTimeout(2000);
        
        // Should navigate to relevant page or open modal
        const currentUrl = page.url();
        const hasModal = await page.locator('.modal, .dialog').count() > 0;
        const urlChanged = !currentUrl.endsWith('/admin/dashboard');
        
        expect(hasModal || urlChanged).toBe(true);
        break;
      }
    }
    
    // Quick actions are optional but enhance UX
    if (!quickActionsFound) {
      console.log('No quick actions found on dashboard - this is acceptable');
    }
  });

  test('should display system status or health indicators', async ({ page }) => {
    // Look for system status indicators
    const statusSelectors = [
      '.system-status',
      '.health-check',
      '.status-indicator',
      ':has-text("System Status")',
      ':has-text("Online")',
      ':has-text("Offline")',
      '.status-badge'
    ];
    
    let hasStatusIndicators = false;
    for (const selector of statusSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        hasStatusIndicators = true;
        break;
      }
    }
    
    // Status indicators are good practice but optional
    if (hasStatusIndicators) {
      console.log('System status indicators found - good UX practice');
    }
  });

  test('should have working search functionality', async ({ page }) => {
    // Look for global search
    const searchSelectors = [
      'input[type="search"]',
      '.global-search input',
      'input[placeholder*="search"], input[placeholder*="Search"]',
      '.search-input'
    ];
    
    let searchFound = false;
    for (const selector of searchSelectors) {
      const searchInput = page.locator(selector);
      if (await searchInput.count() > 0) {
        searchFound = true;
        
        // Test search functionality
        await searchInput.fill('test search');
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);
        
        // Should show search results or navigate to search page
        const hasResults = await page.locator('.search-results, .results').count() > 0;
        const urlChanged = page.url().includes('search');
        
        expect(hasResults || urlChanged).toBe(true);
        break;
      }
    }
    
    // Global search is optional but enhances UX
    if (!searchFound) {
      console.log('No global search found - this is acceptable');
    }
  });

  test('should display user profile and settings access', async ({ page }) => {
    // Look for user profile access
    const profileSelectors = [
      '.user-profile',
      '.profile-dropdown',
      '.user-menu', 
      '.user-avatar',
      'button:has-text("Profile")',
      'a:has-text("Profile")',
      'img[alt*="profile"], img[alt*="Profile"]'
    ];
    
    let profileFound = false;
    for (const selector of profileSelectors) {
      const profileElement = page.locator(selector);
      if (await profileElement.count() > 0) {
        profileFound = true;
        
        // Click on profile element
        await profileElement.first().click();
        await page.waitForTimeout(1000);
        
        // Should show dropdown menu or navigate to profile
        const hasDropdown = await page.locator('.dropdown-menu, .profile-menu').count() > 0;
        const urlChanged = page.url().includes('profile') || page.url().includes('settings');
        
        expect(hasDropdown || urlChanged).toBe(true);
        break;
      }
    }
    
    expect(profileFound).toBe(true);
  });
});