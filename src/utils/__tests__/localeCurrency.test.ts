import { detectCurrencyFromLocale } from '../localeCurrency';

describe('detectCurrencyFromLocale', () => {
  it('returns HKD for zh-HK', () => {
    expect(detectCurrencyFromLocale('zh-HK')).toBe('HKD');
  });

  it('returns CNY for zh-CN', () => {
    expect(detectCurrencyFromLocale('zh-CN')).toBe('CNY');
  });

  it('returns TWD for zh-TW', () => {
    expect(detectCurrencyFromLocale('zh-TW')).toBe('TWD');
  });

  it('returns USD for en-US', () => {
    expect(detectCurrencyFromLocale('en-US')).toBe('USD');
  });

  it('returns CAD for en-CA', () => {
    expect(detectCurrencyFromLocale('en-CA')).toBe('CAD');
  });

  it('returns GBP for en-GB', () => {
    expect(detectCurrencyFromLocale('en-GB')).toBe('GBP');
  });

  it('returns EUR for de-DE', () => {
    expect(detectCurrencyFromLocale('de-DE')).toBe('EUR');
  });

  it('returns EUR for fr-FR', () => {
    expect(detectCurrencyFromLocale('fr-FR')).toBe('EUR');
  });

  it('returns JPY for ja (language only)', () => {
    expect(detectCurrencyFromLocale('ja')).toBe('JPY');
  });

  it('returns JPY for ja-JP', () => {
    expect(detectCurrencyFromLocale('ja-JP')).toBe('JPY');
  });

  it('returns KRW for ko-KR', () => {
    expect(detectCurrencyFromLocale('ko-KR')).toBe('KRW');
  });

  it('returns THB for th-TH', () => {
    expect(detectCurrencyFromLocale('th-TH')).toBe('THB');
  });

  it('falls back to USD for an unknown locale', () => {
    expect(detectCurrencyFromLocale('xx-YY')).toBe('USD');
  });

  it('falls back to USD for an empty locale', () => {
    expect(detectCurrencyFromLocale('')).toBe('USD');
  });

  it('handles underscore separators (en_US)', () => {
    expect(detectCurrencyFromLocale('en_US')).toBe('USD');
  });

  it('uses navigator.language when no arg passed', () => {
    const origLang = Object.getOwnPropertyDescriptor(navigator, 'language');
    Object.defineProperty(navigator, 'language', { value: 'en-CA', configurable: true });
    try {
      expect(detectCurrencyFromLocale()).toBe('CAD');
    } finally {
      if (origLang) Object.defineProperty(navigator, 'language', origLang);
    }
  });
});
