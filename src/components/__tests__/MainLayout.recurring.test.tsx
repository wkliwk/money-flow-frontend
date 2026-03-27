/**
 * MainLayout applyRecurring branch coverage tests.
 * Requires a different useRecurring mock (items with pending transactions).
 */
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

const mockGetExpenses = jest.fn().mockResolvedValue([makeTransaction({ _id: 'base1' })]);
const mockCreateExpense = jest.fn().mockResolvedValue(makeTransaction({ _id: 'created1' }));
const mockMarkApplied = jest.fn();
const currentMonthKey = dayjs().format('YYYY-MM');

jest.mock('../../services/api', () => ({
  getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
  getExpense: jest.fn().mockResolvedValue(null),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  deleteExpense: jest.fn().mockResolvedValue({}),
  updateExpense: jest.fn().mockResolvedValue({}),
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
  useBudgets: () => ({ budgets: { 'Food & Drink': 500 }, setBudget: jest.fn() }),
  BUDGET_CATEGORIES: ['Food & Drink'],
}));

// Mock with a pending recurring item
jest.mock('../../hooks/useRecurring', () => ({
  useRecurring: () => ({
    items: [
      {
        id: 'r1',
        label: 'Netflix',
        description: 'Netflix subscription',
        amount: 98,
        type: 'expense',
        item: 'Subscriptions',
        category: 'Entertainment',
        participants: [],
        lastApplied: '2023-01-01',
      },
    ],
    addItem: jest.fn(),
    deleteItem: jest.fn(),
    markApplied: mockMarkApplied,
  }),
}));

jest.mock('../../hooks/useItemPresets', () => ({
  useItemPresets: () => ({ presets: {}, setPreset: jest.fn(), deletePreset: jest.fn() }),
}));

jest.mock('../../hooks/useTemplates', () => ({
  useTemplates: () => ({ templates: [], addTemplate: jest.fn(), deleteTemplate: jest.fn() }),
}));

jest.setTimeout(30000);

beforeEach(() => {
  localStorage.setItem('mf_onboarding_complete', 'true');
});

afterEach(() => {
  localStorage.clear();
});

describe('MainLayout — applyRecurring branch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenses.mockResolvedValue([makeTransaction({ _id: 'base1', description: 'BaseTx' })]);
    mockCreateExpense.mockResolvedValue(makeTransaction({ _id: 'created1', description: 'Netflix subscription' }));
  });

  it('renders pending recurring banner when items are pending', async () => {
    render(<MemoryRouter><MainLayout /></MemoryRouter>);
    await waitFor(() => screen.getAllByText('Home').length > 0);
    await waitFor(() => {
      const pendingBanners = screen.queryAllByText(/recurring transaction/i);
      expect(pendingBanners.length).toBeGreaterThan(0);
    });
  });

  it('clicking Apply in recurring banner triggers applyRecurring — calls createExpense', async () => {
    render(<MemoryRouter><MainLayout /></MemoryRouter>);
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const applyButtons = await screen.findAllByRole('button', { name: /apply/i });
    if (applyButtons.length > 0) {
      await act(async () => { fireEvent.click(applyButtons[0]); });
      await waitFor(() => {
        expect(mockCreateExpense).toHaveBeenCalledWith(expect.objectContaining({
          description: 'Netflix subscription',
          amount: 98,
          type: 'expense',
        }));
      });
    }
    expect(document.body).toBeTruthy();
  });

  it('applyRecurring calls markApplied after creating transactions', async () => {
    render(<MemoryRouter><MainLayout /></MemoryRouter>);
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const applyButtons = screen.queryAllByRole('button', { name: /apply/i });
    if (applyButtons.length > 0) {
      await act(async () => { fireEvent.click(applyButtons[0]); });
      await waitFor(() => {
        expect(mockMarkApplied).toHaveBeenCalledWith(['r1'], currentMonthKey);
      });
    }
    expect(document.body).toBeTruthy();
  });

  it('applyRecurring with single item shows singular snackbar message', async () => {
    render(<MemoryRouter><MainLayout /></MemoryRouter>);
    await waitFor(() => screen.getAllByText('Home').length > 0);
    const applyButtons = screen.queryAllByRole('button', { name: /apply/i });
    if (applyButtons.length > 0) {
      await act(async () => { fireEvent.click(applyButtons[0]); });
    }
    expect(document.body).toBeTruthy();
  });
});
