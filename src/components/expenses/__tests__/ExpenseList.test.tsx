import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

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

// Desktop (default) tests
describe('ExpenseList (desktop)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows empty state when no transactions', () => {
    render(<ExpenseList {...defaultProps} />);
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('shows empty state helper text', () => {
    render(<ExpenseList {...defaultProps} />);
    expect(screen.getByText(/tap \+ to record/i)).toBeInTheDocument();
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

  it('renders positive amount for income', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 1000 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('+HK$1,000')).toBeInTheDocument();
  });

  it('renders negative amount for expense', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 500 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('-HK$500')).toBeInTheDocument();
  });

  it('renders item name in description when transaction has item', () => {
    const transactions = [makeTransaction({ item: 'Food', description: 'Lunch' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText(/Food/)).toBeInTheDocument();
  });

  it('renders participants column when present', () => {
    const transactions = [makeTransaction({ participants: ['Alice', 'Bob'] })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
  });

  it('renders multiple transactions', () => {
    const transactions = Array.from({ length: 5 }, (_, i) =>
      makeTransaction({ _id: String(i), description: `Item ${i}` })
    );
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 4')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    const transactions = [makeTransaction({})];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('shows dash for no participants', () => {
    const transactions = [makeTransaction({ participants: [] })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    const dashes = screen.getAllByText('\u2014');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Payment column header', () => {
    const transactions = [makeTransaction({})];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });

  it('shows payment method when set', () => {
    const transactions = [makeTransaction({ paymentMethod: 'octopus' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Octopus')).toBeInTheDocument();
  });

  it('shows dash when no payment method', () => {
    const transactions = [makeTransaction({ paymentMethod: undefined })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    const dashes = screen.getAllByText('\u2014');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('shows original currency amount for non-HKD transactions', () => {
    const transactions = [makeTransaction({
      amount: 58,
      currency: 'JPY',
      originalAmount: 1000,
      exchangeRate: 0.058,
    })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('-HK$58')).toBeInTheDocument();
    expect(screen.getByText('\u00a51,000')).toBeInTheDocument();
  });

  it('does not show currency badge for HKD transactions', () => {
    const transactions = [makeTransaction({ amount: 100, currency: 'HKD' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('-HK$100')).toBeInTheDocument();
    // Should only have the main amount, no secondary currency display
    const allTexts = screen.queryAllByText(/\u00a5/);
    expect(allTexts.length).toBe(0);
  });

  it('does not show currency badge when currency is undefined', () => {
    const transactions = [makeTransaction({ amount: 100 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('-HK$100')).toBeInTheDocument();
  });

  it('shows note icon for transactions with notes (desktop)', () => {
    const transactions = [makeTransaction({ notes: 'Dinner with client' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    const noteIcons = document.querySelectorAll('[data-testid="NotesIcon"]');
    expect(noteIcons.length).toBeGreaterThan(0);
  });

  it('does not show note icon when no notes (desktop)', () => {
    const transactions = [makeTransaction({ notes: undefined })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    const noteIcons = document.querySelectorAll('[data-testid="NotesIcon"]');
    expect(noteIcons.length).toBe(0);
  });

  it('shows transaction date in full format on desktop table (current year)', () => {
    const currentYear = new Date().getFullYear();
    // Use noon UTC so the date renders as Mar 15 in any local timezone.
    const currentYearDate = `${currentYear}-03-15T12:00:00Z`;
    const transactions = [makeTransaction({ date: currentYearDate })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText(`15 Mar ${currentYear}`)).toBeInTheDocument();
  });

  it('shows transaction date in full format on desktop table (past year)', () => {
    const transactions = [makeTransaction({ date: '2025-03-15T12:00:00Z' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('15 Mar 2025')).toBeInTheDocument();
  });
});

