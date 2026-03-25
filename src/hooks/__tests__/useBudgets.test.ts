import { renderHook, act } from '@testing-library/react';

jest.mock('../../services/api', () => ({
  getBudgets: () => Promise.resolve([]),
  saveBudgets: () => Promise.resolve(undefined),
}));

import { useBudgets } from '../useBudgets';

describe('useBudgets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty budgets when localStorage is empty', () => {
    const { result } = renderHook(() => useBudgets());
    expect(result.current.budgets).toEqual({});
  });

  it('setBudget persists a category budget', () => {
    const { result } = renderHook(() => useBudgets());
    act(() => {
      result.current.setBudget('Food & Drink', 2000);
    });
    expect(result.current.budgets['Food & Drink']).toBe(2000);
    expect(JSON.parse(localStorage.getItem('mf_budgets') || '{}')).toEqual({ 'Food & Drink': 2000 });
  });

  it('setBudget with 0 removes the category', () => {
    const { result } = renderHook(() => useBudgets());
    act(() => {
      result.current.setBudget('Food & Drink', 2000);
    });
    act(() => {
      result.current.setBudget('Food & Drink', 0);
    });
    expect(result.current.budgets['Food & Drink']).toBeUndefined();
  });

  it('loads existing data from localStorage on mount', () => {
    localStorage.setItem('mf_budgets', JSON.stringify({ Transport: 500 }));
    const { result } = renderHook(() => useBudgets());
    expect(result.current.budgets['Transport']).toBe(500);
  });

  it('returns empty object on bad JSON in localStorage', () => {
    localStorage.setItem('mf_budgets', 'not-valid-json');
    const { result } = renderHook(() => useBudgets());
    expect(result.current.budgets).toEqual({});
  });
});
