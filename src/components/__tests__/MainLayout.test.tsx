import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../MainLayout';

// Mock all API calls
jest.mock('../../services/api', () => ({
  getExpenses: jest.fn().mockResolvedValue([]),
  getExpense: jest.fn(),
  createExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));

// Mock all recharts
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

// Mock hooks
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

describe('MainLayout', () => {
  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Money Flow')).toBeInTheDocument();
    });
  });

  it('renders main content area', async () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Money Flow')).toBeInTheDocument();
    });
  });
});
