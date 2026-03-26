/**
 * Extended useFxRates tests covering frankfurter fallback path and cache behaviour.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFxRates, resetFxCache } from '../useFxRates';

jest.mock('../../services/api', () => ({ getExchangeRates: jest.fn() }));

import { getExchangeRates } from '../../services/api';
const mockGetExchangeRates = getExchangeRates as jest.MockedFunction<typeof getExchangeRates>;

describe('useFxRates — extended coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetFxCache();
    jest.clearAllMocks();
    mockGetExchangeRates.mockResolvedValue({ CNY: 0.93, JPY: 19.3, USD: 0.128, EUR: 0.118, GBP: 0.101, TWD: 4.12, THB: 4.45, KRW: 175, CAD: 0.18 });
  });

  afterEach(() => { jest.restoreAllMocks(); resetFxCache(); });

  it('uses frankfurter rates when backend fails but frankfurter succeeds', async () => {
    mockGetExchangeRates.mockRejectedValue(new Error('backend down'));
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { CAD: 0.2, USD: 0.15 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setCurrency('CAD'); });
    expect(result.current.convert(100)).toBe(20);
  });

  it('falls back to defaults when frankfurter returns no rates property', async () => {
    mockGetExchangeRates.mockRejectedValue(new Error('backend down'));
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ base: 'HKD' }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setCurrency('USD'); });
    expect(result.current.convert(100)).toBe(12.8); // default USD rate
  });

  it('falls back to defaults when both backend and frankfurter fail', async () => {
    mockGetExchangeRates.mockRejectedValue(new Error('network error'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.setCurrency('CAD'); });
    expect(result.current.convert(100)).toBe(18);
  });

  it('uses cached rates on subsequent hook instantiation (fetch only once)', async () => {
    const { result: r1 } = renderHook(() => useFxRates());
    await waitFor(() => expect(r1.current.loading).toBe(false));

    const { result: r2 } = renderHook(() => useFxRates());
    await waitFor(() => expect(r2.current.loading).toBe(false));

    expect(mockGetExchangeRates).toHaveBeenCalledTimes(1);
  });

  it('merges only known currency keys from API — unknown keys ignored', async () => {
    mockGetExchangeRates.mockResolvedValue({ USD: 0.2, UNKNOWN_CURRENCY: 999 } as any);
    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rates).not.toHaveProperty('UNKNOWN_CURRENCY');
    act(() => { result.current.setCurrency('USD'); });
    expect(result.current.convert(100)).toBe(20);
  });

  it('rateForCurrency returns 1 when rate is 0 (guards division by zero)', async () => {
    mockGetExchangeRates.mockResolvedValue({ USD: 0 } as any);
    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rateForCurrency('USD')).toBe(1);
  });

  it('frankfurter fallback only merges known currency keys', async () => {
    mockGetExchangeRates.mockRejectedValue(new Error('backend down'));
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { USD: 0.15, UNKNOWN: 999 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rates).not.toHaveProperty('UNKNOWN');
    act(() => { result.current.setCurrency('USD'); });
    expect(result.current.convert(100)).toBe(15);
  });
});
