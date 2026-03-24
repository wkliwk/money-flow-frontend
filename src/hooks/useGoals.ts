import { useState, useCallback } from 'react';

export interface Goal {
  id: string;
  name: string;
  emoji?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // 'YYYY-MM-DD'
  createdAt: string;
}

const KEY = 'mf_goals';

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(items: Goal[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(load);

  const addGoal = useCallback((g: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals((prev) => {
      const next = [...prev, { ...g, id: String(Date.now()), createdAt: new Date().toISOString() }];
      persist(next);
      return next;
    });
  }, []);

  const updateCurrent = useCallback((id: string, currentAmount: number) => {
    setGoals((prev) => {
      const next = prev.map((g) => g.id === id ? { ...g, currentAmount } : g);
      persist(next);
      return next;
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { goals, addGoal, updateCurrent, deleteGoal };
}
