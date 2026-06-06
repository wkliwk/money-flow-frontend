import { test, expect } from '@playwright/test';
import { authenticateViaStorage, mockExpensesList } from './helpers';

test.describe('Theme toggle', () => {
  test('toggles dark mode and persists across reload', async ({ page }) => {
    await authenticateViaStorage(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('mf_onboarding_complete', 'true');
    });
    await page.route('**/openexchangerates.org/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rates: {} }) }),
    );
    await page.route('**/api/expenses/last-amounts**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
    );
    await page.route('**/api/budgets**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/recurring**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/expenses/price-history/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [], avg: null }) }),
    );
    await page.route('**/api/users/me**', async (route) => {
      const themePreference = (await page.evaluate(() => window.localStorage.getItem('mf_theme'))) ?? 'system';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'test-user-id', email: 'test@example.com', themePreference }),
      });
    });
    await page.route('**/api/users/preferences**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.continue();
    });
    await mockExpensesList(page, []);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Settings' }).click();
    await page.waitForLoadState('networkidle');

    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');

    await page.waitForTimeout(200);
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Settings' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.evaluate(() => localStorage.getItem('mf_theme'))).resolves.toBe('dark');
  });
});
