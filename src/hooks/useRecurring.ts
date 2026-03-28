import { useState, useCallback, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import { getRecurring, createRecurring, deleteRecurring, updateRecurring } from '../services/api';

export interface RecurringItem {
  id: string;
  label: string;
  item?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  participants?: string[];
  frequency?: 'monthly' | 'weekly' | 'daily';
  lastApplied?: string; // 'YYYY-MM'
}

const KEY = 'mf_recurring';

function loadLocal(): RecurringItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistLocal(items: RecurringItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function useRecurring() {
  const [items, setItems] = useState<RecurringItem[]>(loadLocal);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    getRecurring()
      .then((data) => {
        const mapped: RecurringItem[] = data.map((d) => ({
          id: d.id || d._id,
          label: d.label,
          item: d.item,
          description: d.description,
          amount: d.amount,
          type: d.type,
          category: d.category,
          participants: d.participants,
          frequency: d.frequency,
          lastApplied: d.lastApplied,
        }));
        setItems(mapped);
        persistLocal(mapped);
      })
      .catch(() => {/* use localStorage fallback */});
  }, []);

  const addItem = useCallback((item: Omit<RecurringItem, 'id'>) => {
    // Optimistic local update
    const tempId = String(Date.now());
    const newItem: RecurringItem = { ...item, id: tempId };
    setItems((prev) => {
      const next = [...prev, newItem];
      persistLocal(next);
      return next;
    });

    // Sync to server
    createRecurring({
      label: item.label,
      description: item.description,
      amount: item.amount,
      type: item.type,
      item: item.item,
      category: item.category,
      participants: item.participants,
      frequency: item.frequency,
    }).then((saved) => {
      // Replace temp ID with server ID
      setItems((prev) => {
        const next = prev.map((r) => r.id === tempId ? { ...r, id: saved.id || saved._id } : r);
        persistLocal(next);
        return next;
      });
    }).catch(() => {/* keep local version */});
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistLocal(next);
      return next;
    });
    deleteRecurring(id).catch(() => {/* already removed locally */});
  }, []);

  const markApplied = useCallback((ids: string[], month: string) => {
    setItems((prev) => {
      const next = prev.map((r) => ids.includes(r.id) ? { ...r, lastApplied: month } : r);
      persistLocal(next);
      return next;
    });
    // Sync each updated item to server
    ids.forEach((id) => {
      updateRecurring(id, { lastApplied: month }).catch(() => {});
    });
  }, []);

  return { items, addItem, deleteItem, markApplied };
}
