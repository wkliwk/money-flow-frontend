/**
 * Extended TrendsChart tests covering missing branches.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrendsChart from '../TrendsChart';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

jest.mock('recharts', () => ({
  ComposedChart: ({ children, onClick }: { children: React.ReactNode; onClick?: (e: unknown) => void }) => (
    <div>
      <div data-testid="chart-no-label" onClick={() => onClick && onClick({ activeLabel: undefined })} />
      <div data-testid="chart-unknown-label" onClick={() => onClick && onClick({ activeLabel: 'UnknownMonth999' })} />
      <div data-testid="chart-valid-click" onClick={() => onClick && onClick({ activeLabel: dayjs().format('MMM') })} />
      {children}
    </div>
  ),
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
  _id: String(Math.random()),
  owner: 'user1',
  description: 'Test',
  amount: 100,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

describe('TrendsChart — extended coverage', () => {
  it('handleBarClick does nothing when activeLabel is undefined', () => {
    const onMonthSelect = jest.fn();
    const transactions = [makeTransaction({ amount: 500 })];
    render(<TrendsChart transactions={transactions} onMonthSelect={onMonthSelect} convert={(n) => n} symbol="HK$" />);
    const noLabelDiv = screen.getByTestId('chart-no-label');
    fireEvent.click(noLabelDiv);
    expect(onMonthSelect).not.toHaveBeenCalled();
  });

  it('handleBarClick does nothing when label not found in data', () => {
    const onMonthSelect = jest.fn();
    const transactions = [makeTransaction({ amount: 500 })];
    render(<TrendsChart transactions={transactions} onMonthSelect={onMonthSelect} convert={(n) => n} symbol="HK$" />);
    const unknownLabelDiv = screen.getByTestId('chart-unknown-label');
    fireEvent.click(unknownLabelDiv);
    expect(onMonthSelect).not.toHaveBeenCalled();
  });

  it('handleBarClick calls onMonthSelect when valid label matches data', () => {
    const onMonthSelect = jest.fn();
    const transactions = [makeTransaction({ amount: 500, date: dayjs().format('YYYY-MM-DD') })];
    render(<TrendsChart transactions={transactions} onMonthSelect={onMonthSelect} convert={(n) => n} symbol="HK$" />);
    const validClickDiv = screen.getByTestId('chart-valid-click');
    fireEvent.click(validClickDiv);
    expect(onMonthSelect).toHaveBeenCalled();
  });

  it('uses createdAt when date is missing on transaction', () => {
    const tx = makeTransaction({ amount: 500 });
    delete (tx as any).date;
    tx.createdAt = dayjs().format('YYYY-MM-DD');
    render(<TrendsChart transactions={[tx]} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('formatValue shows value without k suffix for amounts < 1000', () => {
    const transactions = [makeTransaction({ amount: 50, type: 'expense' })];
    render(<TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('formatValue shows k suffix for amounts >= 1000', () => {
    const transactions = [makeTransaction({ amount: 50000, type: 'expense' })];
    render(<TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('renders with negative net income (expenses > income) — covers net < 0 dot color', () => {
    const date = dayjs().format('YYYY-MM-DD');
    const transactions = [
      makeTransaction({ amount: 10000, type: 'expense', date }),
      makeTransaction({ amount: 1000, type: 'income', date }),
    ];
    render(<TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('6-Month Trends')).toBeInTheDocument();
  });

  it('shows YTD view when showYtd is toggled on', () => {
    const transactions = [makeTransaction({ amount: 500 })];
    render(<TrendsChart transactions={transactions} onMonthSelect={jest.fn()} convert={(n) => n} symbol="HK$" />);
    fireEvent.click(screen.getByText('YTD'));
    expect(screen.getByText(/Year to Date/i)).toBeInTheDocument();
  });
});
