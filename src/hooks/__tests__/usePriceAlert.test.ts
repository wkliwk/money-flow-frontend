import { renderHook, act, waitFor } from '@testing-library/react';
import { usePriceAlert } from '../usePriceAlert';

jest.mock('../../services/api', () => ({
  getPriceHistory: jest.fn(),
}));

const { getPriceHistory } = require('../../services/api');

beforeEach(() => jest.clearAllMocks());

describe('usePriceAlert', () => {
  it('returns show:false when no item', () => {
    const { result } = renderHook(() => usePriceAlert('', '100'));
    expect(result.current.show).toBe(false);
  });

  it('returns show:false when no amount', async () => {
    getPriceHistory.mockResolvedValue({ history: [], stats: { count: 5, avg: 50, min: 40, max: 60, latest: 55 } });
    const { result } = renderHook(() => usePriceAlert('Coffee', ''));
    await waitFor(() => expect(getPriceHistory).toHaveBeenCalled());
    expect(result.current.show).toBe(false);
  });

  it('returns show:false when stats have fewer than 3 data points', async () => {
    getPriceHistory.mockResolvedValue({ history: [], stats: { count: 2, avg: 50, min: 40, max: 60, latest: 55 } });
    const { result } = renderHook(() => usePriceAlert('Coffee', '100'));
    await waitFor(() => expect(getPriceHistory).toHaveBeenCalled());
    expect(result.current.show).toBe(false);
  });

  it('returns show:true when amount exceeds 30% above average', async () => {
    getPriceHistory.mockResolvedValue({ history: [], stats: { count: 5, avg: 50, min: 40, max: 60, latest: 55 } });
    const { result } = renderHook(() => usePriceAlert('Coffee', '80'));
    await waitFor(() => expect(result.current.show).toBe(true));
    expect(result.current.percentAbove).toBe(60);
    expect(result.current.message).toContain('Coffee');
  });

  it('returns show:false when stats are null', async () => {
    getPriceHistory.mockResolvedValue({ history: [], stats: null });
    const { result } = renderHook(() => usePriceAlert('Coffee', '100'));
    await waitFor(() => expect(getPriceHistory).toHaveBeenCalled());
    expect(result.current.show).toBe(false);
  });

  it('handles API error gracefully', async () => {
    getPriceHistory.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePriceAlert('Coffee', '100'));
    await waitFor(() => expect(getPriceHistory).toHaveBeenCalled());
    expect(result.current.show).toBe(false);
  });
});
