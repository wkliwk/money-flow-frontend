import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AppThemeProvider, useThemePreference } from '../../../ThemeContext';
import { getStoredThemePreference, storeThemePreference } from '../../../theme';

// Must be hoisted before any imports of ThemeContext/services
jest.mock('../../../services/auth', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
  isAuthenticated: jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  getUserMe: jest.fn(),
  patchUserPreferences: jest.fn(),
  getExpenses: jest.fn(),
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  getExchangeRates: jest.fn(),
  getBudgets: jest.fn(),
  saveBudgets: jest.fn(),
  getRecurring: jest.fn(),
  createRecurring: jest.fn(),
  deleteRecurringAPI: jest.fn(),
  getNetWorth: jest.fn(),
  getLatestNetWorth: jest.fn(),
  createNetWorth: jest.fn(),
  deleteNetWorthSnapshot: jest.fn(),
}));

import * as authService from '../../../services/auth';
import * as api from '../../../services/api';

const mockedGetToken = authService.getToken as jest.Mock;
const mockedGetUserMe = api.getUserMe as jest.Mock;
const mockedPatchUserPreferences = api.patchUserPreferences as jest.Mock;

const ThemeDisplay: React.FC = () => {
  const { preference, isDark, setPreference } = useThemePreference();
  return (
    <div>
      <span data-testid="pref">{preference}</span>
      <span data-testid="dark">{isDark ? 'dark' : 'light'}</span>
      <button onClick={() => setPreference('light')}>set-light</button>
      <button onClick={() => setPreference('dark')}>set-dark</button>
      <button onClick={() => setPreference('system')}>set-system</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.removeItem('mf_theme');
    jest.clearAllMocks();
    mockedGetToken.mockReturnValue(null);
    mockedGetUserMe.mockResolvedValue({ _id: 'u1', email: 'a@b.com', themePreference: 'system' });
    mockedPatchUserPreferences.mockResolvedValue(undefined);
  });

  it('defaults to system preference', () => {
    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('pref').textContent).toBe('system');
  });

  it('reads stored preference from localStorage', () => {
    storeThemePreference('light');
    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('pref').textContent).toBe('light');
    expect(screen.getByTestId('dark').textContent).toBe('light');
  });

  it('updates preference and persists to localStorage', () => {
    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );
    fireEvent.click(screen.getByText('set-dark'));
    expect(screen.getByTestId('pref').textContent).toBe('dark');
    expect(screen.getByTestId('dark').textContent).toBe('dark');
    expect(getStoredThemePreference()).toBe('dark');
  });

  it('switches from dark to light', () => {
    storeThemePreference('dark');
    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );
    expect(screen.getByTestId('dark').textContent).toBe('dark');
    fireEvent.click(screen.getByText('set-light'));
    expect(screen.getByTestId('dark').textContent).toBe('light');
  });

  it('system preference responds to matchMedia', () => {
    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );
    // matchMedia mock returns true for (prefers-color-scheme: dark)
    expect(screen.getByTestId('pref').textContent).toBe('system');
    expect(screen.getByTestId('dark').textContent).toBe('dark');
  });
});

describe('ThemeContext — backend sync', () => {
  beforeEach(() => {
    localStorage.removeItem('mf_theme');
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedPatchUserPreferences.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('applies themePreference from GET /api/users/me on mount when authenticated', async () => {
    mockedGetToken.mockReturnValue('tok');
    mockedGetUserMe.mockResolvedValue({ _id: 'u1', email: 'a@b.com', themePreference: 'light' });

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pref').textContent).toBe('light');
    });
    expect(screen.getByTestId('dark').textContent).toBe('light');
    expect(localStorage.getItem('mf_theme')).toBe('light');
  });

  it('overwrites localStorage value with server preference', async () => {
    storeThemePreference('dark');
    mockedGetToken.mockReturnValue('tok');
    mockedGetUserMe.mockResolvedValue({ _id: 'u1', email: 'a@b.com', themePreference: 'light' });

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    // Initially dark from localStorage
    expect(screen.getByTestId('pref').textContent).toBe('dark');

    await waitFor(() => {
      expect(screen.getByTestId('pref').textContent).toBe('light');
    });
    expect(localStorage.getItem('mf_theme')).toBe('light');
  });

  it('does not call getUserMe when not authenticated', async () => {
    mockedGetToken.mockReturnValue(null);

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockedGetUserMe).not.toHaveBeenCalled();
  });

  it('calls PATCH /api/users/preferences after debounce when preference changes', async () => {
    mockedGetToken.mockReturnValue('tok');
    mockedGetUserMe.mockResolvedValue({ _id: 'u1', email: 'a@b.com', themePreference: 'system' });

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    fireEvent.click(screen.getByText('set-dark'));

    // PATCH should not be called immediately
    expect(mockedPatchUserPreferences).not.toHaveBeenCalled();

    // Advance timers past debounce threshold
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(mockedPatchUserPreferences).toHaveBeenCalledWith({ themePreference: 'dark' });
  });

  it('debounces rapid preference changes — only sends last value', async () => {
    mockedGetToken.mockReturnValue('tok');
    mockedGetUserMe.mockResolvedValue({ _id: 'u1', email: 'a@b.com', themePreference: 'system' });

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    fireEvent.click(screen.getByText('set-dark'));
    fireEvent.click(screen.getByText('set-light'));
    fireEvent.click(screen.getByText('set-dark'));

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // Only called once with the final value
    expect(mockedPatchUserPreferences).toHaveBeenCalledTimes(1);
    expect(mockedPatchUserPreferences).toHaveBeenCalledWith({ themePreference: 'dark' });
  });

  it('does not revert theme when PATCH call fails', async () => {
    mockedGetToken.mockReturnValue('tok');
    // getUserMe returns 'light' so the mount fetch doesn't overwrite our click
    mockedGetUserMe.mockResolvedValue({ _id: 'u1', email: 'a@b.com', themePreference: 'light' });
    mockedPatchUserPreferences.mockRejectedValue(new Error('Network error'));

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    fireEvent.click(screen.getByText('set-light'));
    expect(screen.getByTestId('pref').textContent).toBe('light');

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // Theme stays as 'light' even though PATCH failed
    expect(screen.getByTestId('pref').textContent).toBe('light');
    expect(localStorage.getItem('mf_theme')).toBe('light');
  });

  it('does not call PATCH when not authenticated', async () => {
    mockedGetToken.mockReturnValue(null);

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    fireEvent.click(screen.getByText('set-dark'));

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(mockedPatchUserPreferences).not.toHaveBeenCalled();
  });

  it('falls back silently when getUserMe fails', async () => {
    storeThemePreference('dark');
    mockedGetToken.mockReturnValue('tok');
    mockedGetUserMe.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AppThemeProvider>
        <ThemeDisplay />
      </AppThemeProvider>
    );

    await act(async () => {
      jest.runAllTimers();
    });

    // Keeps the localStorage value on API failure
    expect(screen.getByTestId('pref').textContent).toBe('dark');
  });
});

describe('theme utility functions', () => {
  beforeEach(() => localStorage.removeItem('mf_theme'));

  it('getStoredThemePreference returns system when nothing stored', () => {
    expect(getStoredThemePreference()).toBe('system');
  });

  it('getStoredThemePreference returns stored value', () => {
    localStorage.setItem('mf_theme', 'dark');
    expect(getStoredThemePreference()).toBe('dark');
  });

  it('getStoredThemePreference returns system for invalid value', () => {
    localStorage.setItem('mf_theme', 'invalid');
    expect(getStoredThemePreference()).toBe('system');
  });

  it('storeThemePreference writes to localStorage', () => {
    storeThemePreference('light');
    expect(localStorage.getItem('mf_theme')).toBe('light');
  });
});
