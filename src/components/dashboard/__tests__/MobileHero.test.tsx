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

describe('MobileHero', () => {
  it('renders without crashing with empty transactions', () => {
    render(<MobileHero {...defaultProps} />);
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('displays income and expense amounts', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 5000 }),
      makeTransaction({ type: 'expense', amount: 1000 }),
    ];
    render(<MobileHero {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('+HK$5,000')).toBeInTheDocument();
    expect(screen.getByText('-HK$1,000')).toBeInTheDocument();
  });

  it('displays selected month label', () => {
    render(<MobileHero {...defaultProps} />);
    // The month is rendered as uppercase via CSS text-transform, but the DOM text is mixed case
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('calls onChange with previous month on left nav click', () => {
    const onChange = jest.fn();
    render(<MobileHero {...defaultProps} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange with next month on right nav click', () => {
    const onChange = jest.fn();
    render(<MobileHero {...defaultProps} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalled();
  });

  it('shows streak badge when streak >= 2', () => {
    render(<MobileHero {...defaultProps} streak={5} />);
    expect(screen.getByText(/5 day streak/)).toBeInTheDocument();
  });

  it('does not show streak badge when streak is 1', () => {
    render(<MobileHero {...defaultProps} streak={1} />);
    expect(screen.queryByText(/day streak/)).not.toBeInTheDocument();
  });
});
