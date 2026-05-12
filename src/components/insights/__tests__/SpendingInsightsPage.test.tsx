import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../../theme';
import SpendingInsightsPage from '../SpendingInsightsPage';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

jest.mock('../../../services/api', () => ({
  getMonthlyReport: jest.fn(),
}));

jest.mock('recharts', () => ({
  BarChart: ({ children, 'data-testid': testId }: { children: React.ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId || 'bar-chart'}>{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => null,
}));

const { getMonthlyReport } = require('../../../services/api') as { getMonthlyReport: jest.Mock };

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  category: 'Food',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

const renderComponent = (transactions: Transaction[] = []) =>
  render(
    <ThemeProvider theme={darkTheme}>
      <SpendingInsightsPage transactions={transactions} convert={(n) => n} symbol="HK$" />
    </ThemeProvider>
  );

describe('SpendingInsightsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially without spinner', () => {
    getMonthlyReport.mockReturnValue(new Promise(() => {}));
    renderComponent();
    // Skeleton replaces spinner — no progressbar role present
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders page title after data loads', async () => {
    getMonthlyReport.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Spending Insights')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    getMonthlyReport.mockRejectedValue(new Error('fail'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/could not load report data/i)).toBeInTheDocument();
    });
  });

  it('renders monthly summary with transactions', async () => {
    getMonthlyReport.mockResolvedValue([
      { month: dayjs().format('YYYY-MM'), totalExpense: 5000, totalIncome: 10000, netBalance: 5000 },
    ]);
    const txns = [
      makeTransaction({ _id: '1', amount: 3000, type: 'expense', category: 'Food' }),
      makeTransaction({ _id: '2', amount: 2000, type: 'expense', category: 'Transport' }),
      makeTransaction({ _id: '3', amount: 10000, type: 'income' }),
    ];
    renderComponent(txns);
    await waitFor(() => {
      expect(screen.getByText('Spending Insights')).toBeInTheDocument();
    });
    expect(screen.getByText(/this month/i)).toBeInTheDocument();
  });

  it('renders bar chart when report data available', async () => {
    getMonthlyReport.mockResolvedValue([
      { month: dayjs().format('YYYY-MM'), totalExpense: 5000, totalIncome: 10000, netBalance: 5000 },
      { month: dayjs().subtract(1, 'month').format('YYYY-MM'), totalExpense: 4000, totalIncome: 9000, netBalance: 5000 },
    ]);
    renderComponent([makeTransaction()]);
    await waitFor(() => {
      expect(screen.getByTestId('insights-chart')).toBeInTheDocument();
    });
  });

  it('renders spending forecast for categories with 3 months of history', async () => {
    getMonthlyReport.mockResolvedValue([]);

    const forecastCategoryTransactions = [
      makeTransaction({
        _id: 'current',
        category: 'Groceries',
        amount: 100,
        date: dayjs().format('YYYY-MM-DD'),
      }),
      makeTransaction({
        _id: 'm1',
        category: 'Groceries',
        amount: 120,
        date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      }),
      makeTransaction({
        _id: 'm2',
        category: 'Groceries',
        amount: 150,
        date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      }),
      makeTransaction({
        _id: 'm3',
        category: 'Groceries',
        amount: 90,
        date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
      }),
      makeTransaction({
        _id: 'other',
        category: 'Coffee',
        amount: 30,
        date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
      }),
      makeTransaction({
        _id: 'other2',
        category: 'Coffee',
        amount: 20,
        date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
      }),
      makeTransaction({
        _id: 'other3',
        category: 'Coffee',
        amount: 45,
        date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
      }),
    ];

    renderComponent(forecastCategoryTransactions);

    await waitFor(() => {
      expect(screen.getByText('Spending Forecast')).toBeInTheDocument();
    });
    expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();
  });

  it('shows top categories when expenses exist', async () => {
    getMonthlyReport.mockResolvedValue([]);
    const txns = [
      makeTransaction({ _id: '1', amount: 3000, type: 'expense', category: 'Food' }),
      makeTransaction({ _id: '2', amount: 2000, type: 'expense', category: 'Transport' }),
    ];
    renderComponent(txns);
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });
});
