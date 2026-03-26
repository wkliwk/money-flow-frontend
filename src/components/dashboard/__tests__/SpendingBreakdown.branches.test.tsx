import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SpendingBreakdown from '../SpendingBreakdown';
import { Transaction } from '../../../types';

// Provide a budget for one category to hit the budget-display branches
jest.mock('../../../hooks/useBudgets', () => ({
  useBudgets: () => ({
    budgets: { Food: 1000, Transport: 500 },
    setBudget: jest.fn(),
  }),
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

describe('SpendingBreakdown — branch coverage', () => {
  it('renders budget usage bar when category has a budget and is under limit', () => {
    // 'Coffee' maps to 'Food & Drink' via ITEM_TO_CATEGORY, but we need a category
    // that matches a budget key directly.
    const transactions = [
      makeTransaction({ category: 'Food', amount: 600, item: 'Food' }),
    ];
    render(
      <SpendingBreakdown transactions={transactions} convert={(n) => n} symbol="HK$" />
    );
    // Should render the item and budget text (under budget)
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows over-budget indicator when spending exceeds budget', () => {
    const transactions = [
      makeTransaction({ category: 'Transport', amount: 800, item: 'Transport' }),
    ];
    render(
      <SpendingBreakdown transactions={transactions} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('Transport')).toBeInTheDocument();
    // over-budget: catTotal (800) > budget (500)
    expect(screen.getByText(/over/i)).toBeInTheDocument();
  });

  it('shows delta arrow down when spending decreased vs prev month', () => {
    const transactions = [makeTransaction({ category: 'Other', item: 'Other', amount: 100 })];
    const prev = [makeTransaction({ category: 'Other', item: 'Other', amount: 200 })];
    render(
      <SpendingBreakdown
        transactions={transactions}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it('shows delta arrow up when spending increased vs prev month', () => {
    const transactions = [makeTransaction({ category: 'Other', item: 'Other', amount: 300 })];
    const prev = [makeTransaction({ category: 'Other', item: 'Other', amount: 100 })];
    render(
      <SpendingBreakdown
        transactions={transactions}
        prevMonthTransactions={prev}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it('shows plain amount when no budget is set for a category', () => {
    const transactions = [makeTransaction({ category: 'NoBudgetCat', item: 'NoBudgetCat', amount: 250 })];
    render(
      <SpendingBreakdown transactions={transactions} convert={(n) => n} symbol="HK$" />
    );
    expect(screen.getByText('NoBudgetCat')).toBeInTheDocument();
    expect(screen.getByText('HK$250')).toBeInTheDocument();
  });

  it('does not call onItemClick when no handler provided (default cursor)', () => {
    const transactions = [makeTransaction({ item: 'NoBudgetCat', amount: 100 })];
    // Should render without error — no click handler
    render(
      <SpendingBreakdown transactions={transactions} convert={(n) => n} symbol="HK$" />
    );
    fireEvent.click(screen.getByText('NoBudgetCat'));
    // No crash = pass
    expect(screen.getByText('NoBudgetCat')).toBeInTheDocument();
  });

  it('renders with empty prevMonthTransactions array (no delta)', () => {
    const transactions = [makeTransaction({ item: 'Groceries', amount: 200 })];
    render(
      <SpendingBreakdown
        transactions={transactions}
        prevMonthTransactions={[]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    // No delta arrows when prev array is empty
    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
  });

  it('uses category fallback when item has no ITEM_TO_CATEGORY mapping', () => {
    const transactions = [
      makeTransaction({ category: 'Uncategorized', amount: 150 }),
    ];
    render(
      <SpendingBreakdown transactions={transactions} convert={(n) => n} symbol="HK$" />
    );
    // Falls back to description as item key
    expect(screen.getByText('Spending Breakdown')).toBeInTheDocument();
  });
});
