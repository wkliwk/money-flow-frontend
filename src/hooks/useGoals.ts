import { useState, useCallback } from 'react';
import { SavingsGoal } from '../types';

const KEY = 'mf_savings_goals';

function load(): SavingsGoal[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(goals: SavingsGoal[]) {
  localStorage.setItem(KEY, JSON.stringify(goals));
}

export function useGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>(load);

  const addGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount'>) => {
    setGoals((prev) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const next = [...prev, { ...goal, id, currentAmount: 0, createdAt: new Date().toISOString() }];
      save(next);
      return next;
    });
  }, []);

  const updateAmount = useCallback((id: string, amount: number) => {
    setGoals((prev) => {
      const next = prev.map((g) => g.id === id ? { ...g, currentAmount: Math.max(0, amount) } : g);
      save(next);
      return next;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { goals, addGoal, updateAmount, deleteGoal };
}
