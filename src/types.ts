export type TransactionType = 'income' | 'expense';

// Backend enum values — these are sent to the API
export const PAYMENT_METHODS = [
  'cash',
  'octopus',
  'payme',
  'fps',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'alipay_hk',
  'wechat_pay',
  'other',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Display names for the UI
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  octopus: 'Octopus',
  payme: 'PayMe',
  fps: 'FPS',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  alipay_hk: 'AlipayHK',
  wechat_pay: 'WeChat Pay',
  other: 'Other',
};

export interface Transaction {
  _id: string;
  owner: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  item?: string;
  participants?: string[];
  splitBill?: boolean | 'split' | 'treat' | 'participate';
  paymentMethod?: PaymentMethod | null;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRequest {
  owner: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  item?: string;
  participants?: string[];
  splitBill?: boolean | 'split' | 'treat' | 'participate';
  paymentMethod?: PaymentMethod | null;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  notes?: string;
  date?: string;
}
