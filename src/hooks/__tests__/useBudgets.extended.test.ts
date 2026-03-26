/**
 * Extended useBudgets tests covering API fetch, debounce, and error paths.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBudgets } from '../useBudgets';

jest.mock('../../services/api', () => ({
  getBudgets: jest.fn(),
  saveBudgets: jest.fn(),
}));

import { getBudgets, saveBudgets } from '../../services/api';
const mockGetBudgets = getBudgets as jest.MockedFunction<typeof getBudgets>;
const mockSaveBudgets = saveBudgets as jest.MockedFunction<typeof saveBudgets>;

describe('useBudgets — extended coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetBudgets.mockResolvedValue([{ category: 'Food & Drink', limit: 3000 }]);
    mockSaveBudgets.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches budgets from API on mount and populates state', async () => {
    const { result } = renderHook(() => useBudgets());
    await waitFor(() => {
      expect(result.current.budgets['Food & Drink']).toBe(3000);
    });
    expect(mockGetBudgets).toHaveBeenCalled();
  });

  it('debounces saveBudgets call 800ms after setBudget', async () => {
    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalled());
    act(() => { result.current.setBudget('Food & Drink', 1500); });
    expect(mockSaveBudgets).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(800); });
    await waitFor(() => {
      expect(mockSaveBudgets).toHaveBeenCalledWith([{ category: 'Food & Drink', limit: 1500 }]);
    });
  });

  it('multiple quick setBudget calls only trigger one save', async () => {
    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalled());
    act(() => { result.current.setBudget('Food & Drink', 1000); });
    act(() => { result.current.setBudget('Food & Drink', 2000); });
    act(() => { result.current.setBudget('Food & Drink', 3000); });
    act(() => { jest.advanceTimersByTime(800); });
    await waitFor(() => expect(mockSaveBudgets).toHaveBeenCalledTimes(1));
    expect(mockSaveBudgets).toHaveBeenCalledWith([{ category: 'Food & Drink', limit: 3000 }]);
  });

  it('handles getBudgets API error gracefully', async () => {
    mockGetBudgets.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalled());
    // budgets should remain as empty object
    expect(result.current.budgets).toEqual({});
  });

  it('does not include zero-limit budgets in save payload', async () => {
    mockGetBudgets.mockResolvedValue([]);
    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalled());
    act(() => { result.current.setBudget('Transport', 0); });
    act(() => { jest.advanceTimersByTime(800); });
    await waitFor(() => expect(mockSaveBudgets).toHaveBeenCalled());
    const callArg = mockSaveBudgets.mock.calls[0][0];
    expect(callArg.find((b: { category: string }) => b.category === 'Transport')).toBeUndefined();
  });

  it('handles saveBudgets API error without crashing', async () => {
    mockSaveBudgets.mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() => useBudgets());
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalled());
    act(() => { result.current.setBudget('Food & Drink', 2500); });
    act(() => { jest.advanceTimersByTime(800); });
    await waitFor(() => expect(mockSaveBudgets).toHaveBeenCalled());
    // Should not throw
    expect(result.current.budgets['Food & Drink']).toBe(2500);
  });
});
