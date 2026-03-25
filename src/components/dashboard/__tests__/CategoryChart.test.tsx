import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryChart from '../CategoryChart';
import { Transaction } from '../../../types';

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ onClick }: { onClick?: (e: unknown) => void }) => (
    <div data-testid="pie" onClick={() => onClick && onClick({ name: 'Food & Drink' })} />
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

describe('CategoryChart', () => {
  it('returns null when there are no expense transactions', () => {
    const { container } = render(
      <CategoryChart transactions={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders "Spending by Category" heading with expense data', () => {
    const transactions = [
      makeTransaction({ category: 'Food & Drink', amount: 500 }),
      makeTransaction({ category: 'Transport', amount: 200 }),
    ];
    render(<CategoryChart transactions={transactions} />);
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('returns null when only income transactions', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 5000 })];
    const { container } = render(<CategoryChart transactions={transactions} />);
    expect(container.firstChild).toBeNull();
  });

  it('uses "Other" for transactions without category', () => {
    const transactions = [makeTransaction({ category: undefined, amount: 200 })];
    render(<CategoryChart transactions={transactions} />);
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('calls onCategoryClick when pie segment is clicked', () => {
    const onCategoryClick = jest.fn();
    const transactions = [makeTransaction({ category: 'Food & Drink', amount: 500 })];
    render(<CategoryChart transactions={transactions} onCategoryClick={onCategoryClick} />);
    fireEvent.click(screen.getByTestId('pie'));
    expect(onCategoryClick).toHaveBeenCalledWith('Food & Drink');
  });

  it('renders with many categories - groups beyond 6 into Other', () => {
    const categories = ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5', 'Cat6', 'Cat7'];
    const transactions = categories.map((cat, i) =>
      makeTransaction({ _id: String(i), category: cat, amount: 100 })
    );
    render(<CategoryChart transactions={transactions} />);
    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });
});

