import type { Currency } from '../constants/currencies';

const REGION_TO_CURRENCY: Record<string, Currency> = {
  HK: 'HKD',
  CN: 'CNY',
  TW: 'TWD',
  JP: 'JPY',
  KR: 'KRW',
  TH: 'THB',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
};

const LANG_TO_CURRENCY: Record<string, Currency> = {
  ja: 'JPY',
  ko: 'KRW',
  th: 'THB',
};

export function detectCurrencyFromLocale(localeStr?: string): Currency {
  const locale =
    localeStr ||
    (typeof navigator !== 'undefined' ? navigator.language : undefined) ||
    '';
  if (!locale) return 'USD';

  const [lang, region] = locale.split(/[-_]/);
  if (region && REGION_TO_CURRENCY[region.toUpperCase()]) {
    return REGION_TO_CURRENCY[region.toUpperCase()];
  }
  if (lang && LANG_TO_CURRENCY[lang.toLowerCase()]) {
    return LANG_TO_CURRENCY[lang.toLowerCase()];
  }
  return 'USD';
}
