import { renderHook, act, waitFor } from '@testing-library/react';
import { useFxRates, resetFxCache } from '../useFxRates';

// Mock the api module
jest.mock('../../services/api', () => ({
  getExchangeRates: jest.fn(),
}));

import { getExchangeRates } from '../../services/api';
const mockGetExchangeRates = getExchangeRates as jest.MockedFunction<typeof getExchangeRates>;

describe('useFxRates', () => {
  beforeEach(() => {
    localStorage.clear();
    resetFxCache();
    jest.clearAllMocks();
    // Default: backend returns rates
    mockGetExchangeRates.mockResolvedValue({
      CNY: 0.93,
      JPY: 19.3,
      USD: 0.128,
      EUR: 0.118,
      GBP: 0.101,
      TWD: 4.12,
      THB: 4.45,
      KRW: 175,
      CAD: 0.18,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults to locale-detected currency (USD in jsdom default en-US)', async () => {
    const { result } = renderHook(() => useFxRates());
    expect(result.current.currency).toBe('USD');
  });

  it('loads currency from localStorage (overriding locale detection)', () => {
    localStorage.setItem('mf_currency', 'CAD');
    const { result } = renderHook(() => useFxRates());
    expect(result.current.currency).toBe('CAD');
  });

  it('setCurrency persists to localStorage', async () => {
    const { result } = renderHook(() => useFxRates());
    act(() => {
      result.current.setCurrency('USD');
    });
    expect(result.current.currency).toBe('USD');
    expect(localStorage.getItem('mf_currency')).toBe('USD');
  });

  it('convert uses fetched rates', async () => {
    mockGetExchangeRates.mockResolvedValue({
      CNY: 0.93,
      JPY: 19.3,
      USD: 0.2,
      EUR: 0.118,
      GBP: 0.101,
      TWD: 4.12,
      THB: 4.45,
      KRW: 175,
      CAD: 0.18,
    });

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setCurrency('USD');
    });
    // 100 HKD * 0.2 USD = 20
    expect(result.current.convert(100)).toBe(20);
  });

  it('falls back to default rates on fetch failure', async () => {
    mockGetExchangeRates.mockRejectedValue(new Error('network error'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Default CAD rate is 0.18
    act(() => {
      result.current.setCurrency('CAD');
    });
    expect(result.current.convert(100)).toBe(18);
  });

  it('convert for HKD returns same amount', async () => {
    localStorage.setItem('mf_currency', 'HKD');
    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convert(500)).toBe(500);
  });

  it('rateForCurrency returns HKD per 1 foreign unit', async () => {
    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rateForCurrency('HKD')).toBe(1);
    // JPY rate is 19.3 per HKD, so 1 JPY = 1/19.3 HKD
    const jpyRate = result.current.rateForCurrency('JPY');
    expect(jpyRate).toBeCloseTo(1 / 19.3, 4);
  });

  it('includes expanded currency list', () => {
    const { result } = renderHook(() => useFxRates());
    expect(result.current.rates).toHaveProperty('JPY');
    expect(result.current.rates).toHaveProperty('EUR');
    expect(result.current.rates).toHaveProperty('GBP');
    expect(result.current.rates).toHaveProperty('TWD');
    expect(result.current.rates).toHaveProperty('THB');
    expect(result.current.rates).toHaveProperty('KRW');
  });
});
