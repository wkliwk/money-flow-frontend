import { renderHook, act, waitFor } from '@testing-library/react';
import { useFxRates } from '../useFxRates';

describe('useFxRates', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults to HKD currency', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { CAD: 0.18, USD: 0.128, CNY: 0.93 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    expect(result.current.currency).toBe('HKD');
  });

  it('loads currency from localStorage', () => {
    localStorage.setItem('mf_currency', 'CAD');
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { CAD: 0.18, USD: 0.128, CNY: 0.93 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    expect(result.current.currency).toBe('CAD');
  });

  it('setCurrency persists to localStorage', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { CAD: 0.18, USD: 0.128, CNY: 0.93 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    act(() => {
      result.current.setCurrency('USD');
    });
    expect(result.current.currency).toBe('USD');
    expect(localStorage.getItem('mf_currency')).toBe('USD');
  });

  it('convert uses fetched rates', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { CAD: 0.18, USD: 0.2, CNY: 0.93 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setCurrency('USD');
    });
    // 100 HKD * 0.2 USD = 20
    expect(result.current.convert(100)).toBe(20);
  });

  it('falls back to default rates on fetch failure', async () => {
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
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ rates: { CAD: 0.18, USD: 0.128, CNY: 0.93 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFxRates());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convert(500)).toBe(500);
  });
});
