import { Page } from '@playwright/test';

/**
 * Injects a fake JWT into localStorage so ProtectedRoute treats the user as logged in.
 * The token only needs to be a valid base64-encoded payload — no real signature check on
 * the frontend (ProtectedRoute simply checks `!!localStorage.getItem('mf_token')`).
 */
export const FAKE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  btoa(JSON.stringify({ userId: 'test-user-id', email: 'test@example.com', iat: 9999999999 })).replace(/=/g, '') +
  '.fake-sig';

export const FAKE_TRANSACTION = {
  _id: 'txn-001',
  item: '午餐',
  description: "McDonald's",
  amount: 50,
  type: 'expense',
  category: 'Food & Drink',
  date: new Date().toISOString(),
  owner: 'test-user-id',
  paymentMethod: 'cash',
  participants: [],
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const FAKE_TRANSACTION_2 = {
  _id: 'txn-002',
  item: '車費',
  description: 'MTR',
  amount: 12,
  type: 'expense',
  category: 'Transport',
  date: new Date().toISOString(),
  owner: 'test-user-id',
  paymentMethod: 'octopus',
  participants: [],
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** Sets the mf_token in localStorage before any page script runs. */
export async function authenticateViaStorage(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    window.localStorage.setItem('mf_token', token);
  }, FAKE_TOKEN);
}

/** Mocks the GET /api/expenses endpoint to return the provided list. */
export async function mockExpensesList(page: Page, transactions: object[]): Promise<void> {
  await page.route('**/api/expenses**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: transactions, total: transactions.length, page: 1, pages: 1 }),
    });
  });
}

/** Mocks the GET /api/expenses/:id endpoint. */
export async function mockGetExpense(page: Page, transaction: { _id: string } & object): Promise<void> {
  await page.route(`**/api/expenses/${transaction._id}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(transaction),
      });
    } else {
      await route.continue();
    }
  });
}

/** Stub out non-critical external APIs that would fail in test. */
export async function stubSideEffects(page: Page): Promise<void> {
  // Exchange rates
  await page.route('**/openexchangerates.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rates: {} }) }),
  );
  // Last amounts hint
  await page.route('**/api/expenses/last-amounts**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
  );
  // Budgets
  await page.route('**/api/budgets**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
  // Recurring
  await page.route('**/api/recurring**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
  // User preferences
  await page.route('**/api/users/me**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ _id: 'test-user-id', email: 'test@example.com', themePreference: 'system' }),
    }),
  );
  // Price history
  await page.route('**/api/expenses/price-history/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [], avg: null }) }),
  );
}
