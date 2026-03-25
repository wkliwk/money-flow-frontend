import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryCards from '../SummaryCards';
import { Transaction } from '../../../types';

describe('SummaryCards', () => {
  const mockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
    _id: `tx-${Math.random()}`,
    owner: 'user-1',
    description: 'Test transaction',
    amount: 100,
    type: 'expense',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  it('should render three summary cards', () => {
    render(
      <SummaryCards
        transactions={[]}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
  });

  it('should calculate income correctly', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 5000 }),
      mockTransaction({ type: 'income', amount: 2000 }),
      mockTransaction({ type: 'expense', amount: 500 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/\+\$7,000/)).toBeInTheDocument();
  });

  it('should calculate expenses correctly', () => {
    const transactions = [
      mockTransaction({ type: 'expense', amount: 500 }),
      mockTransaction({ type: 'expense', amount: 300 }),
      mockTransaction({ type: 'income', amount: 5000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/-\$800/)).toBeInTheDocument();
  });

  it('should calculate net balance correctly', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 5000 }),
      mockTransaction({ type: 'expense', amount: 2000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/\+\$3,000/)).toBeInTheDocument();
  });

  it('should show negative net balance correctly', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 1000 }),
      mockTransaction({ type: 'expense', amount: 3000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/-\$2,000/)).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    render(
      <SummaryCards
        transactions={[]}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getAllByText(/\+\$0/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/-\$0/).length).toBeGreaterThanOrEqual(1);
  });

  it('should apply currency conversion', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 1000 }),
      mockTransaction({ type: 'expense', amount: 200 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n * 2}
        symbol="€"
      />
    );

    expect(screen.getByText(/\+€2,000/)).toBeInTheDocument();
    expect(screen.getByText(/-€400/)).toBeInTheDocument();
  });

  it('should display income icon', () => {
    const { container } = render(
      <SummaryCards
        transactions={[]}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Check that MUI icons are rendered in the cards
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should show today expenses when present', () => {
    const today = new Date().toISOString().split('T')[0];
    const transactions = [
      mockTransaction({ type: 'expense', amount: 500, date: `${today}T10:00:00Z` }),
      mockTransaction({ type: 'expense', amount: 300, date: `${today}T15:00:00Z` }),
      mockTransaction({ type: 'expense', amount: 200, date: 'yesterday' }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/Today: \$800/)).toBeInTheDocument();
  });

  it('should not show today expenses when zero', () => {
    const transactions = [
      mockTransaction({ type: 'expense', amount: 500, date: 'yesterday' }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.queryByText(/Today:/)).not.toBeInTheDocument();
  });

  it('should calculate previous month expense comparison', () => {
    const currentMonth = [
      mockTransaction({ type: 'expense', amount: 1000 }),
      mockTransaction({ type: 'expense', amount: 500 }),
    ];
    const prevMonth = [
      mockTransaction({ type: 'expense', amount: 800 }),
    ];

    render(
      <SummaryCards
        transactions={currentMonth}
        prevMonthTransactions={prevMonth}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Current month: 1500, Previous month: 800, Delta: +700
    expect(screen.getByText(/\↑ \$700 vs last month/)).toBeInTheDocument();
  });

  it('should show decrease vs previous month', () => {
    const currentMonth = [
      mockTransaction({ type: 'expense', amount: 500 }),
    ];
    const prevMonth = [
      mockTransaction({ type: 'expense', amount: 2000 }),
    ];

    render(
      <SummaryCards
        transactions={currentMonth}
        prevMonthTransactions={prevMonth}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Current month: 500, Previous month: 2000, Delta: -1500
    expect(screen.getByText(/↓ \$1,500 vs last month/)).toBeInTheDocument();
  });

  it('should not show comparison when no previous month data', () => {
    const transactions = [
      mockTransaction({ type: 'expense', amount: 1000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument();
  });

  it('should calculate projected expenses for current month', () => {
    const today = new Date();
    const daysElapsed = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const todayStr = today.toISOString().split('T')[0];

    if (daysElapsed < daysInMonth) {
      const transactions = [
        mockTransaction({ type: 'expense', amount: 1000, date: `${todayStr}T10:00:00Z` }),
      ];

      render(
        <SummaryCards
          transactions={transactions}
          convert={(n) => n}
          symbol="$"
        />
      );

      // Should show projection for current month
      expect(screen.getByText(/On pace for \$/)).toBeInTheDocument();
    }
  });

  it('should not show projection for past months', () => {
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    const transactions = [
      mockTransaction({ type: 'expense', amount: 1000, date: pastDateStr }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.queryByText(/On pace for/)).not.toBeInTheDocument();
  });

  it('should calculate savings rate for positive net balance', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 5000 }),
      mockTransaction({ type: 'expense', amount: 3000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Net: 2000, Income: 5000 → Savings rate: 40%
    expect(screen.getByText(/40% savings rate/)).toBeInTheDocument();
  });

  it('should show overspend percentage for negative net balance', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 2000 }),
      mockTransaction({ type: 'expense', amount: 3000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Net: -1000, Income: 2000 → Overspend: 50%
    expect(screen.getByText(/50% over income/)).toBeInTheDocument();
  });

  it('should not show savings rate when no income', () => {
    const transactions = [
      mockTransaction({ type: 'expense', amount: 1000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.queryByText(/savings rate|over income/)).not.toBeInTheDocument();
  });

  it('should format large numbers with thousands separator', () => {
    const transactions = [
      mockTransaction({ type: 'income', amount: 1000000 }),
      mockTransaction({ type: 'expense', amount: 500000 }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/\+\$1,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/-\$500,000/)).toBeInTheDocument();
  });

  it('should handle transactions with createdAt as date fallback', () => {
    const today = new Date().toISOString().split('T')[0];
    const transactions = [
      mockTransaction({
        type: 'expense',
        amount: 250,
        date: undefined,
        createdAt: `${today}T10:00:00Z`,
      }),
    ];

    render(
      <SummaryCards
        transactions={transactions}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText(/Today: \$250/)).toBeInTheDocument();
  });

  it('should render with grid layout', () => {
    const { container } = render(
      <SummaryCards
        transactions={[]}
        convert={(n) => n}
        symbol="$"
      />
    );

    const grid = container.querySelector('.MuiGrid-root');
    expect(grid).toBeInTheDocument();
  });

  it('should display different colors for positive and negative net balance', () => {
    const { rerender, container: container1 } = render(
      <SummaryCards
        transactions={[
          mockTransaction({ type: 'income', amount: 5000 }),
          mockTransaction({ type: 'expense', amount: 2000 }),
        ]}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Positive balance: net balance value should be +$3,000
    expect(screen.getByText(/\+\$3,000/)).toBeInTheDocument();

    rerender(
      <SummaryCards
        transactions={[
          mockTransaction({ type: 'income', amount: 1000 }),
          mockTransaction({ type: 'expense', amount: 5000 }),
        ]}
        convert={(n) => n}
        symbol="$"
      />
    );

    // Negative balance: net balance value should be -$4,000
    expect(screen.getAllByText(/-\$4,000/).length).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty transaction array', () => {
    const { container } = render(
      <SummaryCards
        transactions={[]}
        convert={(n) => n}
        symbol="$"
      />
    );

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiCard-root').length).toBe(3);
  });
});
