import { useState, useCallback } from 'react';

const KEY = 'mf_budgets';

function load(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export const BUDGET_CATEGORIES = ['Food & Drink', 'Transport', 'Shopping', 'Utilities', 'Education', 'Other'];

export function useBudgets() {
  const [budgets, setBudgetsState] = useState<Record<string, number>>(load);

  const setBudget = useCallback((category: string, amount: number) => {
    setBudgetsState((prev) => {
      const next = amount > 0 ? { ...prev, [category]: amount } : (() => { const n = { ...prev }; delete n[category]; return n; })();
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { budgets, setBudget };
}
