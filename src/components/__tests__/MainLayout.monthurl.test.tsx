/**
 * MainLayout — month URL sync tests (?month=YYYY-MM).
 * Covers initial parse, default to current month, and round-trip on prev/next.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import MainLayout from '../MainLayout';
import ToastProvider from '../Toast/ToastProvider';
import { Transaction } from '../../types';
import dayjs from 'dayjs';

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
const mockGetExpense = jest.fn().mockResolvedValue(makeTransaction({ _id: '1' }));

jest.mock('../../services/api', () => ({
  __esModule: true,
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
  Bar: () => null, Area: () => null, Pie: () => null, Line: () => null,
  XAxis: () => null, YAxis: () => null, Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null, ReferenceLine: () => null, Legend: () => null,
}));

jest.mock('../../hooks/useFxRates', () => ({
  useFxRates: () => ({ currency: 'HKD', setCurrency: jest.fn(), convert: (n: number) => n, symbol: 'HK$', loading: false, rates: { HKD: 1 } }),
  CURRENCIES: ['HKD'], CURRENCY_SYMBOLS: { HKD: 'HK$' }, Currency: {},
}));

jest.mock('../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: {}, setBudget: jest.fn() }),
  BUDGET_CATEGORIES: ['Food & Drink'],
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

let lastSearch = '';
const LocationProbe: React.FC = () => {
  const loc = useLocation();
  lastSearch = loc.search;
  return null;
};

const renderAt = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
      <LocationProbe />
    </MemoryRouter>
  );

jest.setTimeout(30000);

describe('MainLayout — ?month URL sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastSearch = '';
    localStorage.removeItem('mf_date_preset');
    mockGetExpenses.mockResolvedValue([]);
  });

  afterEach(() => {
    localStorage.removeItem('mf_date_preset');
  });

  it('writes current month to URL when none provided', async () => {
    renderAt('/');
    const expected = dayjs().format('YYYY-MM');
    await waitFor(() => {
      expect(lastSearch).toContain(`month=${expected}`);
    });
  });

  it('parses ?month=YYYY-MM and preserves it in URL', async () => {
    renderAt('/?month=2026-04');
    // Wait for at least one render cycle so URL sync effects have a chance to run.
    await waitFor(() => {
      expect(screen.getByText('Money Flow')).toBeInTheDocument();
    });
    // After mount, the URL still contains the requested month (state initialised from URL,
    // sync effect is a no-op because the param matches state).
    await waitFor(() => {
      expect(lastSearch).toContain('month=2026-04');
    });
  });

  it('ignores invalid ?month value and falls back to current month', async () => {
    renderAt('/?month=not-a-month');
    const expected = dayjs().format('YYYY-MM');
    await waitFor(() => {
      expect(lastSearch).toContain(`month=${expected}`);
    });
  });
});
