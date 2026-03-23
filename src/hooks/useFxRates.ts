import { useState, useEffect } from 'react';

export type Currency = 'HKD' | 'CAD' | 'USD' | 'CNY';

export const CURRENCIES: Currency[] = ['HKD', 'CAD', 'USD', 'CNY'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  HKD: 'HK$',
  CAD: 'CA$',
  USD: 'US$',
  CNY: '¥',
};

// Rates are relative to HKD (base)
type Rates = Record<Currency, number>;

const DEFAULT_RATES: Rates = { HKD: 1, CAD: 0.18, USD: 0.128, CNY: 0.93 };
const STORAGE_KEY = 'mf_currency';

export function useFxRates() {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem(STORAGE_KEY) as Currency) || 'HKD'
  );
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=HKD&to=CAD,USD,CNY')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) {
          setRates({ HKD: 1, CAD: data.rates.CAD, USD: data.rates.USD, CNY: data.rates.CNY });
        }
      })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false));
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  const convert = (hkdAmount: number) =>
    Math.round(hkdAmount * rates[currency] * 100) / 100;

  const symbol = CURRENCY_SYMBOLS[currency];

  return { currency, setCurrency, convert, symbol, loading, rates };
}
