import { test, expect } from '@playwright/test';
import { authenticateViaStorage, mockExpensesList, stubSideEffects } from './helpers';

test.describe('Theme toggle', () => {
  test('toggles dark mode and persists across reload', async ({ page }) => {
    await authenticateViaStorage(page);
    await stubSideEffects(page);
    await mockExpensesList(page, []);

    await page.route('**/api/net-worth**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    // Override users/me to not return a themePreference so localStorage value is not overwritten
    await page.route('**/api/users/me**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'test-user-id', email: 'test@example.com' }),
      }),
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Settings' }).click();
    await page.waitForLoadState('networkidle');

    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    const darkBtn = page.getByRole('button', { name: 'Dark' });
    await expect(darkBtn).toBeVisible({ timeout: 5000 });
    await darkBtn.click();
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');

    await page.waitForTimeout(200);
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);

    expect(await page.evaluate(() => localStorage.getItem('mf_theme'))).toBe('dark');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.MuiListItemButton-root').filter({ hasText: 'Settings' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('mf_theme'))).toBe('dark');
  });
});
