import { getExpenses, getExpense, createExpense, updateExpense, deleteExpense, login, register, getRecurring, createRecurring, deleteRecurringAPI } from '../api';
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
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { data: [sampleExpense] } });
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

  it('login calls POST /auth/login and stores token', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { token: 'abc123' } });
    await login('user@test.com', 'password');
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', { email: 'user@test.com', password: 'password' });
    expect(localStorage.getItem('mf_token')).toBe('abc123');
  });

  it('register calls POST /auth/register and stores token', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { token: 'reg456' } });
    await register('newuser@test.com', 'newpass');
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', { email: 'newuser@test.com', password: 'newpass' });
    expect(localStorage.getItem('mf_token')).toBe('reg456');
  });

  it('getRecurring calls GET /api/recurring and returns recurring array', async () => {
    const recurring = [{ _id: 'r1', name: 'Netflix', amount: 15, frequency: 'MONTHLY', start_date: '2026-01-01' }];
    (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { recurring } });
    const result = await getRecurring();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/recurring');
    expect(result).toEqual(recurring);
  });

  it('createRecurring calls POST /api/recurring', async () => {
    const data = { name: 'Rent', amount: 5000, start_date: '2026-01-01', frequency: 'MONTHLY' };
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { _id: 'r2', ...data } });
    const result = await createRecurring(data);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/recurring', data);
    expect(result._id).toBe('r2');
  });

  it('deleteRecurringAPI calls DELETE /api/recurring/:id', async () => {
    (mockedAxios.delete as jest.Mock).mockResolvedValue({});
    await deleteRecurringAPI('r1');
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/recurring/r1');
  });
});
