import axiosInstance from '../axiosInstance';
import { TransactionRequest } from '../types';
import { setToken } from './auth';

// Auth
export const register = async (email: string, password: string): Promise<void> => {
  const res = await axiosInstance.post('/auth/register', { email, password });
  setToken(res.data.token);
};

export const login = async (email: string, password: string): Promise<void> => {
  const res = await axiosInstance.post('/auth/login', { email, password });
  setToken(res.data.token);
};

// Expenses
export const getExpenses = async () => {
  const res = await axiosInstance.get('/api/expenses');
  return res.data.data; // API returns { data, total, page, pages }
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
