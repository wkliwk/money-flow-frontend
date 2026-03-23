import { useState, useCallback } from 'react';
import { TransactionType } from '../types';

export interface RecurringItem {
  id: string;
  label: string;
  item?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  participants?: string[];
  lastApplied?: string; // 'YYYY-MM'
}

const KEY = 'mf_recurring';

function load(): RecurringItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(items: RecurringItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function useRecurring() {
  const [items, setItems] = useState<RecurringItem[]>(load);

  const addItem = useCallback((item: Omit<RecurringItem, 'id'>) => {
    setItems((prev) => {
      const next = [...prev, { ...item, id: String(Date.now()) }];
      persist(next);
      return next;
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const markApplied = useCallback((ids: string[], month: string) => {
    setItems((prev) => {
      const next = prev.map((r) => ids.includes(r.id) ? { ...r, lastApplied: month } : r);
      persist(next);
      return next;
    });
  }, []);

  return { items, addItem, deleteItem, markApplied };
}
