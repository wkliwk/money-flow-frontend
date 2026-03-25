import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryChart from '../CategoryChart';
import { Transaction } from '../../../types';

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
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
});
