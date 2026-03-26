import { parseQuickExpense, suggestCategory } from '../parseQuickExpense';

describe('parseQuickExpense', () => {
  test('lunch 85', () => { expect(parseQuickExpense('lunch 85')).toEqual({ description: 'lunch', amount: 85, category: 'Food' }); });
  test('MTR 500 transport', () => { expect(parseQuickExpense('MTR 500 transport')).toEqual({ description: 'MTR', amount: 500, category: 'Transport' }); });
  test('85 only', () => { expect(parseQuickExpense('85')).toEqual({ description: '', amount: 85, category: 'Other' }); });
  test('coffee 5', () => { expect(parseQuickExpense('coffee 5')).toEqual({ description: 'coffee', amount: 5, category: 'Food' }); });
  test('decimal', () => { expect(parseQuickExpense('lunch 12.50')).toEqual({ description: 'lunch', amount: 12.5, category: 'Food' }); });
  test('multi-word', () => { expect(parseQuickExpense('coffee shop 8.75')).toEqual({ description: 'coffee shop', amount: 8.75, category: 'Food' }); });
  test('explicit category', () => { expect(parseQuickExpense('uber 150 transport')).toEqual({ description: 'uber', amount: 150, category: 'Transport' }); });
  test('food category', () => { expect(parseQuickExpense('stuff 20 food')).toEqual({ description: 'stuff', amount: 20, category: 'Food' }); });
  test('case-insensitive cat', () => { expect(parseQuickExpense('tickets 100 Entertainment')).toEqual({ description: 'tickets', amount: 100, category: 'Entertainment' }); });
  test('default Other', () => { expect(parseQuickExpense('random thing 50')).toEqual({ description: 'random thing', amount: 50, category: 'Other' }); });
  test('empty', () => { expect(parseQuickExpense('')).toBeNull(); });
  test('whitespace', () => { expect(parseQuickExpense('   ')).toBeNull(); });
  test('no number', () => { expect(parseQuickExpense('coffee shop')).toBeNull(); });
  test('amount first', () => { expect(parseQuickExpense('500 transport')).toEqual({ description: '', amount: 500, category: 'Transport' }); });
  test('education', () => { expect(parseQuickExpense('textbook 200 education')).toEqual({ description: 'textbook', amount: 200, category: 'Education' }); });
  test('shopping', () => { expect(parseQuickExpense('new shirt 300 shopping')).toEqual({ description: 'new shirt', amount: 300, category: 'Shopping' }); });
});

describe('parseQuickExpense payment method', () => {
  test('octopus keyword', () => {
    const result = parseQuickExpense('lunch 85 octopus');
    expect(result?.paymentMethod).toBe('Octopus');
    expect(result?.amount).toBe(85);
  });

  test('payme keyword', () => {
    const result = parseQuickExpense('dinner 200 payme');
    expect(result?.paymentMethod).toBe('PayMe');
  });

  test('cash keyword', () => {
    const result = parseQuickExpense('coffee 40 cash');
    expect(result?.paymentMethod).toBe('Cash');
  });

  test('fps keyword', () => {
    const result = parseQuickExpense('rent 5000 fps');
    expect(result?.paymentMethod).toBe('FPS');
  });

  test('credit keyword', () => {
    const result = parseQuickExpense('shopping 300 credit');
    expect(result?.paymentMethod).toBe('Credit Card');
  });

  test('wechat keyword', () => {
    const result = parseQuickExpense('milk tea 25 wechat');
    expect(result?.paymentMethod).toBe('WeChat Pay');
  });

  test('alipay keyword', () => {
    const result = parseQuickExpense('snack 15 alipay');
    expect(result?.paymentMethod).toBe('AlipayHK');
  });

  test('no payment method by default', () => {
    const result = parseQuickExpense('lunch 85');
    expect(result?.paymentMethod).toBeUndefined();
  });

  test('payment method with category', () => {
    const result = parseQuickExpense('uber 150 transport octopus');
    expect(result?.category).toBe('Transport');
    expect(result?.paymentMethod).toBe('Octopus');
    expect(result?.description).toBe('uber');
  });
});

describe('parseQuickExpense currency', () => {
  test('JPY currency code', () => {
    const result = parseQuickExpense('lunch 1500 JPY');
    expect(result?.amount).toBe(1500);
    expect(result?.currency).toBe('JPY');
    expect(result?.description).toBe('lunch');
  });

  test('jpy lowercase', () => {
    const result = parseQuickExpense('sushi 2000 jpy');
    expect(result?.amount).toBe(2000);
    expect(result?.currency).toBe('JPY');
  });

  test('USD currency code', () => {
    const result = parseQuickExpense('subscription 9.99 USD');
    expect(result?.amount).toBe(9.99);
    expect(result?.currency).toBe('USD');
  });

  test('CNY currency code', () => {
    const result = parseQuickExpense('dinner 150 CNY');
    expect(result?.amount).toBe(150);
    expect(result?.currency).toBe('CNY');
  });

  test('RMB alias for CNY', () => {
    const result = parseQuickExpense('taxi 35 RMB');
    expect(result?.amount).toBe(35);
    expect(result?.currency).toBe('CNY');
  });

  test('yen alias for JPY', () => {
    const result = parseQuickExpense('ramen 800 yen');
    expect(result?.amount).toBe(800);
    expect(result?.currency).toBe('JPY');
  });

  test('yen symbol prefix', () => {
    const result = parseQuickExpense('coffee \u00a535');
    expect(result?.amount).toBe(35);
    expect(result?.currency).toBe('CNY');
    expect(result?.description).toBe('coffee');
  });

  test('euro symbol prefix', () => {
    const result = parseQuickExpense('beer \u20ac8');
    expect(result?.amount).toBe(8);
    expect(result?.currency).toBe('EUR');
  });

  test('HKD is not included as currency (default)', () => {
    const result = parseQuickExpense('lunch 85 HKD');
    expect(result?.amount).toBe(85);
    expect(result?.currency).toBeUndefined();
  });

  test('no currency by default', () => {
    const result = parseQuickExpense('lunch 85');
    expect(result?.currency).toBeUndefined();
  });

  test('currency with category and payment', () => {
    const result = parseQuickExpense('sushi 1500 JPY food cash');
    expect(result?.amount).toBe(1500);
    expect(result?.currency).toBe('JPY');
    expect(result?.category).toBe('Food');
    expect(result?.paymentMethod).toBe('Cash');
  });

  test('EUR currency code', () => {
    const result = parseQuickExpense('museum 25 EUR');
    expect(result?.amount).toBe(25);
    expect(result?.currency).toBe('EUR');
  });

  test('KRW currency code', () => {
    const result = parseQuickExpense('bibimbap 12000 KRW');
    expect(result?.amount).toBe(12000);
    expect(result?.currency).toBe('KRW');
  });

  test('TWD currency code', () => {
    const result = parseQuickExpense('bubble tea 65 TWD');
    expect(result?.amount).toBe(65);
    expect(result?.currency).toBe('TWD');
  });

  test('THB currency code', () => {
    const result = parseQuickExpense('pad thai 120 THB');
    expect(result?.amount).toBe(120);
    expect(result?.currency).toBe('THB');
  });
});

describe('suggestCategory', () => {
  test('Food for coffee', () => { expect(suggestCategory('coffee')).toBe('Food'); });
  test('Food for grocery', () => { expect(suggestCategory('grocery')).toBe('Food'); });
  test('Transport for taxi', () => { expect(suggestCategory('taxi')).toBe('Transport'); });
  test('Entertainment for movie', () => { expect(suggestCategory('movie')).toBe('Entertainment'); });
  test('Other for unknown', () => { expect(suggestCategory('xyz')).toBe('Other'); });
  test('case insensitive', () => { expect(suggestCategory('COFFEE')).toBe('Food'); });
  test('partial match', () => { expect(suggestCategory('bus fare')).toBe('Transport'); });
  test('Health for gym', () => { expect(suggestCategory('gym')).toBe('Health'); });
  test('Education for course', () => { expect(suggestCategory('course')).toBe('Education'); });
});
