import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecurring } from '../useRecurring';
import * as api from '../../services/api';

jest.mock('../../services/api', () => ({
  getRecurring: jest.fn(),
  createRecurring: jest.fn(),
  deleteRecurringAPI: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('useRecurring', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockedApi.getRecurring.mockResolvedValue([]);
    mockedApi.createRecurring.mockImplementation(async (data) => ({
      _id: String(Date.now()),
      name: data.name,
      amount: data.amount,
      category: data.category,
      start_date: data.start_date,
      frequency: data.frequency,
      description: data.description,
    }));
    mockedApi.deleteRecurringAPI.mockResolvedValue(undefined);
  });

  it('starts with empty items', () => {
    const { result } = renderHook(() => useRecurring());
    expect(result.current.items).toEqual([]);
  });

  it('fetches from API on mount', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'abc', name: 'Netflix', amount: 100, category: 'Entertainment', start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });
    expect(result.current.items[0].label).toBe('Netflix');
    expect(result.current.items[0].id).toBe('abc');
    expect(result.current.items[0].frequency).toBe('monthly');
  });

  it('addItem creates via API and adds to state', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({
        label: 'Netflix',
        description: 'Streaming',
        amount: 100,
        type: 'expense',
      });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].label).toBe('Netflix');
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Netflix', amount: 100 })
    );
  });

  it('addItem falls back to localStorage when API fails', async () => {
    mockedApi.createRecurring.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({ label: 'Rent', description: '', amount: 5000, type: 'expense' });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].label).toBe('Rent');
  });

  it('deleteItem removes from state and calls API', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'del1', name: 'Gym', amount: 300, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(async () => {
      await result.current.deleteItem('del1');
    });
    expect(result.current.items).toHaveLength(0);
    expect(mockedApi.deleteRecurringAPI).toHaveBeenCalledWith('del1');
  });

  it('markApplied sets lastApplied on specified ids', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'r1', name: 'Rent', amount: 5000, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => {
      result.current.markApplied(['r1'], '2026-03');
    });
    expect(result.current.items[0].lastApplied).toBe('2026-03');
  });

  it('persists items to localStorage', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({ label: 'Gym', description: '', amount: 300, type: 'expense' });
    });
    const stored = JSON.parse(localStorage.getItem('mf_recurring') || '[]');
    expect(stored[0].label).toBe('Gym');
  });

  it('falls back to localStorage when API fetch fails', async () => {
    const items = [{ id: '1', label: 'Test', description: '', amount: 50, type: 'expense' }];
    localStorage.setItem('mf_recurring', JSON.stringify(items));
    mockedApi.getRecurring.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useRecurring());
    expect(result.current.items[0].label).toBe('Test');
  });

  it('migrates localStorage items to API on first load', async () => {
    const localItems = [{ id: 'local1', label: 'Old item', description: 'test', amount: 50, type: 'expense', frequency: 'monthly' }];
    localStorage.setItem('mf_recurring', JSON.stringify(localItems));
    mockedApi.getRecurring.mockResolvedValue([]);
    mockedApi.createRecurring.mockResolvedValue({
      _id: 'migrated1', name: 'Old item', amount: 50, start_date: '2026-01-01', frequency: 'MONTHLY', description: 'test',
    });
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => {
      expect(mockedApi.createRecurring).toHaveBeenCalled();
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Old item', amount: 50 })
    );
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('migrated1');
  });
});
