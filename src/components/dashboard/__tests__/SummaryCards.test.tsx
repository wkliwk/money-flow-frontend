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
    render(<SummaryCards transactions={[]} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
  });

  it('shows correct income value', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 5000 })];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getAllByText('+HK$5,000').length).toBeGreaterThan(0);
  });

  it('shows correct expense value', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 1000 })];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getAllByText('-HK$1,000').length).toBeGreaterThan(0);
  });

  it('shows positive net balance with + sign', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 5000 }),
      makeTransaction({ type: 'expense', amount: 1000 }),
    ];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('+HK$4,000')).toBeInTheDocument();
  });

  it('shows negative net balance when expenses exceed income', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 1000 }),
      makeTransaction({ type: 'expense', amount: 2000 }),
    ];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('-HK$1,000')).toBeInTheDocument();
  });

  it('shows savings rate when income exists and net is positive', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 10000 }),
      makeTransaction({ type: 'expense', amount: 2000 }),
    ];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText(/savings rate/i)).toBeInTheDocument();
  });

  it('shows over income when net is negative with income', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 1000 }),
      makeTransaction({ type: 'expense', amount: 2000 }),
    ];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText(/over income/i)).toBeInTheDocument();
  });

  it('shows percentage delta badge when prevMonthTransactions provided', () => {
    const prevMonth = [makeTransaction({ type: 'expense', amount: 500 })];
    const thisMonth = [makeTransaction({ type: 'expense', amount: 600 })];
    render(
      <SummaryCards
        transactions={thisMonth}
        prevMonthTransactions={prevMonth}
        convert={(n) => n}
        symbol="HK$"
      />,
    );
    // 600 vs 500 = +20%; expenses up is unfavorable — rendered as ↑20%
    expect(screen.getAllByText(/\u219120%/).length).toBeGreaterThan(0);
  });

  it('shows income percentage delta vs previous month', () => {
    const prevMonth = [makeTransaction({ type: 'income', amount: 10000 })];
    const thisMonth = [makeTransaction({ type: 'income', amount: 11000 })];
    render(
      <SummaryCards
        transactions={thisMonth}
        prevMonthTransactions={prevMonth}
        convert={(n) => n}
        symbol="HK$"
      />,
    );
    // 11000 vs 10000 = +10%
    expect(screen.getAllByText(/\u219110%/).length).toBeGreaterThan(0);
  });

  it('shows today expenses when transactions from today exist', () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const transactions = [makeTransaction({ type: 'expense', amount: 100, date: todayDate })];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText(/Today:/i)).toBeInTheDocument();
  });

  it('does not show delta badges when no prevMonthTransactions provided', () => {
    const transactions = [makeTransaction({ type: 'expense', amount: 1000 })];
    render(<SummaryCards transactions={transactions} convert={(n) => n} symbol="HK$" />);
    expect(screen.queryByText(/\u2191|\u2193/)).not.toBeInTheDocument();
  });
});
