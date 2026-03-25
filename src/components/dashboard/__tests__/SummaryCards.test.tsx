import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryCards from '../SummaryCards';
import { Transaction } from '../../../types';

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

describe('SummaryCards', () => {
  it('renders Income, Expenses, and Net Balance cards', () => {
    render(
      <SummaryCards
        transactions={[]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
  });

  it('shows correct income value', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 5000 })];
    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getAllByText('+HK$5,000').length).toBeGreaterThan(0);
  });

  it('shows correct expense value', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 1000 })];
    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getAllByText('-HK$1,000').length).toBeGreaterThan(0);
  });

  it('shows positive net balance with + sign', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 5000 }),
      makeTransaction({ type: 'expense', amount: 1000 }),
    ];
    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('+HK$4,000')).toBeInTheDocument();
  });
});
