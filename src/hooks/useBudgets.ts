import { useState, useCallback, useEffect, useRef } from 'react';
import { getBudgets, saveBudgets } from '../services/api';

const KEY = 'mf_budgets';

function loadLocal(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function toMap(arr: { category: string; limit: number }[]): Record<string, number> {
  return Object.fromEntries(arr.map((b) => [b.category, b.limit]));
}

function toArray(map: Record<string, number>): { category: string; limit: number }[] {
  return Object.entries(map).filter(([, v]) => v > 0).map(([category, limit]) => ({ category, limit }));
}

export const BUDGET_CATEGORIES = ['Food & Drink', 'Transport', 'Shopping', 'Utilities', 'Education', 'Other'];

export function useBudgets() {
  const [budgets, setBudgetsState] = useState<Record<string, number>>(loadLocal);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch from server on mount; fall back to localStorage if offline
  useEffect(() => {
    getBudgets()
      .then((arr) => {
        const map = toMap(arr);
        setBudgetsState(map);
        localStorage.setItem(KEY, JSON.stringify(map));
      })
      .catch(() => {/* use localStorage fallback already set */});
  }, []);

  const setBudget = useCallback((category: string, amount: number) => {
    setBudgetsState((prev) => {
      const next = amount > 0 ? { ...prev, [category]: amount } : (() => { const n = { ...prev }; delete n[category]; return n; })();
      localStorage.setItem(KEY, JSON.stringify(next));

      // Debounce server save by 800ms
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveBudgets(toArray(next)).catch(() => {/* ignore, localStorage is source of truth */});
      }, 800);

      return next;
    });
  }, []);

  return { budgets, setBudget };
}
