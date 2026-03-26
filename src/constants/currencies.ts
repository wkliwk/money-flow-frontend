export type Currency = 'HKD' | 'CNY' | 'JPY' | 'USD' | 'EUR' | 'GBP' | 'TWD' | 'THB' | 'KRW' | 'CAD';

export const CURRENCIES: Currency[] = ['HKD', 'CNY', 'JPY', 'USD', 'EUR', 'GBP', 'TWD', 'THB', 'KRW', 'CAD'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  HKD: 'HK$',
  CNY: '\u00a5',
  JPY: '\u00a5',
  USD: 'US$',
  EUR: '\u20ac',
  GBP: '\u00a3',
  TWD: 'NT$',
  THB: '\u0e3f',
  KRW: '\u20a9',
  CAD: 'CA$',
};
