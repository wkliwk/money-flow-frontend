import { test, expect } from '@playwright/test';

/**
 * Login flow tests.
 *
 * These tests run against the served build. They mock the backend auth endpoint
 * so no real server is required.
 */

const API_LOGIN_URL = '**/auth/login';
const VALID_EMAIL = 'test@example.com';
const VALID_PASSWORD = 'password123';
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c3ItMDAxIn0.fake';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure no stale auth token between tests
    await page.addInitScript(() => window.localStorage.clear());
  });

  test('renders the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Money Flow')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.route(API_LOGIN_URL, (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      }),
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel(/Password/i).fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL('/login');
  });

  test('redirects to dashboard after successful login', async ({ page }) => {
    // Stub auth endpoint
    await page.route(API_LOGIN_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: FAKE_JWT }),
      }),
    );
    // Stub downstream data endpoints so MainLayout loads without errors
    await page.route('**/api/expenses**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0, page: 1, pages: 1 }) }),
    );
    await page.route('**/api/budgets**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/recurring**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/users/me**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ _id: 'usr-001', email: VALID_EMAIL, themePreference: 'system' }) }),
    );
    await page.route('**/api/expenses/last-amounts**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
    );

    await page.goto('/login');
    await page.getByLabel('Email').fill(VALID_EMAIL);
    await page.getByLabel(/Password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // After login the app navigates to "/" (MainLayout)
    await expect(page).toHaveURL('/');
  });

  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('shows sign up link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /Sign up/i })).toBeVisible();
  });
});
