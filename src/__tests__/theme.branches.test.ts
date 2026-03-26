import { getStoredThemePreference, storeThemePreference, resolveTheme, darkTheme, lightTheme } from '../theme';

describe('theme utility functions — branch coverage', () => {
  beforeEach(() => localStorage.clear());

  // getStoredThemePreference branches
  it('returns "light" when stored preference is light', () => {
    localStorage.setItem('mf_theme', 'light');
    expect(getStoredThemePreference()).toBe('light');
  });

  it('returns "dark" when stored preference is dark', () => {
    localStorage.setItem('mf_theme', 'dark');
    expect(getStoredThemePreference()).toBe('dark');
  });

  it('returns "system" when stored preference is system', () => {
    localStorage.setItem('mf_theme', 'system');
    expect(getStoredThemePreference()).toBe('system');
  });

  it('returns "system" as default when no preference stored', () => {
    localStorage.removeItem('mf_theme');
    expect(getStoredThemePreference()).toBe('system');
  });

  it('returns "system" as default when unknown value stored', () => {
    localStorage.setItem('mf_theme', 'some-invalid-value');
    expect(getStoredThemePreference()).toBe('system');
  });

  // resolveTheme branches
  it('resolveTheme: system + dark system → returns darkTheme', () => {
    const result = resolveTheme('system', true);
    expect(result).toBe(darkTheme);
  });

  it('resolveTheme: system + light system → returns lightTheme', () => {
    const result = resolveTheme('system', false);
    expect(result).toBe(lightTheme);
  });

  it('resolveTheme: dark pref → returns darkTheme', () => {
    const result = resolveTheme('dark', false);
    expect(result).toBe(darkTheme);
  });

  it('resolveTheme: light pref → returns lightTheme', () => {
    const result = resolveTheme('light', false);
    expect(result).toBe(lightTheme);
  });

  // storeThemePreference
  it('storeThemePreference stores the value in localStorage', () => {
    storeThemePreference('light');
    expect(localStorage.getItem('mf_theme')).toBe('light');
  });
});
