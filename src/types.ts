export type TransactionType = 'income' | 'expense';

export const PAYMENT_METHODS = [
  'Cash',
  'Octopus',
  'PayMe',
  'FPS',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'AlipayHK',
  'WeChat Pay',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export interface Transaction {
  _id: string;
  owner: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  item?: string;
  participants?: string[];
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
  paymentMethod?: PaymentMethod | null;
  currency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  notes?: string;
  date?: string;
}
