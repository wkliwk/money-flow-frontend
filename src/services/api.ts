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

// Price hints
export const getLastAmounts = async (): Promise<Record<string, number>> => {
  const res = await axiosInstance.get('/api/expenses/last-amounts');
  return res.data;
};

// Price history
export interface PriceHistoryStats {
  count: number;
  latest: number;
  min: number;
  max: number;
  avg: number;
}

export interface PriceHistoryResponse {
  item: string;
  history: Array<{ amount: number; date: string; description?: string; item?: string; category?: string }>;
  stats: PriceHistoryStats | null;
}

export const getPriceHistory = async (item: string): Promise<PriceHistoryResponse> => {
  const res = await axiosInstance.get(`/api/expenses/price-history/${encodeURIComponent(item)}`);
  return res.data;
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

// Reports
export interface MonthlyReportEntry {
  month: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
}

export const getMonthlyReport = async (months = 6): Promise<MonthlyReportEntry[]> => {
  const res = await axiosInstance.get(`/api/reports/monthly?months=${months}`);
  return res.data.data;
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

// Templates
export interface APITemplate {
  _id: string;
  name: string;
  amount: number;
  category?: string;
  description?: string;
  type?: string;
  item?: string;
  frequency?: string;
}

export const getTemplates = async (): Promise<APITemplate[]> => {
  const res = await axiosInstance.get('/api/templates');
  return res.data.templates;
};

export const createTemplate = async (data: Omit<APITemplate, '_id'>): Promise<APITemplate> => {
  const res = await axiosInstance.post('/api/templates', data);
  return res.data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/templates/${id}`);
};

// Friends
export interface Friend {
  id: string;
  email: string;
  since: string;
}

export interface FriendRequest {
  id: string;
  email: string;
  createdAt: string;
}

export const sendFriendRequest = async (email: string): Promise<{ id: string; status: string }> => {
  const res = await axiosInstance.post('/api/friends/request', { email });
  return res.data;
};

export const getFriends = async (): Promise<Friend[]> => {
  const res = await axiosInstance.get('/api/friends');
  return res.data.friends;
};

export const getPendingRequests = async (): Promise<FriendRequest[]> => {
  const res = await axiosInstance.get('/api/friends/pending');
  return res.data.requests;
};

export const acceptFriend = async (id: string): Promise<void> => {
  await axiosInstance.post(`/api/friends/${id}/accept`);
};

export const rejectFriend = async (id: string): Promise<void> => {
  await axiosInstance.post(`/api/friends/${id}/reject`);
};

export const removeFriend = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/friends/${id}`);
};

// NLP Transaction Parsing
export interface ParsedTransaction {
  merchant?: string;
  amount?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  participants?: string[];
  date?: string;
  notes?: string;
  confidence?: number;
  missing_fields?: string[];
}

export const parseTransactionText = async (text: string, locale = 'zh-HK'): Promise<ParsedTransaction> => {
  const res = await axiosInstance.post('/api/transactions/parse-text', { text, locale }, { timeout: 15000 });
  return res.data;
};

// Receipts
export const scanReceipt = async (file: File): Promise<ReceiptScanResult> => {
  const form = new FormData();
  form.append('receipt', file);
  const res = await axiosInstance.post('/api/receipts/scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
};

// Goals
export interface GoalAPI {
  id: string;
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  createdAt: string;
}

export const getGoals = async (): Promise<GoalAPI[]> => {
  const res = await axiosInstance.get('/api/goals');
  return res.data;
};

export const createGoal = async (data: { name: string; targetAmount: number; deadline?: string; category?: string }): Promise<GoalAPI> => {
  const res = await axiosInstance.post('/api/goals', data);
  return res.data;
};

export const updateGoal = async (id: string, data: Partial<GoalAPI>): Promise<GoalAPI> => {
  const res = await axiosInstance.put(`/api/goals/${id}`, data);
  return res.data;
};

export const deleteGoalAPI = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/goals/${id}`);
};

// Export
export interface ExportFilters {
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  q?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
}

function buildExportParams(filters: ExportFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (filters.q) params.q = filters.q;
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters.minAmount !== undefined) params.minAmount = String(filters.minAmount);
  if (filters.maxAmount !== undefined) params.maxAmount = String(filters.maxAmount);
  return params;
}

export const exportCSV = async (filters: ExportFilters): Promise<Blob> => {
  const res = await axiosInstance.get('/api/export/csv', {
    params: buildExportParams(filters),
    responseType: 'blob',
    timeout: 30000,
  });
  return res.data as Blob;
};

export const exportPDF = async (filters: ExportFilters): Promise<Blob> => {
  const res = await axiosInstance.get('/api/export/pdf', {
    params: buildExportParams(filters),
    responseType: 'blob',
    timeout: 60000,
  });
  return res.data as Blob;
};

export const exportJSON = async (): Promise<Blob> => {
  const res = await axiosInstance.get('/api/export/json', {
    responseType: 'blob',
    timeout: 60000,
  });
  return res.data as Blob;
};
