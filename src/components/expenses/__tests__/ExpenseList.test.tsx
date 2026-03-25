import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  date: '2026-03-10',
  createdAt: '2026-03-10',
  updatedAt: '2026-03-10',
  ...overrides,
});

const defaultProps = {
  transactions: [],
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('ExpenseList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows empty state when no transactions', () => {
    render(<ExpenseList {...defaultProps} />);
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('renders transaction descriptions in desktop table', () => {
    const transactions = [
      makeTransaction({ _id: '1', description: 'Coffee', amount: 50 }),
      makeTransaction({ _id: '2', description: 'Taxi', amount: 100, type: 'income' }),
    ];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
  });

  it('calls onDelete when delete icon is clicked', () => {
    const onDelete = jest.fn();
    const transactions = [makeTransaction({ _id: 'abc' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button');
    const deleteBtn = deleteButtons[deleteButtons.length - 1];
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('abc');
  });

  it('calls onEdit when edit icon is clicked', () => {
    const onEdit = jest.fn();
    const t = makeTransaction({ _id: 'abc' });
    render(<ExpenseList {...defaultProps} transactions={[t]} onEdit={onEdit} />);
    const editButtons = screen.getAllByRole('button');
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(t);
  });

  it('displays income chip for income transactions', () => {
    const transactions = [makeTransaction({ type: 'income' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('displays expense chip for expense transactions', () => {
    const transactions = [makeTransaction({ type: 'expense' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });
});
