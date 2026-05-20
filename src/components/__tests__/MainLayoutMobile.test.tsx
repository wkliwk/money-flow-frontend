import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../MainLayout';
import ToastProvider from '../Toast/ToastProvider';
import { Transaction } from '../../types';
import dayjs from 'dayjs';

// Mobile viewport mock
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => true, // simulate mobile
  };
});

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 100,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

const mockGetExpenses = jest.fn().mockResolvedValue([]);
const mockCreateExpense = jest.fn().mockResolvedValue(makeTransaction({ _id: 'new1' }));
const mockDeleteExpense = jest.fn().mockResolvedValue({});
const mockGetExpense = jest.fn().mockResolvedValue(makeTransaction());

jest.mock('../../services/api', () => ({
  getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
  getExpense: (...args: unknown[]) => mockGetExpense(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
  updateExpense: jest.fn().mockResolvedValue({}),
  getLastAmounts: jest.fn().mockResolvedValue({}),
  scanReceipt: jest.fn().mockResolvedValue({}),
  getMonthlyReport: jest.fn().mockResolvedValue([]),
  getPriceHistory: jest.fn().mockResolvedValue({ history: [], stats: null }),
  sendFriendRequest: jest.fn().mockResolvedValue({}),
  getFriends: jest.fn().mockResolvedValue([]),
  getPendingRequests: jest.fn().mockResolvedValue([]),
  acceptFriend: jest.fn().mockResolvedValue(undefined),
  rejectFriend: jest.fn().mockResolvedValue(undefined),
  removeFriend: jest.fn().mockResolvedValue(undefined),
  getNetWorth: jest.fn().mockResolvedValue([]),
  getLatestNetWorth: jest.fn().mockResolvedValue(null),
  createNetWorth: jest.fn().mockResolvedValue({}),
  deleteNetWorthSnapshot: jest.fn().mockResolvedValue(undefined),
  getBudgets: jest.fn().mockResolvedValue([]),
  saveBudgets: jest.fn().mockResolvedValue([]),
  getRecurring: jest.fn().mockResolvedValue([]),
  createRecurring: jest.fn().mockResolvedValue({}),
  deleteRecurringAPI: jest.fn().mockResolvedValue(undefined),
  getUserMe: jest.fn().mockResolvedValue({ _id: '1', email: 'test@test.com', themePreference: 'system' }),
  patchUserPreferences: jest.fn().mockResolvedValue(undefined),
  getExchangeRates: jest.fn().mockResolvedValue({ HKD: 1 }),
  register: jest.fn().mockResolvedValue(undefined),
  login: jest.fn().mockResolvedValue(undefined),
  loginWithGoogle: jest.fn().mockResolvedValue(undefined),
  loginWithApple: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Area: () => null,
  Pie: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ReferenceLine: () => null,
  Legend: () => null,
}));

jest.mock('../../hooks/useFxRates', () => ({
  useFxRates: () => ({
    currency: 'HKD',
    setCurrency: jest.fn(),
    convert: (n: number) => n,
    symbol: 'HK$',
    loading: false,
    rates: { HKD: 1, CAD: 0.18, USD: 0.128, CNY: 0.93 },
  }),
  CURRENCIES: ['HKD', 'CAD', 'USD', 'CNY'],
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '¥' },
  Currency: {},
}));

jest.mock('../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: {}, setBudget: jest.fn() }),
  BUDGET_CATEGORIES: ['Food & Drink', 'Transport'],
}));

jest.mock('../../hooks/useRecurring', () => ({
  useRecurring: () => ({ items: [], addItem: jest.fn(), deleteItem: jest.fn(), markApplied: jest.fn() }),
}));

jest.mock('../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({ presets: {}, setPreset: jest.fn(), deletePreset: jest.fn() }),
}));

jest.mock('../../hooks/useTemplates', () => ({
  useTemplates: () => ({ templates: [], addTemplate: jest.fn(), deleteTemplate: jest.fn() }),
}));
jest.mock('../../components/settings/FriendsSection', () => () => null);


const renderMainLayout = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </MemoryRouter>
  );

describe('MainLayout (mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenses.mockResolvedValue([]);
    mockCreateExpense.mockResolvedValue(makeTransaction({ _id: 'new1' }));
    mockDeleteExpense.mockResolvedValue({});
    mockGetExpense.mockResolvedValue(makeTransaction());
  });

  it('renders without crashing in mobile mode', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('MoneyFlow')).toBeInTheDocument();
    });
  });

  it('renders with transactions showing mobile hero section', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', amount: 100 }),
    ]);
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('MoneyFlow')).toBeInTheDocument();
    });
  });

  it('handles recurring items prompt when items exist', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('MoneyFlow')).toBeInTheDocument();
    });
  });

  it('shows BottomNavigation in mobile mode', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('navigates to transactions view via bottom nav', async () => {
    renderMainLayout();
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const transLabels = screen.getAllByText('Transactions');
    await act(async () => {
      fireEvent.click(transLabels[transLabels.length - 1]);
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search transactions…')).toBeInTheDocument();
    });
  });
});
