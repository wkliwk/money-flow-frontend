import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';
import dayjs from 'dayjs';

// Mock useMediaQuery at module level to simulate mobile
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => true,
  };
});

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

const defaultProps = {
  transactions: [],
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('ExpenseList (mobile layout)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders mobile card for transaction', () => {
    const transactions = [makeTransaction({ description: 'Coffee' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('shows Today label for transactions dated today', () => {
    const transactions = [makeTransaction({ date: dayjs().format('YYYY-MM-DD') })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows Yesterday label for transactions dated yesterday', () => {
    const transactions = [makeTransaction({ date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('calls onEdit when mobile card is tapped', () => {
    const onEdit = jest.fn();
    const t = makeTransaction({ _id: 'tap1', description: 'Tap me' });
    render(<ExpenseList {...defaultProps} transactions={[t]} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Tap me'));
    expect(onEdit).toHaveBeenCalledWith(t);
  });

  it('shows expense amount with minus sign', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 100 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getAllByText('-HK$100').length).toBeGreaterThan(0);
  });

  it('shows income amount with plus sign', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 200 })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getAllByText('+HK$200').length).toBeGreaterThan(0);
  });

  it('shows participants in mobile card', () => {
    const transactions = [makeTransaction({ participants: ['Alice', 'Bob'] })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText(/with Alice, Bob/)).toBeInTheDocument();
  });

  it('shows daily expense total in group header', () => {
    const transactions = [
      makeTransaction({ amount: 150, type: 'expense' }),
    ];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getAllByText('-HK$150').length).toBeGreaterThan(0);
  });

  it('shows item as primary label when item exists', () => {
    const transactions = [makeTransaction({ item: 'Food', description: 'Lunch' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows description below item when both exist and differ', () => {
    const transactions = [makeTransaction({ item: 'Food', description: 'Lunch special' })];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Lunch special')).toBeInTheDocument();
  });

  it('groups multiple transactions by date', () => {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const transactions = [
      makeTransaction({ _id: '1', date: today, description: 'Today item' }),
      makeTransaction({ _id: '2', date: yesterday, description: 'Yesterday item' }),
    ];
    render(<ExpenseList {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Today item')).toBeInTheDocument();
    expect(screen.getByText('Yesterday item')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });
});
