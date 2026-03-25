import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SpendingBreakdown from '../SpendingBreakdown';
import { Transaction } from '../../../types';

jest.mock('../../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: {}, setBudget: jest.fn() }),
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

describe('SpendingBreakdown', () => {
  it('returns null when there are no expense transactions', () => {
    const { container } = render(
      <SpendingBreakdown
        transactions={[makeTransaction({ type: 'income' })]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders spending rows for expense transactions', () => {
    const transactions = [
      makeTransaction({ item: 'Coffee', amount: 200 }),
      makeTransaction({ item: 'Taxi', amount: 100 }),
    ];
    render(
      <SpendingBreakdown
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
  });

  it('shows the section heading', () => {
    const transactions = [makeTransaction({ item: 'Coffee', amount: 200 })];
    render(
      <SpendingBreakdown
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Spending Breakdown')).toBeInTheDocument();
  });

  it('calls onItemClick when a row is clicked', () => {
    const onItemClick = jest.fn();
    const transactions = [makeTransaction({ item: 'Coffee', amount: 200 })];
    render(
      <SpendingBreakdown
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
        onItemClick={onItemClick}
      />
    );
    fireEvent.click(screen.getByText('Coffee'));
    expect(onItemClick).toHaveBeenCalledWith('Coffee');
  });

  it('renders with prevMonthTransactions for delta calculation', () => {
    const transactions = [makeTransaction({ item: '早餐', amount: 200 })];
    const prevMonthTransactions = [makeTransaction({ item: '早餐', amount: 150 })];
    render(
      <SpendingBreakdown
        transactions={transactions}
        prevMonthTransactions={prevMonthTransactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('早餐')).toBeInTheDocument();
  });
});
