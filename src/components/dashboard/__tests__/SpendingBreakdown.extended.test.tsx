/**
 * Extended SpendingBreakdown tests covering missing branches.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SpendingBreakdown from '../SpendingBreakdown';
import { Transaction } from '../../../types';

jest.mock('../../../hooks/useBudgets', () => ({
  useBudgets: () => ({ budgets: {}, setBudget: jest.fn() }),
}));

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  _id: String(Math.random()),
  owner: 'user1',
  description: 'Test',
  amount: 100,
  type: 'expense',
  date: '2026-03-10',
  createdAt: '2026-03-10',
  updatedAt: '2026-03-10',
  ...overrides,
});

describe('SpendingBreakdown — extended coverage', () => {
  it('uses category fallback when no item present', () => {
    const tx = makeTransaction({ category: 'Transport', amount: 500 });
    delete (tx as any).item;
    render(<SpendingBreakdown transactions={[tx]} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('uses "Other" fallback when neither item nor category present', () => {
    const tx = makeTransaction({ amount: 200 });
    delete (tx as any).item;
    delete (tx as any).category;
    render(<SpendingBreakdown transactions={[tx]} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('shows upward delta when current > previous month spend', () => {
    const currentTx = makeTransaction({ item: 'MyCategory', category: undefined as any, amount: 300 });
    const prevTx = makeTransaction({ item: 'MyCategory', category: undefined as any, amount: 200 });
    render(
      <SpendingBreakdown
        transactions={[currentTx]}
        prevMonthTransactions={[prevTx]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('MyCategory')).toBeInTheDocument();
    expect(screen.getByText('↑50%')).toBeInTheDocument();
  });

  it('shows downward delta when current < previous month spend', () => {
    const currentTx = makeTransaction({ item: 'MyCategory2', category: undefined as any, amount: 100 });
    const prevTx = makeTransaction({ item: 'MyCategory2', category: undefined as any, amount: 200 });
    render(
      <SpendingBreakdown
        transactions={[currentTx]}
        prevMonthTransactions={[prevTx]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('↓50%')).toBeInTheDocument();
  });

  it('hides delta when prevCatTotal is 0', () => {
    const currentTx = makeTransaction({ item: 'Taxi', category: 'Transport', amount: 200 });
    render(
      <SpendingBreakdown
        transactions={[currentTx]}
        prevMonthTransactions={[]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
    expect(screen.queryByText(/↓/)).not.toBeInTheDocument();
  });

  it('renders up to 6 rows when more than 6 items', () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      makeTransaction({ item: `Item${i}`, amount: (8 - i) * 100 })
    );
    render(<SpendingBreakdown transactions={items} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Item0')).toBeInTheDocument();
    expect(screen.getByText('Item5')).toBeInTheDocument();
    expect(screen.queryByText('Item6')).not.toBeInTheDocument();
    expect(screen.queryByText('Item7')).not.toBeInTheDocument();
  });

  it('uses ITEM_TO_CATEGORY mapping for known items', () => {
    const tx = makeTransaction({ item: 'Rent', category: 'Housing', amount: 10000 });
    render(<SpendingBreakdown transactions={[tx]} convert={(n) => n} symbol="HK$" />);
    expect(screen.getByText('Rent')).toBeInTheDocument();
  });

  it('multiple transactions aggregated under same item', () => {
    const txs = [
      makeTransaction({ item: 'Coffee', amount: 50 }),
      makeTransaction({ item: 'Coffee', amount: 30 }),
      makeTransaction({ item: 'Coffee', amount: 20 }),
    ];
    render(<SpendingBreakdown transactions={txs} convert={(n) => n} symbol="HK$" />);
    const coffeeItems = screen.getAllByText('Coffee');
    expect(coffeeItems.length).toBe(1);
    expect(screen.getByText('HK$100')).toBeInTheDocument();
  });
});
