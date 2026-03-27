import { test, expect } from '@playwright/test';
import { authenticateViaStorage, mockExpensesList, stubSideEffects } from './helpers';

/**
 * Navigation E2E tests.
 *
 * Verifies that switching between the main tabs renders the correct section.
 * Uses the desktop sidebar (ListItemButton with labels) since Playwright uses a
 * desktop viewport by default and the sidebar is more reliable than BottomNavigation.
 */

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaStorage(page);
    await stubSideEffects(page);
    await mockExpensesList(page, []);

    // Stub net-worth endpoint
    await page.route('**/api/net-worth**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('starts on the Home tab', async ({ page }) => {
    // Home tab renders date range controls and the SummaryCards area
    const homeIndicator = page.locator('.MuiListItemButton-root').filter({ hasText: 'Home' });
    await expect(homeIndicator).toBeVisible();
    // The Home tab list item should be selected (has Mui-selected class)
    await expect(homeIndicator).toHaveClass(/Mui-selected/);
  });

  test('navigates to Transactions tab and shows filter controls', async ({ page }) => {
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Transactions' }).click();
    // FilterBar or empty state should be visible on Transactions tab
    await expect(
      page.locator('[placeholder*="Search"], text=No transactions yet, text=Transactions').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('navigates to Net Worth tab', async ({ page }) => {
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Net Worth' }).click();
    await expect(page.getByText('Net Worth')).toBeVisible({ timeout: 5000 });
  });

  test('navigates to Settings tab', async ({ page }) => {
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Settings' }).click();
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 5000 });
  });

  test('navigates back to Home from Settings', async ({ page }) => {
    // Go to Settings first
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Settings' }).click();
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 5000 });

    // Navigate back to Home
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Home' }).click();

    // Home tab selected again
    const homeIndicator = page.locator('.MuiListItemButton-root').filter({ hasText: 'Home' });
    await expect(homeIndicator).toHaveClass(/Mui-selected/, { timeout: 5000 });
  });
});
