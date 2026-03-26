import React from 'react';
import { render, screen } from '@testing-library/react';
import SpendingInsights from '../SpendingInsights';
import { Transaction } from '../../../types';

const convert = (v: number) => v;
const symbol = '$';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: String(Math.random()),
  owner: 'u1',
  description: 'test',
  amount: 100,
  type: 'expense',
  category: 'Food',
  date: '2026-03-15',
  createdAt: '2026-03-15',
  updatedAt: '2026-03-15',
  ...overrides,
});

describe('SpendingInsights', () => {
  it('renders nothing when no previous month data', () => {
    const { container } = render(
      <SpendingInsights transactions={[makeTx()]} prevMonthTransactions={[]} convert={convert} symbol={symbol} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows spending decrease insight', () => {
    const current = [makeTx({ amount: 80 })];
    const prev = [makeTx({ amount: 100 })];
    render(<SpendingInsights transactions={current} prevMonthTransactions={prev} convert={convert} symbol={symbol} />);
    expect(screen.getByText(/20% less spending/)).toBeInTheDocument();
  });

  it('shows spending increase insight', () => {
    const current = [makeTx({ amount: 150 })];
    const prev = [makeTx({ amount: 100 })];
    render(<SpendingInsights transactions={current} prevMonthTransactions={prev} convert={convert} symbol={symbol} />);
    expect(screen.getByText(/50% more spending/)).toBeInTheDocument();
  });

  it('shows savings insight when net positive', () => {
    const current = [makeTx({ amount: 50 }), makeTx({ amount: 200, type: 'income' })];
    const prev = [makeTx({ amount: 80 })];
    render(<SpendingInsights transactions={current} prevMonthTransactions={prev} convert={convert} symbol={symbol} />);
    expect(screen.getByText(/Saved \$150 this month/)).toBeInTheDocument();
  });

  it('shows top category change when significant', () => {
    const current = [makeTx({ amount: 200, category: 'Food' })];
    const prev = [makeTx({ amount: 100, category: 'Food' })];
    render(<SpendingInsights transactions={current} prevMonthTransactions={prev} convert={convert} symbol={symbol} />);
    expect(screen.getByText(/Food.*100.*200/)).toBeInTheDocument();
  });

  it('hides category insight when change is small', () => {
    const current = [makeTx({ amount: 105, category: 'Food' })];
    const prev = [makeTx({ amount: 100, category: 'Food' })];
    render(<SpendingInsights transactions={current} prevMonthTransactions={prev} convert={convert} symbol={symbol} />);
    expect(screen.queryByText(/Food.*\u2192/)).toBeNull();
  });

  it('applies currency conversion', () => {
    const current = [makeTx({ amount: 50 }), makeTx({ amount: 200, type: 'income' })];
    const prev = [makeTx({ amount: 80 })];
    render(<SpendingInsights transactions={current} prevMonthTransactions={prev} convert={(v) => v * 2} symbol="USD " />);
    expect(screen.getByText(/Saved USD 300 this month/)).toBeInTheDocument();
  });
});
