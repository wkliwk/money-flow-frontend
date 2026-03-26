import { PaymentMethod } from '../types';

export interface ParsedExpense {
  description: string;
  amount: number;
  category: string;
  paymentMethod?: PaymentMethod;
  currency?: string;
}

const KNOWN_CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Other',
] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'restaurant', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'grocery', 'groceries', 'supermarket', 'market'],
  Transport: ['transport', 'uber', 'taxi', 'gas', 'petrol', 'bus', 'metro', 'mtr', 'parking', 'fuel'],
  Utilities: ['utilities', 'electricity', 'water', 'internet', 'phone', 'utility'],
  Entertainment: ['entertainment', 'movie', 'cinema', 'game', 'show', 'concert', 'netflix', 'gaming'],
  Shopping: ['shopping', 'clothes', 'fashion', 'dress', 'shoes', 'clothing'],
  Health: ['health', 'doctor', 'pharmacy', 'medicine', 'gym', 'medical'],
  Education: ['education', 'school', 'course', 'book', 'tuition', 'class'],
};

const PAYMENT_METHOD_KEYWORDS: Record<string, PaymentMethod> = {
  'cash': 'Cash',
  'octopus': 'Octopus',
  'payme': 'PayMe',
  'fps': 'FPS',
  'creditcard': 'Credit Card',
  'credit': 'Credit Card',
  'debitcard': 'Debit Card',
  'debit': 'Debit Card',
  'banktransfer': 'Bank Transfer',
  'bank': 'Bank Transfer',
  'alipayhk': 'AlipayHK',
  'alipay': 'AlipayHK',
  'wechatpay': 'WeChat Pay',
  'wechat': 'WeChat Pay',
};

const CURRENCY_CODES: Record<string, string> = {
  'cny': 'CNY',
  'rmb': 'CNY',
  'jpy': 'JPY',
  'yen': 'JPY',
  'usd': 'USD',
  'eur': 'EUR',
  'gbp': 'GBP',
  'twd': 'TWD',
  'thb': 'THB',
  'krw': 'KRW',
  'cad': 'CAD',
  'hkd': 'HKD',
};

const CURRENCY_SYMBOL_PREFIXES: Record<string, string> = {
  '\u00a5': 'CNY',
  '\uffe5': 'CNY',
  '\u20ac': 'EUR',
  '\u00a3': 'GBP',
  '\u20a9': 'KRW',
};

function matchCurrency(word: string): string | null {
  return CURRENCY_CODES[word.toLowerCase()] || null;
}

function matchPaymentMethod(word: string): PaymentMethod | null {
  return PAYMENT_METHOD_KEYWORDS[word.toLowerCase()] || null;
}

function matchCategory(word: string): string | null {
  const lower = word.toLowerCase();
  for (const cat of KNOWN_CATEGORIES) {
    if (cat.toLowerCase() === lower) return cat;
  }
  return null;
}

export function suggestCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'Other';
}

export function parseQuickExpense(input: string): ParsedExpense | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Check for symbol-prefixed amounts like "¥1500" or "€50"
  let symbolCurrency: string | undefined;
  let processed = trimmed;
  for (const [sym, cur] of Object.entries(CURRENCY_SYMBOL_PREFIXES)) {
    const regex = new RegExp(`${sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+\\.?\\d*)`);
    const match = processed.match(regex);
    if (match) {
      symbolCurrency = cur;
      processed = processed.replace(regex, match[1]);
      break;
    }
  }

  const parts = processed.split(/\s+/);

  let amount = 0;
  let category = '';
  let currency: string | undefined = symbolCurrency;
  let paymentMethod: PaymentMethod | undefined;
  const descParts: string[] = [];
  let foundNumber = false;

  for (const part of parts) {
    const num = parseFloat(part);
    if (!isNaN(num) && num >= 0 && !foundNumber) {
      amount = num;
      foundNumber = true;
      continue;
    }
    if (!currency) {
      const curMatch = matchCurrency(part);
      if (curMatch) {
        currency = curMatch;
        continue;
      }
    }
    const pmMatch = matchPaymentMethod(part);
    if (pmMatch && !paymentMethod) {
      paymentMethod = pmMatch;
      continue;
    }
    const catMatch = matchCategory(part);
    if (catMatch && !category) {
      category = catMatch;
      continue;
    }
    descParts.push(part);
  }

  if (!foundNumber) return null;

  const description = descParts.join(' ').trim();

  if (!category && description) {
    category = suggestCategory(description);
  }
  if (!category) {
    category = 'Other';
  }

  // Don't include HKD as it's the default
  const resultCurrency = currency && currency !== 'HKD' ? currency : undefined;

  return { description, amount, category, paymentMethod, currency: resultCurrency };
}
