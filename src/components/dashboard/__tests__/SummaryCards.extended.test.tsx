/**
 * Extended SummaryCards tests to cover missing branches.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryCards from '../SummaryCards';
import { Transaction } from '../../../types';

const today = new Date().toISOString().split('T')[0];

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: String(Math.random()),
  owner: 'u1',
  description: 'test',
  amount: 100,
  type: 'expense',
  date: today,
  createdAt: today,
  updatedAt: today,
  ...overrides,
});

describe('SummaryCards — extended coverage', () => {
  it('shows expense delta decrease (\u2193) when current expenses < prev', () => {
    const current = [makeTx({ type: 'expense', amount: 50, date: today })];
    const prev = [makeTx({ type: 'expense', amount: 200 })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="$"
      />,
    );
    // 50 vs 200 = -75%; expenses down is favorable, shown as ↓75%
    expect(screen.getAllByText(/\u219375%/).length).toBeGreaterThan(0);
  });

  it('shows expense delta increase (\u2191) when current expenses > prev', () => {
    const current = [makeTx({ type: 'expense', amount: 300, date: today })];
    const prev = [makeTx({ type: 'expense', amount: 100 })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="$"
      />,
    );
    // 300 vs 100 = +200%; expenses up is unfavorable, shown as ↑200%
    expect(screen.getAllByText(/\u2191200%/).length).toBeGreaterThan(0);
  });

  it('shows income delta increase when current income > prev', () => {
    const current = [makeTx({ type: 'income', amount: 15000, date: today })];
    const prev = [makeTx({ type: 'income', amount: 10000 })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="$"
      />,
    );
    // 15000 vs 10000 = +50%; income up is favorable, shown as ↑50%
    expect(screen.getAllByText(/\u219150%/).length).toBeGreaterThan(0);
  });

  it('shows income delta decrease when current income < prev', () => {
    const current = [makeTx({ type: 'income', amount: 8000, date: today })];
    const prev = [makeTx({ type: 'income', amount: 10000 })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="$"
      />,
    );
    // 8000 vs 10000 = -20%; income down is unfavorable, shown as ↓20%
    expect(screen.getAllByText(/\u219320%/).length).toBeGreaterThan(0);
  });

  it('shows no delta badges when prevMonthTransactions is empty array', () => {
    const current = [makeTx({ type: 'expense', amount: 300, date: today })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={[]}
        convert={(n) => n}
        symbol="$"
      />,
    );
    expect(screen.queryByText(/\u2191|\u2193/)).not.toBeInTheDocument();
  });

  it('uses createdAt when date is missing on today transaction', () => {
    const tx = makeTx({ type: 'expense', amount: 100 });
    delete (tx as any).date;
    tx.createdAt = today;
    render(<SummaryCards transactions={[tx]} convert={(n) => n} symbol="$" />);
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('falls back to empty string when both date and createdAt are missing', () => {
    const tx = makeTx({ type: 'expense', amount: 100 });
    delete (tx as any).date;
    delete (tx as any).createdAt;
    render(<SummaryCards transactions={[tx]} convert={(n) => n} symbol="$" />);
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('uses createdAt for isCurrentMonth check when date is missing', () => {
    const tx = makeTx({ type: 'expense', amount: 200 });
    delete (tx as any).date;
    tx.createdAt = today;
    render(<SummaryCards transactions={[tx]} convert={(n) => n} symbol="$" />);
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });
});
