import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppThemeProvider, useThemePreference } from '../../../ThemeContext';
import { getStoredThemePreference, storeThemePreference } from '../../../theme';

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
  beforeEach(() => localStorage.removeItem('mf_theme'));

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
