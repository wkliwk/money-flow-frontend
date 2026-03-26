import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecurring } from '../useRecurring';
import * as api from '../../services/api';

jest.mock('../../services/api', () => ({
  getRecurring: jest.fn(),
  createRecurring: jest.fn(),
  deleteRecurringAPI: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('useRecurring — branch coverage', () => {
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

  it('loadLocal returns [] when localStorage has invalid JSON', () => {
    localStorage.setItem('mf_recurring', 'not-valid-json');
    const { result } = renderHook(() => useRecurring());
    // Should fallback to []
    expect(result.current.items).toEqual([]);
  });

  it('loadMeta returns {} when localStorage has invalid JSON', async () => {
    localStorage.setItem('mf_recurring_meta', 'bad-json');
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({ label: 'Test', description: '', amount: 100, type: 'expense' });
    });
    // Should not crash
    expect(result.current.items.length).toBeGreaterThan(0);
  });

  it('apiToItem uses "expense" type fallback when meta has no type', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'id1', name: 'Netflix', amount: 100, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].type).toBe('expense');
  });

  it('apiToItem maps DAILY frequency', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'id2', name: 'Coffee', amount: 30, start_date: '2026-01-01', frequency: 'DAILY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].frequency).toBe('daily');
  });

  it('apiToItem maps WEEKLY frequency', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'id3', name: 'Gym', amount: 150, start_date: '2026-01-01', frequency: 'WEEKLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].frequency).toBe('weekly');
  });

  it('apiToItem maps unknown frequency to monthly', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'id4', name: 'Test', amount: 50, start_date: '2026-01-01', frequency: 'BIANNUAL' as 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].frequency).toBe('monthly');
  });

  it('migration skips items that fail createRecurring', async () => {
    const localItems = [
      { id: 'local1', label: 'Item1', description: '', amount: 50, type: 'expense', frequency: 'monthly' },
      { id: 'local2', label: 'Item2', description: '', amount: 100, type: 'expense', frequency: 'weekly' },
    ];
    localStorage.setItem('mf_recurring', JSON.stringify(localItems));
    mockedApi.getRecurring.mockResolvedValue([]);
    mockedApi.createRecurring
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ _id: 'migrated2', name: 'Item2', amount: 100, start_date: '2026-01-01', frequency: 'WEEKLY' });

    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(mockedApi.createRecurring).toHaveBeenCalledTimes(2));
    // Item2 should have been migrated
    expect(result.current.items.some((i) => i.label === 'Item2')).toBe(true);
  });

  it('deleteItem catches API error silently (item already removed from UI)', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'r99', name: 'Old', amount: 50, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    mockedApi.deleteRecurringAPI.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    await act(async () => {
      await result.current.deleteItem('r99');
    });
    // Item should be removed from UI despite API failure
    expect(result.current.items).toHaveLength(0);
  });

  it('addItem uses label fallback to description when label is empty', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({ label: '', description: 'Streaming service', amount: 75, type: 'expense' });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Streaming service' })
    );
  });

  it('addItem with weekly frequency sends WEEKLY to API', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({ label: 'Gym', description: '', amount: 200, type: 'expense', frequency: 'weekly' });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'WEEKLY' })
    );
  });

  it('addItem with daily frequency sends DAILY to API', async () => {
    const { result } = renderHook(() => useRecurring());
    await act(async () => {
      await result.current.addItem({ label: 'Coffee', description: '', amount: 30, type: 'expense', frequency: 'daily' });
    });
    expect(mockedApi.createRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'DAILY' })
    );
  });

  it('markApplied does not update items that are not in ids list', async () => {
    mockedApi.getRecurring.mockResolvedValue([
      { _id: 'r1', name: 'Rent', amount: 5000, start_date: '2026-01-01', frequency: 'MONTHLY' },
      { _id: 'r2', name: 'Netflix', amount: 100, start_date: '2026-01-01', frequency: 'MONTHLY' },
    ]);
    const { result } = renderHook(() => useRecurring());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => {
      result.current.markApplied(['r1'], '2026-03');
    });
    expect(result.current.items.find((i) => i.id === 'r1')?.lastApplied).toBe('2026-03');
    // r2 should not have lastApplied set
    expect(result.current.items.find((i) => i.id === 'r2')?.lastApplied).toBeUndefined();
  });
});
