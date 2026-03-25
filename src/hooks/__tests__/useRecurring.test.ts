import { renderHook, act } from '@testing-library/react';
import { useRecurring } from '../useRecurring';

describe('useRecurring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty items', () => {
    const { result } = renderHook(() => useRecurring());
    expect(result.current.items).toEqual([]);
  });

  it('addItem adds a new recurring item', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({
        label: 'Netflix',
        description: 'Streaming',
        amount: 100,
        type: 'expense',
      });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].label).toBe('Netflix');
    expect(result.current.items[0].id).toBeDefined();
  });

  it('deleteItem removes item by id', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({ label: 'Netflix', description: '', amount: 100, type: 'expense' });
    });
    const id = result.current.items[0].id;
    act(() => {
      result.current.deleteItem(id);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('markApplied sets lastApplied on specified ids', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({ label: 'Rent', description: '', amount: 5000, type: 'expense' });
    });
    const id = result.current.items[0].id;
    act(() => {
      result.current.markApplied([id], '2026-03');
    });
    expect(result.current.items[0].lastApplied).toBe('2026-03');
  });

  it('persists items to localStorage', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({ label: 'Gym', description: '', amount: 300, type: 'expense' });
    });
    const stored = JSON.parse(localStorage.getItem('mf_recurring') || '[]');
    expect(stored[0].label).toBe('Gym');
  });

  it('loads from localStorage on mount', () => {
    const items = [{ id: '1', label: 'Test', description: '', amount: 50, type: 'expense' }];
    localStorage.setItem('mf_recurring', JSON.stringify(items));
    const { result } = renderHook(() => useRecurring());
    expect(result.current.items[0].label).toBe('Test');
  });
});
