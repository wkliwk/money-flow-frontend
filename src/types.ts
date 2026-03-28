export type TransactionType = 'income' | 'expense';

export interface Transaction {
  _id: string;
  owner: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  item?: string;
  participants?: string[];
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
  date?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  createdAt: string;
}
