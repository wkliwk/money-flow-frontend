import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../../theme';
import MonthlyReportPage from '../MonthlyReportPage';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

jest.mock('../../../services/api', () => ({
  getMonthlyReport: jest.fn(),
  getBudgets: jest.fn(),
}));

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { getMonthlyReport, getBudgets } = require('../../../services/api') as {
  getMonthlyReport: jest.Mock;
  getBudgets: jest.Mock;
};

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
      <MonthlyReportPage transactions={transactions} convert={(n) => n} symbol="HK$" />
    </ThemeProvider>
  );

describe('MonthlyReportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    getMonthlyReport.mockReturnValue(new Promise(() => {}));
    getBudgets.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders page title after data loads', async () => {
    getMonthlyReport.mockResolvedValue([]);
    getBudgets.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Monthly Report')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    getMonthlyReport.mockRejectedValue(new Error('fail'));
    getBudgets.mockRejectedValue(new Error('fail'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/could not load report data/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no transactions for selected month', async () => {
    getMonthlyReport.mockResolvedValue([]);
    getBudgets.mockResolvedValue([]);
    // Pass transactions from a different month so selected (current) month is empty
    const oldTxn = makeTransaction({ date: '2020-01-15' });
    renderComponent([oldTxn]);
    await waitFor(() => {
      expect(screen.getByText(/no transactions for/i)).toBeInTheDocument();
    });
  });

  it('renders summary cards when transactions exist', async () => {
    const currentMonth = dayjs().format('YYYY-MM');
    getMonthlyReport.mockResolvedValue([
      { month: currentMonth, income: 10000, expenses: 5000, net: 5000, transactionCount: 3 },
    ]);
    getBudgets.mockResolvedValue([]);
    const txns = [
      makeTransaction({ _id: '1', amount: 3000, type: 'expense', category: 'Food' }),
      makeTransaction({ _id: '2', amount: 2000, type: 'expense', category: 'Transport' }),
      makeTransaction({ _id: '3', amount: 10000, type: 'income' }),
    ];
    renderComponent(txns);
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument();
    });
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Savings')).toBeInTheDocument();
  });

  it('renders pie chart when category data exists', async () => {
    getMonthlyReport.mockResolvedValue([]);
    getBudgets.mockResolvedValue([]);
    const txns = [
      makeTransaction({ _id: '1', amount: 3000, type: 'expense', category: 'Food' }),
      makeTransaction({ _id: '2', amount: 2000, type: 'expense', category: 'Transport' }),
    ];
    renderComponent(txns);
    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
    expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
  });

  it('renders budget vs actual section when budgets exist', async () => {
    getMonthlyReport.mockResolvedValue([]);
    getBudgets.mockResolvedValue([{ category: 'Food', limit: 5000 }]);
    const txns = [makeTransaction({ _id: '1', amount: 3000, type: 'expense', category: 'Food' })];
    renderComponent(txns);
    await waitFor(() => {
      expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
    });
  });

  it('shows download PDF button', async () => {
    getMonthlyReport.mockResolvedValue([]);
    getBudgets.mockResolvedValue([]);
    const txns = [makeTransaction()];
    renderComponent(txns);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    });
  });

  it('shows month selector dropdown', async () => {
    getMonthlyReport.mockResolvedValue([]);
    getBudgets.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByLabelText('Month')).toBeInTheDocument();
    });
  });
});
