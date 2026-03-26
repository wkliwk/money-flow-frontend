/**
 * Extended API service tests covering untested endpoints:
 * getExchangeRates, getBudgets, saveBudgets, getNetWorth, getLatestNetWorth,
 * createNetWorth, deleteNetWorthSnapshot.
 */
import axiosInstance from '../../axiosInstance';
import * as api from '../api';

jest.mock('../../axiosInstance');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('api — extended endpoint coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getExchangeRates', () => {
    it('returns rates from backend', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: { USD: 0.128, CAD: 0.18 } });
      const result = await api.getExchangeRates();
      expect(result).toEqual({ USD: 0.128, CAD: 0.18 });
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/exchange-rates/HKD');
    });

    it('throws on network error', async () => {
      (mockedAxios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(api.getExchangeRates()).rejects.toThrow('Network error');
    });
  });

  describe('getBudgets', () => {
    it('returns budget array', async () => {
      const budgets = [{ category: 'Food & Drink', limit: 3000 }];
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: budgets });
      const result = await api.getBudgets();
      expect(result).toEqual(budgets);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/budgets');
    });

    it('throws on error', async () => {
      (mockedAxios.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(api.getBudgets()).rejects.toThrow('Not found');
    });
  });

  describe('saveBudgets', () => {
    it('posts budget array and returns response', async () => {
      const budgets = [{ category: 'Food & Drink', limit: 3000 }];
      (mockedAxios.post as jest.Mock).mockResolvedValueOnce({ data: budgets });
      const result = await api.saveBudgets(budgets);
      expect(result).toEqual(budgets);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/budgets', budgets);
    });

    it('posts empty array', async () => {
      (mockedAxios.post as jest.Mock).mockResolvedValueOnce({ data: [] });
      const result = await api.saveBudgets([]);
      expect(result).toEqual([]);
    });
  });

  describe('getNetWorth', () => {
    it('returns net worth snapshots', async () => {
      const snapshots = [{ _id: 's1', date: '2026-01-01', netWorth: 50000 }];
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: snapshots });
      const result = await api.getNetWorth();
      expect(result).toEqual(snapshots);
    });

    it('accepts months parameter', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await api.getNetWorth(12);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/net-worth?months=12');
    });

    it('defaults to 6 months', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: [] });
      await api.getNetWorth();
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/net-worth?months=6');
    });
  });

  describe('getLatestNetWorth', () => {
    it('returns latest snapshot when data.data exists', async () => {
      const snapshot = { _id: 's1', date: '2026-03-01', netWorth: 50000 };
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: { data: snapshot } });
      const result = await api.getLatestNetWorth();
      expect(result).toEqual(snapshot);
    });

    it('returns null when data.data is undefined', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: {} });
      const result = await api.getLatestNetWorth();
      expect(result).toBeNull();
    });

    it('returns null when data.data is null', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValueOnce({ data: { data: null } });
      const result = await api.getLatestNetWorth();
      expect(result).toBeNull();
    });
  });

  describe('createNetWorth', () => {
    it('creates a new net worth snapshot', async () => {
      const payload = {
        assets: { cash: 50000, investments: 20000, property: 0, other: 0 },
        liabilities: { loans: 5000, creditCardDebt: 0, other: 0 },
      };
      const created = { _id: 'nw1', date: '2026-03-01', ...payload, netWorth: 65000 };
      (mockedAxios.post as jest.Mock).mockResolvedValueOnce({ data: created });
      const result = await api.createNetWorth(payload);
      expect(result).toEqual(created);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/net-worth', payload);
    });
  });

  describe('deleteNetWorthSnapshot', () => {
    it('deletes a net worth snapshot by id', async () => {
      (mockedAxios.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
      await api.deleteNetWorthSnapshot('nw1');
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/net-worth/nw1');
    });

    it('propagates error on deletion failure', async () => {
      (mockedAxios.delete as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(api.deleteNetWorthSnapshot('bad-id')).rejects.toThrow('Not found');
    });
  });
});
