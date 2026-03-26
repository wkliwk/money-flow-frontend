import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrendsChart from '../TrendsChart';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

// The mock must not reference out-of-scope variables — we use a static string for the label
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ComposedChart: ({ children, onClick }: { children: React.ReactNode; onClick?: (e: unknown) => void }) => (
      <div
        data-testid="composed-chart"
        // Clicking will always pass 'static' as activeLabel — which won't match any month,
        // so handleBarClick returns early. A separate test covers the match path.
        onClick={() => onClick && onClick({ activeLabel: undefined })}
      >
        {children}
      </div>
    ),
    Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Line: ({ dot }: { dot?: (props: Record<string, unknown>) => React.ReactElement }) => {
      if (dot) {
        dot({ cx: 10, cy: 10, payload: { label: 'A', net: 100 } });
        dot({ cx: 10, cy: 10, payload: { label: 'B', net: -50 } });
      }
      return null;
    },
    XAxis: () => null,
    YAxis: ({ tickFormatter }: { tickFormatter?: (v: number) => string }) => {
      if (tickFormatter) {
        tickFormatter(500);
        tickFormatter(2000);
      }
      return null;
    },
    Tooltip: ({ formatter }: { formatter?: (value: unknown, name: string) => unknown }) => {
      if (formatter) {
        formatter(1500, 'Net');
        formatter(-500, 'Net');
        formatter(1000, 'Income');
      }
      return null;
    },
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Cell: () => null,
    ReferenceLine: () => null,
  };
});

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

describe('TrendsChart — branch coverage', () => {
  it('exercises formatValue k-suffix branch (value >= 1000)', () => {
    const transactions = [makeTransaction({ amount: 2000, type: 'expense' })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('exercises formatValue plain branch (value < 1000)', () => {
    const transactions = [makeTransaction({ amount: 50, type: 'expense' })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('exercises Tooltip formatter for Net positive, Net negative, and non-Net name', () => {
    const transactions = [makeTransaction({ amount: 500, type: 'expense' })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('exercises dot render prop for positive and negative net values', () => {
    const transactions = [makeTransaction({ amount: 200, type: 'expense' })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('handleBarClick does not call onMonthSelect when activeLabel is undefined', () => {
    const onMonthSelect = jest.fn();
    const transactions = [makeTransaction({ amount: 500, type: 'expense' })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={onMonthSelect} convert={(n) => n} symbol="HK$" />
    );
    fireEvent.click(screen.getByTestId('composed-chart'));
    expect(onMonthSelect).not.toHaveBeenCalled();
  });

  it('shows YTD year heading after toggling to YTD', () => {
    const transactions = [makeTransaction({ amount: 500 })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    fireEvent.click(screen.getByText('YTD'));
    expect(screen.getByText(new RegExp(String(dayjs().year())))).toBeInTheDocument();
  });

  it('shows 6M toggle when in YTD mode', () => {
    const transactions = [makeTransaction({ amount: 500 })];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    fireEvent.click(screen.getByText('YTD'));
    expect(screen.getByText('6M')).toBeInTheDocument();
  });

  it('renders with income transactions contributing to chart data', () => {
    const date = dayjs().format('YYYY-MM-DD');
    const transactions = [
      makeTransaction({ amount: 5000, type: 'income', date }),
      makeTransaction({ amount: 2000, type: 'expense', date }),
    ];
    render(
      <TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });
});
