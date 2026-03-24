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
  return res.data;
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

// Net Worth
export interface NetWorthSnapshot {
  _id: string;
  userId: string;
  date: Date;
  assets: {
    cash?: number;
    investments?: number;
    property?: number;
    other?: number;
  };
  liabilities: {
    loans?: number;
    creditCardDebt?: number;
    other?: number;
  };
  netWorth?: number;
}

export const getNetWorthSnapshots = async (months = 12) => {
  const res = await axiosInstance.get('/api/net-worth', { params: { months } });
  return res.data;
};

export const getLatestNetWorth = async () => {
  const res = await axiosInstance.get('/api/net-worth/latest');
  return res.data;
};

export const createNetWorthSnapshot = async (data: Partial<NetWorthSnapshot>) => {
  const res = await axiosInstance.post('/api/net-worth', data);
  return res.data;
};

export const updateNetWorthSnapshot = async (id: string, data: Partial<NetWorthSnapshot>) => {
  const res = await axiosInstance.put(`/api/net-worth/${id}`, data);
  return res.data;
};

export const deleteNetWorthSnapshot = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/net-worth/${id}`);
};
