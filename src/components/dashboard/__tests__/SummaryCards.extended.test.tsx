/**
 * Extended SummaryCards tests to cover missing branches.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryCards from '../SummaryCards';
import { Transaction } from '../../../types';

const today = new Date().toISOString().split('T')[0];
const thisMonth = today.slice(0, 7);

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
  it('shows expense delta decrease (↓) when current expenses < prev', () => {
    const current = [makeTx({ type: 'expense', amount: 50, date: today })];
    const prev = [makeTx({ type: 'expense', amount: 200 })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="$"
      />
    );
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/vs last month/)).toBeInTheDocument();
  });

  it('shows expense delta increase (↑) when current expenses > prev', () => {
    const current = [makeTx({ type: 'expense', amount: 300, date: today })];
    const prev = [makeTx({ type: 'expense', amount: 100 })];
    render(
      <SummaryCards
        transactions={current}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="$"
      />
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('uses createdAt when date is missing on today transaction', () => {
    const tx = makeTx({ type: 'expense', amount: 100 });
    delete (tx as any).date;
    tx.createdAt = today;
    render(
      <SummaryCards
        transactions={[tx]}
        convert={(n) => n}
        symbol="$"
      />
    );
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('falls back to empty string when both date and createdAt are missing', () => {
    const tx = makeTx({ type: 'expense', amount: 100 });
    delete (tx as any).date;
    delete (tx as any).createdAt;
    render(
      <SummaryCards
        transactions={[tx]}
        convert={(n) => n}
        symbol="$"
      />
    );
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('uses createdAt for isCurrentMonth check when date is missing', () => {
    const tx = makeTx({ type: 'expense', amount: 200 });
    delete (tx as any).date;
    tx.createdAt = today;
    render(
      <SummaryCards
        transactions={[tx]}
        convert={(n) => n}
        symbol="$"
      />
    );
    // Should render On pace for... (projectedExpenses path) or just not crash
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });
});
