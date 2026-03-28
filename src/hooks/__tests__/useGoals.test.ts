import { renderHook, act } from '@testing-library/react';
import { useGoals } from '../useGoals';

describe('useGoals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty goals when localStorage is empty', () => {
    const { result } = renderHook(() => useGoals());
    expect(result.current.goals).toEqual([]);
  });

  it('addGoal creates a goal with id and createdAt', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({ name: 'Vacation', targetAmount: 5000 });
    });
    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].name).toBe('Vacation');
    expect(result.current.goals[0].targetAmount).toBe(5000);
    expect(result.current.goals[0].currentAmount).toBe(0);
    expect(result.current.goals[0].id).toBeDefined();
    expect(result.current.goals[0].createdAt).toBeDefined();
  });

  it('addGoal persists to localStorage', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({ name: 'Emergency Fund', targetAmount: 10000 });
    });
    const stored = JSON.parse(localStorage.getItem('mf_savings_goals') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Emergency Fund');
  });

  it('addGoal with optional fields', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({
        name: 'New Laptop',
        targetAmount: 8000,
        deadline: '2026-06-01',
        category: 'Tech',
      });
    });
    expect(result.current.goals[0].deadline).toBe('2026-06-01');
    expect(result.current.goals[0].category).toBe('Tech');
  });

  it('updateAmount changes currentAmount', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({ name: 'Test', targetAmount: 1000 });
    });
    const id = result.current.goals[0].id;
    act(() => {
      result.current.updateAmount(id, 500);
    });
    expect(result.current.goals[0].currentAmount).toBe(500);
  });

  it('updateAmount clamps to 0', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({ name: 'Test', targetAmount: 1000 });
    });
    const id = result.current.goals[0].id;
    act(() => {
      result.current.updateAmount(id, -100);
    });
    expect(result.current.goals[0].currentAmount).toBe(0);
  });

  it('deleteGoal removes the goal', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({ name: 'A', targetAmount: 100 });
      result.current.addGoal({ name: 'B', targetAmount: 200 });
    });
    expect(result.current.goals).toHaveLength(2);
    const idToDelete = result.current.goals[0].id;
    act(() => {
      result.current.deleteGoal(idToDelete);
    });
    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].name).toBe('B');
  });

  it('deleteGoal persists to localStorage', () => {
    const { result } = renderHook(() => useGoals());
    act(() => {
      result.current.addGoal({ name: 'Del', targetAmount: 100 });
    });
    const id = result.current.goals[0].id;
    act(() => {
      result.current.deleteGoal(id);
    });
    const stored = JSON.parse(localStorage.getItem('mf_savings_goals') || '[]');
    expect(stored).toHaveLength(0);
  });

  it('loads existing goals from localStorage on mount', () => {
    const existing = [
      { id: 'x1', name: 'Saved', targetAmount: 3000, currentAmount: 1500, createdAt: '2026-01-01' },
    ];
    localStorage.setItem('mf_savings_goals', JSON.stringify(existing));
    const { result } = renderHook(() => useGoals());
    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].name).toBe('Saved');
    expect(result.current.goals[0].currentAmount).toBe(1500);
  });

  it('returns empty array on bad JSON in localStorage', () => {
    localStorage.setItem('mf_savings_goals', 'not-valid');
    const { result } = renderHook(() => useGoals());
    expect(result.current.goals).toEqual([]);
  });
});
