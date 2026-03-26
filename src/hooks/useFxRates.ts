import { useState, useEffect, useCallback } from 'react';
import { getExchangeRates } from '../services/api';
import { Currency, CURRENCY_SYMBOLS } from '../constants/currencies';

export type { Currency };
export { CURRENCY_SYMBOLS };
export { CURRENCIES } from '../constants/currencies';

// Rates: how many foreign units per 1 HKD
// These are fallback defaults; real rates come from backend
type Rates = Record<Currency, number>;

const DEFAULT_RATES: Rates = {
  HKD: 1,
  CNY: 0.93,
  JPY: 19.3,
  USD: 0.128,
  EUR: 0.118,
  GBP: 0.101,
  TWD: 4.12,
  THB: 4.45,
  KRW: 175,
  CAD: 0.18,
};

const STORAGE_KEY = 'mf_currency';

let cachedRates: Rates | null = null;
let fetchPromise: Promise<Rates> | null = null;

function fetchRates(): Promise<Rates> {
  if (cachedRates) return Promise.resolve(cachedRates);
  if (fetchPromise) return fetchPromise;
  fetchPromise = getExchangeRates()
    .then((apiRates) => {
      const merged: Rates = { ...DEFAULT_RATES, HKD: 1 };
      for (const [key, val] of Object.entries(apiRates)) {
        if (key in merged) {
          merged[key as Currency] = val;
        }
      }
      cachedRates = merged;
      return merged;
    })
    .catch(() => {
      // Fallback to frankfurter for display currency support
      return fetch('https://api.frankfurter.app/latest?from=HKD&to=CAD,USD,CNY,JPY,EUR,GBP')
        .then((r) => r.json())
        .then((data) => {
          if (data?.rates) {
            const merged: Rates = { ...DEFAULT_RATES, HKD: 1 };
            for (const [key, val] of Object.entries(data.rates)) {
              if (key in merged) {
                merged[key as Currency] = val as number;
              }
            }
            cachedRates = merged;
            return merged;
          }
          return DEFAULT_RATES;
        })
        .catch(() => DEFAULT_RATES);
    })
    .finally(() => { fetchPromise = null; });
  return fetchPromise;
}

export function useFxRates() {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem(STORAGE_KEY) as Currency) || 'HKD'
  );
  const [rates, setRates] = useState<Rates>(cachedRates || DEFAULT_RATES);
  const [loading, setLoading] = useState(!cachedRates);

  useEffect(() => {
    fetchRates()
      .then((r) => setRates(r))
      .finally(() => setLoading(false));
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const convert = useCallback((hkdAmount: number) =>
    Math.round(hkdAmount * rates[currency] * 100) / 100,
  [rates, currency]);

  const symbol = CURRENCY_SYMBOLS[currency];

  const rateForCurrency = useCallback((c: Currency): number => {
    if (c === 'HKD') return 1;
    const foreignPerHkd = rates[c];
    return foreignPerHkd > 0 ? 1 / foreignPerHkd : 1;
  }, [rates]);

  return { currency, setCurrency, convert, symbol, loading, rates, rateForCurrency };
}

export function resetFxCache(): void {
  cachedRates = null;
  fetchPromise = null;
}
