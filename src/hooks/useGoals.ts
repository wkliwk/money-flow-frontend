import { useState, useCallback, useEffect, useRef } from 'react';
import { SavingsGoal } from '../types';
import { getGoals, createGoal, updateGoal, deleteGoalAPI } from '../services/api';

const KEY = 'mf_savings_goals';

function loadLocal(): SavingsGoal[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function persistLocal(goals: SavingsGoal[]) {
  localStorage.setItem(KEY, JSON.stringify(goals));
}

export function useGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>(loadLocal);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    getGoals()
      .then((data) => {
        const mapped: SavingsGoal[] = data.map((d) => ({
          id: d.id || d._id,
          name: d.name,
          targetAmount: d.targetAmount,
          currentAmount: d.currentAmount,
          deadline: d.deadline,
          category: d.category,
          createdAt: d.createdAt,
        }));
        setGoals(mapped);
        persistLocal(mapped);
      })
      .catch(() => {/* use localStorage fallback */});
  }, []);

  const addGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount'>) => {
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newGoal: SavingsGoal = { ...goal, id: tempId, currentAmount: 0, createdAt: new Date().toISOString() };

    setGoals((prev) => {
      const next = [...prev, newGoal];
      persistLocal(next);
      return next;
    });

    createGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline,
      category: goal.category,
    }).then((saved) => {
      setGoals((prev) => {
        const next = prev.map((g) => g.id === tempId ? { ...g, id: saved.id || saved._id, createdAt: saved.createdAt } : g);
        persistLocal(next);
        return next;
      });
    }).catch(() => {/* keep local version */});
  }, []);

  const updateAmount = useCallback((id: string, amount: number) => {
    const clamped = Math.max(0, amount);
    setGoals((prev) => {
      const next = prev.map((g) => g.id === id ? { ...g, currentAmount: clamped } : g);
      persistLocal(next);
      return next;
    });
    updateGoal(id, { currentAmount: clamped }).catch(() => {});
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      persistLocal(next);
      return next;
    });
    deleteGoalAPI(id).catch(() => {});
  }, []);

  return { goals, addGoal, updateAmount, deleteGoal };
}
