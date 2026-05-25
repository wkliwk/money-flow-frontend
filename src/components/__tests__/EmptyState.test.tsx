import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
const mockCreateExpense = jest.fn().mockResolvedValue(
  makeTransaction({ _id: 'new1', description: 'New tx' })
);

jest.mock('../../services/api', () => ({
  getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
  getExpense: jest.fn().mockResolvedValue({}),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  deleteExpense: jest.fn().mockResolvedValue({}),
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
  getContacts: jest.fn().mockResolvedValue([]),
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
  CURRENCY_SYMBOLS: { HKD: 'HK$', CAD: 'CA$', USD: 'US$', CNY: '\u00A5' },
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
jest.mock('../../components/settings/ContactsSection', () => () => null);


const renderMainLayout = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </MemoryRouter>
  );

jest.setTimeout(15000);

const navigateToTransactionsTab = async () => {
  await waitFor(() => screen.getAllByText('Home').length > 0);
  const txnLabels = screen.getAllByText('Transactions');
  await act(async () => {
    fireEvent.click(txnLabels[txnLabels.length - 1]);
  });
};

beforeEach(() => {
  localStorage.setItem('mf_onboarding_complete', 'true');
});

afterEach(() => {
  localStorage.clear();
});

describe('Empty state on Home tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenses.mockResolvedValue([]);
  });

  it('shows empty state card when no transactions exist', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Track your first expense to see your spending here.')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add transaction/i }).length).toBeGreaterThan(0);
  });

  it('empty state button opens AddTransactionSheet', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
    // The dashboard EmptyState CTA is "Add transaction"; pick the one inside the EmptyState card
    const ctaButtons = screen.getAllByRole('button', { name: /add transaction/i });
    await act(async () => {
      fireEvent.click(ctaButtons[0]);
    });
    await waitFor(() => {
      expect(screen.getByText('Add transaction')).toBeInTheDocument();
    });
  });

  it('renders no hardcoded summary values when transactions are empty', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
    // Guard against regressions where mock placeholder amounts like "3,500" / "+3500"
    // accidentally reappear in the dashboard summary.
    expect(screen.queryByText(/\b3,?500\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+\s*3\s*500/)).not.toBeInTheDocument();
  });

  it('hides empty state when transactions exist', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', item: 'Coffee Shop' }),
    ]);
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText(/See all/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();
  });

  it('shows DashboardSkeleton while transactions are loading', async () => {
    // Delay the API resolution so the loading state is observable in render.
    let resolveFn: (value: unknown[]) => void = () => {};
    mockGetExpenses.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFn = resolve;
      })
    );
    renderMainLayout();
    // Skeleton is rendered while initialLoading=true
    expect(await screen.findByTestId('dashboard-skeleton')).toBeInTheDocument();
    await act(async () => {
      resolveFn([]);
    });
    // Once loaded with no data, EmptyState should appear and skeleton should go away
    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
  });
});

describe('Empty state on Transactions tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows onboarding empty state when no transactions exist', async () => {
    mockGetExpenses.mockResolvedValue([]);
    renderMainLayout();
    await navigateToTransactionsTab();
    // With the default 'month' preset, the empty state now references the
    // current month (e.g. "No matches for May 2026") and still surfaces the
    // add-expense CTA so first-time users can record their first transaction.
    await waitFor(() => {
      const text = screen.queryByText('No transactions yet') || screen.queryByText(/No matches for/);
      expect(text).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
  });

  it('onboarding CTA button opens AddExpenseModal', async () => {
    mockGetExpenses.mockResolvedValue([]);
    renderMainLayout();
    await navigateToTransactionsTab();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Record Transaction')).toBeInTheDocument();
    });
  });

  it('shows empty state when transactions exist but none match current month filter', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', type: 'expense', date: dayjs().subtract(2, 'year').format('YYYY-MM-DD') }),
    ]);
    renderMainLayout();
    await navigateToTransactionsTab();
    // The transaction is from 2 years ago. With the default 'month' preset the
    // list filters to the current month and shows a month-aware empty state.
    await waitFor(() => {
      expect(screen.getByText(/No matches for/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows transaction list when transactions exist and match filters', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', type: 'expense' }),
    ]);
    renderMainLayout();
    await navigateToTransactionsTab();
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });
    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();
    expect(screen.queryByText('No results')).not.toBeInTheDocument();
  });
});
