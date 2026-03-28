import { renderHook, act } from '@testing-library/react';

const mockGetRecurring = jest.fn().mockResolvedValue([]);
const mockCreateRecurring = jest.fn().mockResolvedValue({ id: 'server-1', _id: 'server-1' });
const mockDeleteRecurring = jest.fn().mockResolvedValue(null);
const mockUpdateRecurring = jest.fn().mockResolvedValue({});

jest.mock('../../services/api', () => ({
  getRecurring: (...args: unknown[]) => mockGetRecurring(...args),
  createRecurring: (...args: unknown[]) => mockCreateRecurring(...args),
  deleteRecurring: (...args: unknown[]) => mockDeleteRecurring(...args),
  updateRecurring: (...args: unknown[]) => mockUpdateRecurring(...args),
}));

import { useRecurring } from '../useRecurring';

describe('useRecurring', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockGetRecurring.mockResolvedValue([]);
    mockCreateRecurring.mockResolvedValue({ id: 'server-1', _id: 'server-1' });
    mockDeleteRecurring.mockResolvedValue(null);
    mockUpdateRecurring.mockResolvedValue({});
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

  it('addItem calls createRecurring API', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({ label: 'Netflix', description: 'Streaming', amount: 100, type: 'expense' });
    });
    expect(mockCreateRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Netflix', amount: 100 })
    );
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

  it('deleteItem calls deleteRecurring API', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({ label: 'Netflix', description: '', amount: 100, type: 'expense' });
    });
    const id = result.current.items[0].id;
    act(() => {
      result.current.deleteItem(id);
    });
    expect(mockDeleteRecurring).toHaveBeenCalledWith(id);
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

  it('markApplied syncs to server', () => {
    const { result } = renderHook(() => useRecurring());
    act(() => {
      result.current.addItem({ label: 'Rent', description: '', amount: 5000, type: 'expense' });
    });
    const id = result.current.items[0].id;
    act(() => {
      result.current.markApplied([id], '2026-03');
    });
    expect(mockUpdateRecurring).toHaveBeenCalledWith(id, { lastApplied: '2026-03' });
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
