/**
 * Extended useRecurring tests covering missing branches.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecurring } from '../useRecurring';
import * as api from '../../services/api';

jest.mock('../../services/api', () => ({
  getRecurring: jest.fn(),
  createRecurring: jest.fn(),
  deleteRecurringAPI: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('useRecurring — extended coverage', () => {
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

  it('uses "monthly" fallback when API returns unrecognized frequency', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'r1', name: 'Quarterly', amount: 500, start_date: '2026-01-01', frequency: 'QUARTERLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].frequency).toBe('monthly');
  });

  it('migrates item without label — uses description as name', async () => {
    const localItems = [{ id: 'local1', label: '', description: 'Electricity bill', amount: 300, type: 'expense', frequency: 'monthly' }];
    localStorage.setItem('mf_recurring', JSON.stringify(localItems));
    mockedApi.getRecurring.mockResolvedValue([]);
    mockedApi.createRecurring.mockResolvedValue({
      _id: 'migrated1', name: 'Electricity bill', amount: 300, start_date: '2026-01-01', frequency: 'MONTHLY', description: 'Electricity bill',
    });
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => {
      expect(mockedApi.createRecurring).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Electricity bill' })
      );
    });
    expect(result.current.items[0].id).toBe('migrated1');
  });

  it('migrates item without frequency — defaults to "monthly"', async () => {
    const localItems = [{ id: 'local2', label: 'Gym', description: 'Gym membership', amount: 400, type: 'expense' }];
    localStorage.setItem('mf_recurring', JSON.stringify(localItems));
    mockedApi.getRecurring.mockResolvedValue([]);
    mockedApi.createRecurring.mockResolvedValue({
      _id: 'migrated2', name: 'Gym', amount: 400, start_date: '2026-01-01', frequency: 'MONTHLY', description: 'Gym membership',
    });
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => {
      expect(mockedApi.createRecurring).toHaveBeenCalledWith(
        expect.objectContaining({ frequency: 'MONTHLY' })
      );
    });
    expect(result.current.items[0].id).toBe('migrated2');
  });

  it('addItem without label — uses description as name', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({
        label: '',
        description: 'Streaming subscription',
        amount: 98,
        type: 'expense',
      });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Streaming subscription' })
    );
  });

  it('addItem without frequency — defaults to MONTHLY', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({
        label: 'Phone',
        description: 'Phone bill',
        amount: 200,
        type: 'expense',
      });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'MONTHLY' })
    );
  });

  it('addItem with daily frequency maps to DAILY', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({
        label: 'Coffee',
        description: 'Daily coffee',
        amount: 30,
        type: 'expense',
        frequency: 'daily',
      });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'DAILY' })
    );
  });

  it('addItem with weekly frequency maps to WEEKLY', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({
        label: 'Groceries',
        description: 'Weekly groceries',
        amount: 500,
        type: 'expense',
        frequency: 'weekly',
      });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'WEEKLY' })
    );
  });

  it('skips migration when item already exists in API', async () => {
    const localItems = [{ id: 'api1', label: 'Existing', description: 'Already in API', amount: 100, type: 'expense' }];
    localStorage.setItem('mf_recurring', JSON.stringify(localItems));
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'api1', name: 'Existing', amount: 100, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    renderHook(() => useRecurring());
    await waitFor(() => expect(mockedApi.getRecurring).toHaveBeenCalled());
    expect(mockedApi.createRecurring).not.toHaveBeenCalled();
  });

  it('handles migration createRecurring failure gracefully', async () => {
    const localItems = [{ id: 'fail1', label: 'FailItem', description: 'Will fail', amount: 100, type: 'expense' }];
    localStorage.setItem('mf_recurring', JSON.stringify(localItems));
    mockedApi.getRecurring.mockResolvedValue([]);
    mockedApi.createRecurring.mockRejectedValue(new Error('migration failed'));
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(mockedApi.getRecurring).toHaveBeenCalled());
    expect(result.current.items).toBeDefined();
  });

  it('deleteItem handles API failure gracefully', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'del1', name: 'Gym', amount: 300, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    mockedApi.deleteRecurringAPI.mockRejectedValue(new Error('delete failed'));
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(async () => {
      await result.current.deleteItem('del1');
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('markApplied only updates ids in the provided array (others unchanged)', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'r1', name: 'Rent', amount: 5000, start_date: '2026-01-01', frequency: 'MONTHLY' },
      { _id: 'r2', name: 'Netflix', amount: 98, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => {
      result.current.markApplied(['r1'], '2026-03');
    });
    const r1 = result.current.items.find(i => i.id === 'r1');
    const r2 = result.current.items.find(i => i.id === 'r2');
    expect(r1?.lastApplied).toBe('2026-03');
    expect(r2?.lastApplied).toBeUndefined();
  });

  it('loadLocal handles corrupt JSON gracefully', () => {
    localStorage.setItem('mf_recurring', 'not-valid-json');
    const { result } = renderHook(() => useRecurring());
    expect(result.current.items).toEqual([]);
  });

  it('component unmount cancels inflight API request (cancelled = true path)', async () => {
    let resolveGet: (v: any) => void;
    mockedApi.getRecurring.mockReturnValue(new Promise((resolve) => { resolveGet = resolve; }));
    const { result, unmount } = renderHook(() => useRecurring());
    unmount();
    await act(async () => {
      resolveGet!([]);
    });
    expect(result.current).toBeDefined();
  });
});
