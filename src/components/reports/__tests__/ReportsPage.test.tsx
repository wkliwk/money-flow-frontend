import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../../theme';
import ReportsPage from '../ReportsPage';
import { Transaction, Tag } from '../../../types';
import dayjs from 'dayjs';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}));

const makeTag = (overrides: Partial<Tag> = {}): Tag => ({
  _id: 't1',
  owner: 'u1',
  name: 'work',
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

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

const renderPage = (props: Partial<React.ComponentProps<typeof ReportsPage>> = {}) =>
  render(
    <ThemeProvider theme={darkTheme}>
      <ReportsPage
        transactions={props.transactions ?? []}
        convert={props.convert ?? ((n) => n)}
        symbol={props.symbol ?? 'HK$'}
        loading={props.loading}
        onAddTransaction={props.onAddTransaction}
      />
    </ThemeProvider>
  );

describe('ReportsPage', () => {
  it('shows loading skeletons when loading=true', () => {
    renderPage({ loading: true });
    expect(screen.getByText('Reports')).toBeInTheDocument();
    // no chart testids when loading
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    const onAdd = jest.fn();
    renderPage({ transactions: [], onAddTransaction: onAdd });
    expect(screen.getByText(/nothing to report yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('renders all three charts when expense + tag data exist', () => {
    const tag = makeTag({ name: 'work' });
    const txns = [
      makeTransaction({ _id: '1', amount: 300, type: 'expense', category: 'Food', tags: [tag] }),
      makeTransaction({ _id: '2', amount: 200, type: 'expense', category: 'Transport', tags: [tag] }),
    ];
    renderPage({ transactions: txns });
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
    expect(screen.getByText(/Monthly Trend/i)).toBeInTheDocument();
    expect(screen.getByText('Top Tags')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('shows tag-empty message when no tagged expenses', () => {
    const txns = [
      makeTransaction({ _id: '1', amount: 300, type: 'expense', category: 'Food' }),
    ];
    renderPage({ transactions: txns });
    expect(screen.getByText(/tag a few expenses/i)).toBeInTheDocument();
  });

  it('shows category-empty message for a month with no expenses', () => {
    // transaction exists overall but selected (current) month has no expenses
    const txns = [
      makeTransaction({ _id: 'x', amount: 100, type: 'income', date: dayjs().format('YYYY-MM-DD') }),
    ];
    renderPage({ transactions: txns });
    expect(screen.getByText(/No expenses in/i)).toBeInTheDocument();
  });
});
