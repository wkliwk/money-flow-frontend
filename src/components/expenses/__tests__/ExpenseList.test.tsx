import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';

const mockTransactions: Transaction[] = [
  {
    _id: '1',
    description: 'Coffee',
    amount: 50,
    type: 'expense',
    category: 'Food',
    date: '2026-03-01',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
    owner: 'user1',
  },
  {
    _id: '2',
    description: 'Salary',
    amount: 20000,
    type: 'income',
    category: 'Income',
    date: '2026-03-15',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
    owner: 'user1',
  },
];

const noop = () => {};
const convert = (n: number) => n;
const symbol = 'HK$';

describe('ExpenseList', () => {
  it('renders a list of transactions', () => {
    render(
      <ExpenseList
        transactions={mockTransactions}
        onEdit={noop}
        onDelete={noop}
        convert={convert}
        symbol={symbol}
      />
    );
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(
      <ExpenseList
        transactions={[]}
        onEdit={noop}
        onDelete={noop}
        convert={convert}
        symbol={symbol}
      />
    );
    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });
});
