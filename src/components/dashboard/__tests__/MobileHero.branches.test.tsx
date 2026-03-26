import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import MobileHero from '../MobileHero';
import { Transaction } from '../../../types';

jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../CurrencyPicker', () => ({
  __esModule: true,
  default: () => <div data-testid="currency-picker" />,
}));

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Test',
  amount: 100,
  type: 'expense',
  date: '2026-03-10',
  createdAt: '2026-03-10',
  updatedAt: '2026-03-10',
  ...overrides,
});

const defaultProps = {
  transactions: [],
  selectedMonth: dayjs('2026-03-01'),
  onChange: jest.fn(),
  currency: 'HKD' as const,
  onCurrencyChange: jest.fn(),
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('MobileHero — branch coverage', () => {
  it('renders negative net balance with negative styling', () => {
    const transactions = [
      makeTransaction({ type: 'expense', amount: 5000 }),
    ];
    render(<MobileHero {...defaultProps} transactions={transactions} />);
    // Net is negative: expenses > income — use getAllByText since it may appear in multiple places
    const els = screen.getAllByText('-HK$5,000');
    expect(els.length).toBeGreaterThan(0);
  });

  it('shows delta spending increase vs last month', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 3000 })];
    const prev = [makeTransaction({ type: 'expense', amount: 1000 })];
    render(
      <MobileHero
        {...defaultProps}
        transactions={transactions}
        prevMonthTransactions={prev}
      />
    );
    expect(screen.getByText(/spending vs last month/i)).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('shows delta spending decrease vs last month', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 500 })];
    const prev = [makeTransaction({ type: 'expense', amount: 2000 })];
    render(
      <MobileHero
        {...defaultProps}
        transactions={transactions}
        prevMonthTransactions={prev}
      />
    );
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it('renders "All Time" when selectedMonth is null', () => {
    render(<MobileHero {...defaultProps} selectedMonth={null} />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('clicking month label calls onChange with null when selectedMonth is set', () => {
    const onChange = jest.fn();
    render(<MobileHero {...defaultProps} onChange={onChange} selectedMonth={dayjs('2026-03-01')} />);
    fireEvent.click(screen.getByText('March 2026'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('clicking month label calls onChange with dayjs() when selectedMonth is null', () => {
    const onChange = jest.fn();
    render(<MobileHero {...defaultProps} onChange={onChange} selectedMonth={null} />);
    fireEvent.click(screen.getByText('All Time'));
    expect(onChange).toHaveBeenCalled();
  });

  it('shows avgPerDay and projectedTotal when viewing current month with expenses', () => {
    const currentMonth = dayjs();
    const transactions = [
      makeTransaction({
        type: 'expense',
        amount: 1000,
        date: currentMonth.format('YYYY-MM-DD'),
      }),
    ];
    render(
      <MobileHero
        {...defaultProps}
        transactions={transactions}
        selectedMonth={currentMonth}
      />
    );
    expect(screen.getByText(/\/day/i)).toBeInTheDocument();
  });

  it('shows top expense item when expenses exist', () => {
    const currentMonth = dayjs();
    const transactions = [
      makeTransaction({
        type: 'expense',
        amount: 500,
        item: 'Coffee',
        date: currentMonth.format('YYYY-MM-DD'),
      }),
    ];
    render(
      <MobileHero
        {...defaultProps}
        transactions={transactions}
        selectedMonth={currentMonth}
      />
    );
    expect(screen.getByText(/Top: Coffee/i)).toBeInTheDocument();
  });

  it('renders daily spend sparkline when dailySpend has more than 1 entry', () => {
    const currentMonth = dayjs();
    const transactions = [
      makeTransaction({ type: 'expense', amount: 200, date: currentMonth.date(1).format('YYYY-MM-DD') }),
      makeTransaction({ type: 'expense', amount: 300, date: currentMonth.date(3).format('YYYY-MM-DD') }),
    ];
    render(
      <MobileHero
        {...defaultProps}
        transactions={transactions}
        selectedMonth={currentMonth}
      />
    );
    // Sparkline renders if dailySpend.length > 1
    expect(screen.getAllByText('Expenses').length).toBeGreaterThan(0);
  });

  it('handlePrev uses dayjs() as base when selectedMonth is null', () => {
    const onChange = jest.fn();
    render(<MobileHero {...defaultProps} onChange={onChange} selectedMonth={null} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalled();
  });

  it('handleNext uses dayjs() as base when selectedMonth is null', () => {
    const onChange = jest.fn();
    render(<MobileHero {...defaultProps} onChange={onChange} selectedMonth={null} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalled();
  });

  it('does not show delta when prevMonthTransactions is undefined', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 500 })];
    render(<MobileHero {...defaultProps} transactions={transactions} />);
    expect(screen.queryByText(/spending vs last month/i)).not.toBeInTheDocument();
  });

  it('does not show streak badge when streak is 0', () => {
    render(<MobileHero {...defaultProps} streak={0} />);
    expect(screen.queryByText(/day streak/i)).not.toBeInTheDocument();
  });
});
