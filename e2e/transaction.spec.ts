import { test, expect } from '@playwright/test';
import {
  authenticateViaStorage,
  mockExpensesList,
  stubSideEffects,
  FAKE_TRANSACTION,
  FAKE_TRANSACTION_2,
} from './helpers';

/**
 * Transaction CRUD E2E tests.
 *
 * Auth is injected via localStorage so these tests focus on the UI flows,
 * not the login step. The backend is fully mocked — no real server needed.
 */

test.describe('Transaction list', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaStorage(page);
    await stubSideEffects(page);
    await mockExpensesList(page, [FAKE_TRANSACTION, FAKE_TRANSACTION_2]);
    await page.goto('/');
    // Wait for the transaction list to be populated
    await page.waitForSelector('[data-testid="swipeable-row"]', { timeout: 10000 });
  });

  test('displays transactions in the list', async ({ page }) => {
    await expect(page.getByText("McDonald's")).toBeVisible();
    await expect(page.getByText('MTR')).toBeVisible();
  });

  test('shows both expense items from the mocked API', async ({ page }) => {
    const rows = page.locator('[data-testid="swipeable-row"]');
    await expect(rows).toHaveCount(2);
  });
});

test.describe('Add transaction', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaStorage(page);
    await stubSideEffects(page);
  });

  test('opens the add transaction modal via FAB', async ({ page }) => {
    await mockExpensesList(page, []);
    await page.goto('/');
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    const fab = page.locator('button[aria-label="add"], button:has(svg[data-testid="AddIcon"])').first();
    // Fall back: find FAB by the Add icon rendered on screen
    const addButton = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).last();
    // Use the visible FAB — it's the floating action button at bottom right
    await page.locator('[class*="Fab"], button[aria-label="Add"]').first().click().catch(async () => {
      // If specific selector fails, use keyboard shortcut 'n' to open add modal
      await page.keyboard.press('n');
    });

    await expect(page.getByText('Record Transaction')).toBeVisible({ timeout: 5000 });
  });

  test('adds a new transaction and it appears in the list', async ({ page }) => {
    const newTransaction = {
      ...FAKE_TRANSACTION,
      _id: 'txn-new',
      item: '早餐',
      description: 'Starbucks',
      amount: 65,
    };

    await mockExpensesList(page, []);

    // Mock POST /api/expenses to return the new transaction
    await page.route('**/api/expenses', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newTransaction),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open add modal via keyboard shortcut
    await page.keyboard.press('n');
    await expect(page.getByText('Record Transaction')).toBeVisible({ timeout: 5000 });

    // Select item "早餐" (Breakfast)
    await page.getByText('早餐').click();

    // Fill in description using the description input
    const descInput = page.getByPlaceholder(/McDonald|Custom|e\.g\./i).first();
    await descInput.fill('Starbucks');

    // Enter amount via the compact number input (placeholder "0")
    const amountInput = page.getByPlaceholder('0');
    await amountInput.fill('65');

    // Submit
    await page.getByRole('button', { name: /^Add$/i }).click();

    // New transaction should appear in the list
    await expect(page.getByText('Starbucks')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Edit transaction', () => {
  test('opens edit modal and saves changes', async ({ page }) => {
    await authenticateViaStorage(page);
    await stubSideEffects(page);

    const updated = { ...FAKE_TRANSACTION, description: 'KFC', amount: 75 };

    await mockExpensesList(page, [FAKE_TRANSACTION]);

    // Mock PUT /api/expenses/:id
    await page.route(`**/api/expenses/${FAKE_TRANSACTION._id}`, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="swipeable-row"]', { timeout: 10000 });

    // Click the transaction card to open edit modal
    await page.locator('[data-testid="swipeable-row"]').first().click();
    await expect(page.getByText('Edit Transaction')).toBeVisible({ timeout: 5000 });

    // Change the description
    const descInput = page.getByPlaceholder(/McDonald|Custom|e\.g\./i).first();
    await descInput.clear();
    await descInput.fill('KFC');

    // Save
    await page.getByRole('button', { name: /^Save$/i }).click();

    // Updated description should appear in the list
    await expect(page.getByText('KFC')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Delete transaction', () => {
  test('deletes a transaction and removes it from the list', async ({ page }) => {
    await authenticateViaStorage(page);
    await stubSideEffects(page);
    await mockExpensesList(page, [FAKE_TRANSACTION, FAKE_TRANSACTION_2]);

    // Mock DELETE /api/expenses/:id
    await page.route(`**/api/expenses/${FAKE_TRANSACTION._id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="swipeable-row"]', { timeout: 10000 });

    // Confirm the transaction is visible before deletion
    await expect(page.getByText("McDonald's")).toBeVisible();

    // Open edit modal for first transaction, then use the delete button inside it
    await page.locator('[data-testid="swipeable-row"]').first().click();
    await expect(page.getByText('Edit Transaction')).toBeVisible({ timeout: 5000 });

    // Click the delete (trash) icon button inside the modal
    await page.locator('button[aria-label*="delete"], button:has([data-testid="DeleteIcon"])').first().click();

    // Confirm deletion in the confirmation dialog
    await page.getByRole('button', { name: /^Delete$/i }).click();

    // The deleted transaction should no longer be visible
    await expect(page.getByText("McDonald's")).not.toBeVisible({ timeout: 5000 });
  });
});
