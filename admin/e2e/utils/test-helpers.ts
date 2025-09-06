import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(public page: Page) {}

  /**
   * Login as admin with default credentials
   */
  async loginAsAdmin() {
    await this.page.goto('/');
    await this.page.fill('input[type="email"]', 'admin@trueastrotalk.com');
    await this.page.fill('input[type="password"]', 'Admin@123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  }

  /**
   * Navigate to a section with fallback strategies
   */
  async navigateToSection(sectionName: string, fallbackUrl?: string) {
    const navSelectors = [
      `a[href*="${sectionName.toLowerCase()}"]`,
      `a:has-text("${sectionName}")`,
      `.nav-${sectionName.toLowerCase()} a`,
      `button:has-text("${sectionName}")`
    ];
    
    let navigated = false;
    for (const selector of navSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await element.click();
          navigated = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!navigated && fallbackUrl) {
      await this.page.goto(fallbackUrl);
    }
    
    return navigated;
  }

  /**
   * Wait for table/list to load
   */
  async waitForDataTable() {
    await this.page.waitForSelector('table, .data-table, .list-container', { timeout: 10000 });
  }

  /**
   * Find and fill search input
   */
  async searchFor(searchTerm: string) {
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[placeholder*="search"], input[placeholder*="Search"]',
      '.search-input input'
    ];
    
    for (const selector of searchSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await element.fill(searchTerm);
          await element.press('Enter');
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Apply filter with fallback strategies
   */
  async applyFilter(filterType: string, filterValue: string) {
    const filterSelectors = [
      `select[name*="${filterType}"]`,
      `.filter-${filterType} select`,
      `select:has(option:has-text("${filterValue}"))`
    ];
    
    for (const selector of filterSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await element.selectOption(filterValue);
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Click action button with multiple strategies
   */
  async clickActionButton(action: string, context?: string) {
    const actionSelectors = [
      `button:has-text("${action}")`,
      `a:has-text("${action}")`,
      `.btn-${action.toLowerCase()}`,
      `.${action.toLowerCase()}-btn`
    ];
    
    if (context) {
      // Add context-specific selectors
      actionSelectors.unshift(`${context} button:has-text("${action}")`);
      actionSelectors.unshift(`${context} .btn-${action.toLowerCase()}`);
    }
    
    for (const selector of actionSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await element.first().click();
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Fill form with data object
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const inputSelectors = [
        `input[name="${field}"]`,
        `textarea[name="${field}"]`,
        `select[name="${field}"]`,
        `input[placeholder*="${field}"]`,
        `.${field}-input`,
        `#${field}`
      ];
      
      for (const selector of inputSelectors) {
        try {
          const element = this.page.locator(selector);
          if (await element.count() > 0) {
            const tagName = await element.getAttribute('tagName');
            
            if (tagName === 'SELECT') {
              await element.selectOption(value);
            } else {
              await element.fill(value);
            }
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  /**
   * Wait for success message or confirmation
   */
  async waitForSuccess() {
    const successSelectors = [
      '.success',
      '.alert-success',
      '.toast-success',
      '.swal-success',
      ':has-text("successfully")',
      ':has-text("Success")'
    ];
    
    for (const selector of successSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Handle confirmation dialogs
   */
  async confirmAction() {
    await this.page.waitForTimeout(1000);
    
    const confirmSelectors = [
      'button:has-text("Confirm")',
      'button:has-text("Yes")',
      'button:has-text("OK")',
      '.confirm-btn',
      '.swal-confirm'
    ];
    
    for (const selector of confirmSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await element.click();
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Check if element exists with multiple selectors
   */
  async elementExists(selectors: string[]) {
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Get table row count
   */
  async getTableRowCount() {
    const rowSelectors = ['tbody tr', '.data-row', '.list-item'];
    
    for (const selector of rowSelectors) {
      try {
        const elements = this.page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          return count;
        }
      } catch (e) {
        continue;
      }
    }
    
    return 0;
  }

  /**
   * Test pagination functionality
   */
  async testPagination() {
    const paginationSelectors = [
      'button:has-text("Next")',
      '.next-page',
      '.pagination button:last-child'
    ];
    
    for (const selector of paginationSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0 && await element.isEnabled()) {
          const currentUrl = this.page.url();
          await element.click();
          await this.page.waitForTimeout(2000);
          
          const newUrl = this.page.url();
          return newUrl !== currentUrl || newUrl.includes('page=');
        }
      } catch (e) {
        continue;
      }
    }
    
    return false;
  }

  /**
   * Logout from admin panel
   */
  async logout() {
    const logoutSelectors = [
      'button:has-text("Logout")',
      'a:has-text("Logout")',
      'button:has-text("Sign out")',
      'a:has-text("Sign out")',
      '.logout-btn'
    ];
    
    for (const selector of logoutSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.count() > 0) {
          await element.click();
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Wait for redirect to login
    await this.page.waitForURL('/', { timeout: 10000 });
  }
}

export const testCredentials = {
  admin: {
    email: 'admin@trueastrotalk.com',
    password: 'Admin@123'
  }
};

export const testData = {
  user: {
    name: 'Test User',
    email: 'testuser@example.com',
    phone: '+1234567890'
  },
  notification: {
    title: 'Test Notification',
    message: 'This is a test notification message'
  },
  order: {
    trackingNumber: 'TRK123456789'
  }
};