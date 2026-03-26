import { useState, useCallback } from 'react';

const STORAGE_KEY = 'mf_currency_prefs';
const DEFAULT_ENABLED: string[] = ['HKD', 'USD'];

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ENABLED;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    return DEFAULT_ENABLED;
  } catch {
    return DEFAULT_ENABLED;
  }
}

function saveToStorage(codes: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
}

interface UseCurrencyPreferencesResult {
  enabledCurrencies: string[];
  toggleCurrency: (code: string) => void;
  isEnabled: (code: string) => boolean;
}

export function useCurrencyPreferences(): UseCurrencyPreferencesResult {
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(loadFromStorage);

  const toggleCurrency = useCallback((code: string) => {
    setEnabledCurrencies((prev) => {
      const isCurrentlyEnabled = prev.includes(code);
      if (isCurrentlyEnabled && prev.length <= 1) {
        return prev;
      }
      const next = isCurrentlyEnabled
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      saveToStorage(next);
      return next;
    });
  }, []);

  const isEnabled = useCallback(
    (code: string) => enabledCurrencies.includes(code),
    [enabledCurrencies]
  );

  return { enabledCurrencies, toggleCurrency, isEnabled };
}
