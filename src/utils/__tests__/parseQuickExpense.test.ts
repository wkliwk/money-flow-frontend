import { parseQuickExpense, suggestCategory } from '../parseQuickExpense';

describe('parseQuickExpense', () => {
  test('parses "coffee 5"', () => {
    const result = parseQuickExpense('coffee 5');
    expect(result).toEqual({ item: 'coffee', amount: 5 });
  });

  test('parses "lunch 12.50"', () => {
    const result = parseQuickExpense('lunch 12.50');
    expect(result).toEqual({ item: 'lunch', amount: 12.5 });
  });

  test('parses "groceries 45 hkd"', () => {
    const result = parseQuickExpense('groceries 45 hkd');
    expect(result).toEqual({ item: 'groceries', amount: 45, currency: 'HKD' });
  });

  test('parses "5 usd" (amount first)', () => {
    const result = parseQuickExpense('5 usd');
    expect(result).toEqual({ item: '', amount: 5, currency: 'USD' });
  });

  test('parses "5" (amount only)', () => {
    const result = parseQuickExpense('5');
    expect(result).toEqual({ item: '', amount: 5 });
  });

  test('parses "coffee shop 8.75"', () => {
    const result = parseQuickExpense('coffee shop 8.75');
    expect(result).toEqual({ item: 'coffee shop', amount: 8.75 });
  });

  test('returns null for empty string', () => {
    const result = parseQuickExpense('');
    expect(result).toBeNull();
  });

  test('returns null for whitespace only', () => {
    const result = parseQuickExpense('   ');
    expect(result).toBeNull();
  });

  test('returns null for no amount', () => {
    const result = parseQuickExpense('coffee shop');
    expect(result).toEqual({ item: 'coffee shop', amount: 0 });
  });

  test('lowercases item name', () => {
    const result = parseQuickExpense('COFFEE 5');
    expect(result).toEqual({ item: 'coffee', amount: 5 });
  });

  test('uppercases currency code', () => {
    const result = parseQuickExpense('coffee 5 usd');
    expect(result).toEqual({ item: 'coffee', amount: 5, currency: 'USD' });
  });
});

describe('suggestCategory', () => {
  test('suggests "food" for coffee', () => {
    expect(suggestCategory('coffee')).toBe('food');
  });

  test('suggests "groceries" for supermarket', () => {
    expect(suggestCategory('supermarket')).toBe('groceries');
  });

  test('suggests "transport" for taxi', () => {
    expect(suggestCategory('taxi')).toBe('transport');
  });

  test('suggests "entertainment" for movie', () => {
    expect(suggestCategory('movie')).toBe('entertainment');
  });

  test('suggests "Miscellaneous" for unknown items', () => {
    expect(suggestCategory('xyz random thing')).toBe('Miscellaneous');
  });

  test('is case insensitive', () => {
    expect(suggestCategory('COFFEE')).toBe('food');
    expect(suggestCategory('CaFe')).toBe('food');
  });

  test('matches partial words', () => {
    expect(suggestCategory('coffee bar')).toBe('food');
    expect(suggestCategory('bus fare')).toBe('transport');
  });
});
