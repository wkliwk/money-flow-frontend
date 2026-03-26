import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../MainLayout';
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

const renderMainLayout = () =>
  render(
    <MemoryRouter>
      <MainLayout />
    </MemoryRouter>
  );

jest.setTimeout(15000);

describe('Empty state on Home tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenses.mockResolvedValue([]);
  });

  it('shows empty state card when no transactions exist', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByText('Track your first expense')).toBeInTheDocument();
    });
    expect(screen.getByText('Track your first expense to see insights')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add first expense/i })).toBeInTheDocument();
  });

  it('empty state button opens AddExpenseModal', async () => {
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add first expense/i })).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add first expense/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Record Transaction')).toBeInTheDocument();
    });
  });

  it('hides empty state when transactions exist', async () => {
    mockGetExpenses.mockResolvedValue([
      makeTransaction({ _id: '1', description: 'Coffee', item: 'Coffee Shop' }),
    ]);
    renderMainLayout();
    await waitFor(() => {
      expect(screen.getAllByText(/See all/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Track your first expense')).not.toBeInTheDocument();
  });
});
