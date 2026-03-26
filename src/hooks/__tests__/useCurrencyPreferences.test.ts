import { renderHook, act } from '@testing-library/react';
import { useCurrencyPreferences } from '../useCurrencyPreferences';

const STORAGE_KEY = 'mf_currency_prefs';

describe('useCurrencyPreferences', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('returns default enabled currencies when nothing is stored', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    expect(result.current.enabledCurrencies).toEqual(['HKD', 'USD']);
  });

  it('loads persisted preferences from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['EUR', 'GBP']));
    const { result } = renderHook(() => useCurrencyPreferences());
    expect(result.current.enabledCurrencies).toEqual(['EUR', 'GBP']);
  });

  it('isEnabled returns true for enabled currency', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    expect(result.current.isEnabled('HKD')).toBe(true);
    expect(result.current.isEnabled('USD')).toBe(true);
  });

  it('isEnabled returns false for non-enabled currency', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    expect(result.current.isEnabled('EUR')).toBe(false);
  });

  it('toggleCurrency adds a disabled currency', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    act(() => { result.current.toggleCurrency('EUR'); });
    expect(result.current.enabledCurrencies).toContain('EUR');
    expect(result.current.isEnabled('EUR')).toBe(true);
  });

  it('toggleCurrency removes an enabled currency', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    act(() => { result.current.toggleCurrency('USD'); });
    expect(result.current.enabledCurrencies).not.toContain('USD');
    expect(result.current.isEnabled('USD')).toBe(false);
  });

  it('persists changes to localStorage after toggle', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    act(() => { result.current.toggleCurrency('EUR'); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toContain('EUR');
  });

  it('does not remove the last enabled currency', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['HKD']));
    const { result } = renderHook(() => useCurrencyPreferences());
    act(() => { result.current.toggleCurrency('HKD'); });
    expect(result.current.enabledCurrencies).toEqual(['HKD']);
  });

  it('still has at least 1 currency after toggling off when only 1 remains', () => {
    const { result } = renderHook(() => useCurrencyPreferences());
    // disable USD first (leaving HKD)
    act(() => { result.current.toggleCurrency('USD'); });
    expect(result.current.enabledCurrencies.length).toBe(1);
    // attempt to disable the last one
    act(() => { result.current.toggleCurrency('HKD'); });
    expect(result.current.enabledCurrencies.length).toBe(1);
    expect(result.current.enabledCurrencies).toContain('HKD');
  });

  it('falls back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    const { result } = renderHook(() => useCurrencyPreferences());
    expect(result.current.enabledCurrencies).toEqual(['HKD', 'USD']);
  });

  it('falls back to defaults when localStorage contains an empty array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    const { result } = renderHook(() => useCurrencyPreferences());
    expect(result.current.enabledCurrencies).toEqual(['HKD', 'USD']);
  });
});
