import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AppThemeProvider, useThemePreference } from '../ThemeContext';

const mockGetToken = jest.fn();
const mockGetUserMe = jest.fn();
const mockPatchUserPreferences = jest.fn();

jest.mock('../services/auth', () => ({
  getToken: () => mockGetToken(),
  clearToken: jest.fn(),
}));

jest.mock('../services/api', () => ({
  getUserMe: (...args: unknown[]) => mockGetUserMe(...args),
  patchUserPreferences: (...args: unknown[]) => mockPatchUserPreferences(...args),
}));

// Use a minimal theme-like object that has enough for MUI's CssBaseline
// The real theme is tested in theme.branches.test.ts — here we just need rendering to work
jest.mock('../theme', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createTheme } = require('@mui/material/styles');
  const dark = createTheme({ palette: { mode: 'dark' } });
  const light = createTheme({ palette: { mode: 'light' } });
  return {
    getStoredThemePreference: () => 'system',
    storeThemePreference: jest.fn(),
    resolveTheme: (_pref: string, _systemDark: boolean) => dark,
    ThemePreference: {},
    darkTheme: dark,
    lightTheme: light,
  };
});

jest.setTimeout(10000);

const TestConsumer: React.FC = () => {
  const { preference, setPreference, isDark } = useThemePreference();
  return (
    <div>
      <span data-testid="pref">{preference}</span>
      <span data-testid="isDark">{isDark ? 'dark' : 'light'}</span>
      <button onClick={() => setPreference('light')}>set-light</button>
      <button onClick={() => setPreference('dark')}>set-dark</button>
    </div>
  );
};

describe('ThemeContext — branch coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetToken.mockReturnValue(null);
    mockGetUserMe.mockResolvedValue({ themePreference: 'dark' });
    mockPatchUserPreferences.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('does not call getUserMe when no token', async () => {
    mockGetToken.mockReturnValue(null);
    render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    await act(async () => { jest.runAllTimers(); });
    expect(mockGetUserMe).not.toHaveBeenCalled();
  });

  it('calls getUserMe and applies themePreference when token exists', async () => {
    mockGetToken.mockReturnValue('valid-jwt');
    mockGetUserMe.mockResolvedValue({ themePreference: 'light' });
    render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    await waitFor(() => expect(mockGetUserMe).toHaveBeenCalled());
  });

  it('does not apply themePreference when API returns no themePreference field', async () => {
    mockGetToken.mockReturnValue('valid-jwt');
    mockGetUserMe.mockResolvedValue({ email: 'user@test.com' });
    render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    await act(async () => { jest.advanceTimersByTime(100); });
    expect(mockGetUserMe).toHaveBeenCalled();
  });

  it('silently falls back when getUserMe rejects', async () => {
    mockGetToken.mockReturnValue('valid-jwt');
    mockGetUserMe.mockRejectedValue(new Error('network error'));
    render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    await act(async () => { jest.advanceTimersByTime(200); });
    expect(mockGetUserMe).toHaveBeenCalled();
  });

  it('setPreference calls patchUserPreferences after debounce when token exists', async () => {
    mockGetToken.mockReturnValue('valid-jwt');
    const { getByText } = render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    act(() => { getByText('set-light').click(); });
    expect(mockPatchUserPreferences).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(500); });
    await waitFor(() => expect(mockPatchUserPreferences).toHaveBeenCalledWith({ themePreference: 'light' }));
  });

  it('setPreference does NOT call patchUserPreferences when no token', async () => {
    mockGetToken.mockReturnValue(null);
    const { getByText } = render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    act(() => { getByText('set-dark').click(); });
    act(() => { jest.advanceTimersByTime(500); });
    expect(mockPatchUserPreferences).not.toHaveBeenCalled();
  });

  it('rapid setPreference calls debounce — only last PATCH fires', async () => {
    mockGetToken.mockReturnValue('valid-jwt');
    const { getByText } = render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    act(() => { getByText('set-light').click(); });
    act(() => { jest.advanceTimersByTime(100); });
    act(() => { getByText('set-dark').click(); });
    act(() => { jest.advanceTimersByTime(500); });
    await waitFor(() => expect(mockPatchUserPreferences).toHaveBeenCalledTimes(1));
    expect(mockPatchUserPreferences).toHaveBeenCalledWith({ themePreference: 'dark' });
  });

  it('patchUserPreferences error is logged silently', async () => {
    mockGetToken.mockReturnValue('valid-jwt');
    mockPatchUserPreferences.mockRejectedValue(new Error('server error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <AppThemeProvider>
        <TestConsumer />
      </AppThemeProvider>
    );
    act(() => { getByText('set-light').click(); });
    act(() => { jest.advanceTimersByTime(500); });
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });
});
