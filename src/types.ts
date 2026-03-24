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
  tags?: string[];
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
  tags?: string[];
  notes?: string;
  date?: string;
}
