import { useState, useCallback, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import { getRecurring, createRecurring, deleteRecurringAPI, RecurringExpenseAPI } from '../services/api';

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
  startDate?: string; // ISO date — when recurring begins
  lastApplied?: string; // 'YYYY-MM'
}

const KEY = 'mf_recurring';
const META_KEY = 'mf_recurring_meta'; // extra frontend fields keyed by API id

function loadLocal(): RecurringItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadMeta(): Record<string, Partial<RecurringItem>> {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistLocal(items: RecurringItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

function persistMeta(meta: Record<string, Partial<RecurringItem>>) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {}
}

const FREQ_TO_API: Record<string, string> = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY' };
const FREQ_FROM_API: Record<string, 'daily' | 'weekly' | 'monthly'> = {
  DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly', QUARTERLY: 'monthly', YEARLY: 'monthly',
};

function apiToItem(api: RecurringExpenseAPI, meta: Partial<RecurringItem> = {}): RecurringItem {
  return {
    id: api._id,
    label: api.name,
    description: api.description || '',
    amount: api.amount,
    type: (meta.type as TransactionType) || 'expense',
    category: api.category,
    item: meta.item,
    participants: meta.participants,
    frequency: FREQ_FROM_API[api.frequency] || 'monthly',
    startDate: api.start_date || meta.startDate,
    lastApplied: meta.lastApplied,
  };
}

export function useRecurring() {
  const [items, setItems] = useState<RecurringItem[]>(loadLocal);
  const metaRef = useRef<Record<string, Partial<RecurringItem>>>(loadMeta());
  const migrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiItems = await getRecurring();
        const meta = metaRef.current;

        // One-time migration: push localStorage items that aren't in API
        if (!migrated.current) {
          migrated.current = true;
          const localItems = loadLocal();
          const apiIds = new Set(apiItems.map((a) => a._id));
          const toMigrate = localItems.filter((l) => !apiIds.has(l.id));
          for (const item of toMigrate) {
            try {
              const created = await createRecurring({
                name: item.label || item.description,
                amount: item.amount,
                category: item.category,
                start_date: new Date().toISOString(),
                frequency: FREQ_TO_API[item.frequency || 'monthly'] || 'MONTHLY',
                description: item.description,
              });
              meta[created._id] = { type: item.type, item: item.item, participants: item.participants, lastApplied: item.lastApplied };
              apiItems.push(created);
            } catch { /* skip failed migrations */ }
          }
          persistMeta(meta);
        }

        if (cancelled) return;
        const merged = apiItems.map((a) => apiToItem(a, meta[a._id]));
        setItems(merged);
        persistLocal(merged);
      } catch {
        // Offline — use localStorage fallback (already loaded)
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addItem = useCallback(async (item: Omit<RecurringItem, 'id'>) => {
    try {
      const created = await createRecurring({
        name: item.label || item.description,
        amount: item.amount,
        category: item.category,
        start_date: item.startDate || new Date().toISOString(),
        frequency: FREQ_TO_API[item.frequency || 'monthly'] || 'MONTHLY',
        description: item.description,
      });
      const meta = loadMeta();
      meta[created._id] = { type: item.type, item: item.item, participants: item.participants, startDate: item.startDate };
      persistMeta(meta);
      metaRef.current = meta;
      const newItem = apiToItem(created, meta[created._id]);
      setItems((prev) => {
        const next = [...prev, newItem];
        persistLocal(next);
        return next;
      });
    } catch {
      // Fallback: save locally only
      setItems((prev) => {
        const next = [...prev, { ...item, id: String(Date.now()) }];
        persistLocal(next);
        return next;
      });
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistLocal(next);
      return next;
    });
    try {
      await deleteRecurringAPI(id);
      const meta = loadMeta();
      delete meta[id];
      persistMeta(meta);
      metaRef.current = meta;
    } catch { /* item removed from UI, API delete failed — will be orphaned on server */ }
  }, []);

  const markApplied = useCallback((ids: string[], month: string) => {
    setItems((prev) => {
      const next = prev.map((r) => ids.includes(r.id) ? { ...r, lastApplied: month } : r);
      persistLocal(next);
      return next;
    });
    const meta = loadMeta();
    ids.forEach((id) => { meta[id] = { ...meta[id], lastApplied: month }; });
    persistMeta(meta);
    metaRef.current = meta;
  }, []);

  return { items, addItem, deleteItem, markApplied };
}
