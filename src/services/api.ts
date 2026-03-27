import axiosInstance from '../axiosInstance';
import { Transaction, TransactionRequest } from '../types';
import { setToken } from './auth';
import { ThemePreference } from '../theme';

// Auth
export const register = async (email: string, password: string): Promise<void> => {
  const res = await axiosInstance.post('/auth/register', { email, password });
  setToken(res.data.token);
};

export const login = async (email: string, password: string): Promise<void> => {
  const res = await axiosInstance.post('/auth/login', { email, password });
  setToken(res.data.token);
};

export const loginWithGoogle = async (idToken: string): Promise<void> => {
  const res = await axiosInstance.post('/auth/google', { idToken });
  setToken(res.data.token);
};

export const loginWithApple = async (idToken: string): Promise<void> => {
  const res = await axiosInstance.post('/auth/apple', { idToken });
  setToken(res.data.token);
};

// User
export interface UserProfile {
  _id: string;
  email: string;
  themePreference: ThemePreference;
}

export const getUserMe = async (): Promise<UserProfile> => {
  const res = await axiosInstance.get('/api/users/me');
  return res.data;
};

export const patchUserPreferences = async (prefs: { themePreference: ThemePreference }): Promise<void> => {
  await axiosInstance.patch('/api/users/preferences', prefs);
};

// Expenses
export const getExpenses = async () => {
  const allExpenses: Transaction[] = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const res = await axiosInstance.get('/api/expenses', {
      params: { limit: 100, page },
    });
    allExpenses.push(...res.data.data);
    const { pages } = res.data;
    hasMorePages = page < pages;
    page++;
  }

  return allExpenses;
};

export const getExpense = async (id: string) => {
  const res = await axiosInstance.get(`/api/expenses/${id}`);
  return res.data;
};

export const createExpense = async (data: TransactionRequest) => {
  const res = await axiosInstance.post('/api/expenses', data);
  return res.data;
};

export const updateExpense = async (id: string, data: TransactionRequest) => {
  const res = await axiosInstance.put(`/api/expenses/${id}`, data);
  return res.data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/expenses/${id}`);
};

// Exchange rates
export interface ExchangeRates {
  [currency: string]: number;
}

export const getExchangeRates = async (): Promise<ExchangeRates> => {
  const res = await axiosInstance.get('/api/exchange-rates');
  return res.data.rates;
};

// Budgets
export interface Budget {
  category: string;
  limit: number;
}

export const getBudgets = async (): Promise<Budget[]> => {
  const res = await axiosInstance.get('/api/budgets');
  return res.data.budgets;
};

export const saveBudgets = async (budgets: Budget[]): Promise<Budget[]> => {
  const res = await axiosInstance.put('/api/budgets', { budgets });
  return res.data.budgets;
};

// Recurring
export interface RecurringExpenseAPI {
  _id: string;
  name: string;
  amount: number;
  category?: string;
  start_date: string;
  end_date?: string;
  frequency: string;
  description?: string;
}

export const getRecurring = async (): Promise<RecurringExpenseAPI[]> => {
  const res = await axiosInstance.get('/api/recurring');
  return res.data.recurring;
};

export const createRecurring = async (data: {
  name: string;
  amount: number;
  category?: string;
  start_date: string;
  frequency: string;
  description?: string;
}): Promise<RecurringExpenseAPI> => {
  const res = await axiosInstance.post('/api/recurring', data);
  return res.data;
};

export const deleteRecurringAPI = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/recurring/${id}`);
};

// Net Worth
export interface NetWorthSnapshot {
  _id: string;
  date: string;
  assets: { cash: number; investments: number; property: number; other: number };
  liabilities: { loans: number; creditCardDebt: number; other: number };
  netWorth: number;
}

export const getNetWorth = async (months = 12): Promise<NetWorthSnapshot[]> => {
  const res = await axiosInstance.get(`/api/net-worth?months=${months}`);
  return res.data.data;
};

export const getLatestNetWorth = async (): Promise<NetWorthSnapshot | null> => {
  const res = await axiosInstance.get('/api/net-worth/latest');
  return res.data.data || null;
};

export const createNetWorth = async (data: {
  assets: { cash?: number; investments?: number; property?: number; other?: number };
  liabilities: { loans?: number; creditCardDebt?: number; other?: number };
}): Promise<NetWorthSnapshot> => {
  const res = await axiosInstance.post('/api/net-worth', data);
  return res.data;
};

export const deleteNetWorthSnapshot = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/net-worth/${id}`);
};

// Receipts
export type ReceiptConfidence = 'high' | 'medium' | 'low';

export interface ReceiptScanResult {
  amount: number;
  description: string;
  category: string;
  date: string;
  merchant: string;
  currency: string;
  confidence: ReceiptConfidence;
}

export const scanReceipt = async (file: File): Promise<ReceiptScanResult> => {
  const form = new FormData();
  form.append('receipt', file);
  const res = await axiosInstance.post('/api/receipts/scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
};
