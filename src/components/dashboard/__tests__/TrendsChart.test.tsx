import React from 'react';
import { render, screen } from '@testing-library/react';
import TrendsChart from '../TrendsChart';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

jest.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ReferenceLine: () => null,
}));

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Test',
  amount: 100,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

describe('TrendsChart', () => {
  it('returns null when all transactions are zero', () => {
    const { container } = render(
      <TrendsChart
        transactions={[]}
        onMonthSelect={jest.fn()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders chart with income/expense legend when data exists', () => {
    const transactions = [makeTransaction({ amount: 500, type: 'expense' })];
    render(
      <TrendsChart
        transactions={transactions}
        onMonthSelect={jest.fn()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('shows YTD toggle', () => {
    const transactions = [makeTransaction({ amount: 500 })];
    render(
      <TrendsChart
        transactions={transactions}
        onMonthSelect={jest.fn()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('YTD')).toBeInTheDocument();
  });
});
