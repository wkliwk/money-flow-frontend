import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } from '../api';
import axiosInstance from '../../axiosInstance';

jest.mock('../../axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleExpense = {
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense' as const,
  category: 'Food & Drink',
};

beforeEach(() => {
  jest.clearAllMocks();
  // also silence setToken by clearing localStorage
  localStorage.clear();
});

describe('api service', () => {
  it('getExpenses calls GET /api/expenses and returns data', async () => {
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [sampleExpense] });
    const result = await getExpenses();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/expenses');
    expect(result).toEqual([sampleExpense]);
  });

  it('getExpense calls GET /api/expenses/:id', async () => {
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: sampleExpense });
    const result = await getExpense('123');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/expenses/123');
    expect(result).toEqual(sampleExpense);
  });

  it('createExpense calls POST /api/expenses with data', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { ...sampleExpense, _id: '1' } });
    const result = await createExpense(sampleExpense);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/expenses', sampleExpense);
    expect(result._id).toBe('1');
  });

  it('updateExpense calls PUT /api/expenses/:id with data', async () => {
    (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { ...sampleExpense, _id: '1' } });
    await updateExpense('1', sampleExpense);
    expect(mockedAxios.put).toHaveBeenCalledWith('/api/expenses/1', sampleExpense);
  });

  it('deleteExpense calls DELETE /api/expenses/:id', async () => {
    (mockedAxios.delete as jest.Mock).mockResolvedValue({});
    await deleteExpense('1');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/expenses/1');
  });
});
