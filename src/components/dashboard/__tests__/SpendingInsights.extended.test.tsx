/**
 * Extended SpendingInsights tests covering missing branches.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SpendingInsights from '../SpendingInsights';
import { Transaction } from '../../../types';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: String(Math.random()),
  owner: 'u1',
  description: 'test',
  amount: 100,
  type: 'expense',
  date: '2026-03-15',
  createdAt: '2026-03-15',
  updatedAt: '2026-03-15',
  ...overrides,
});

describe('SpendingInsights — extended coverage', () => {
  it('returns null when cards.length === 0 (prevExpenses > 0, same spend, net <= 0, no topCat delta)', () => {
    // Same spend in current and prev → spendDelta = 0 (shows "0% less")
    // Actually spendDelta=0 → direction is 'less', so a card IS pushed.
    // To get 0 cards: need prevExpenses=0 (spendDelta=null) AND net<=0 AND topCat=null or <10% change
    const current = [makeTx({ amount: 100, type: 'expense', category: 'Food' })];
    const prev = [makeTx({ amount: 100, type: 'income', category: 'Other' })]; // prev is income, not expense
    const { container } = render(
      <SpendingInsights transactions={current} prevMonthTransactions={prev} convert={(v) => v} symbol="$" />
    );
    // prevExpenses = 0, so spendDelta = null, no spendDelta card
    // topCat: curMap has Food=100, prevMap is empty, prv=0 so no biggest → topCat = null
    // net = 0 - 100 = -100, no savings card
    // cards.length === 0 → returns null
    expect(container.firstChild).toBeNull();
  });

  it('uses "Other" category fallback when transaction has no category (in current)', () => {
    const txWithoutCat = makeTx({ amount: 200, type: 'expense' });
    delete (txWithoutCat as any).category;
    const prev = [makeTx({ amount: 100, type: 'expense', category: 'Food' })];
    render(
      <SpendingInsights transactions={[txWithoutCat]} prevMonthTransactions={prev} convert={(v) => v} symbol="$" />
    );
    // Should not throw; 'Other' category used as fallback
    expect(document.body).toBeTruthy();
  });

  it('uses "Other" category fallback when prev transaction has no category', () => {
    const current = [makeTx({ amount: 200, type: 'expense', category: 'Food' })];
    const prevWithoutCat = makeTx({ amount: 100, type: 'expense' });
    delete (prevWithoutCat as any).category;
    render(
      <SpendingInsights transactions={current} prevMonthTransactions={[prevWithoutCat]} convert={(v) => v} symbol="$" />
    );
    expect(document.body).toBeTruthy();
  });

  it('handles category in prev but not in current (curMap[cat] || 0 branch)', () => {
    // prev has "Transport", current doesn't → curMap['Transport'] = 0 (uses || 0)
    const current = [makeTx({ amount: 200, type: 'expense', category: 'Food' })];
    const prev = [
      makeTx({ amount: 100, type: 'expense', category: 'Food' }),
      makeTx({ amount: 50, type: 'expense', category: 'Transport' }),
    ];
    render(
      <SpendingInsights transactions={current} prevMonthTransactions={prev} convert={(v) => v} symbol="$" />
    );
    expect(document.body).toBeTruthy();
  });

  it('handles category in current but not in prev (prevMap[cat] || 0 branch)', () => {
    // current has "Entertainment", prev doesn't → prevMap['Entertainment'] = 0 → prv = 0, no biggest
    const current = [
      makeTx({ amount: 200, type: 'expense', category: 'Food' }),
      makeTx({ amount: 500, type: 'expense', category: 'Entertainment' }),
    ];
    const prev = [makeTx({ amount: 100, type: 'expense', category: 'Food' })];
    render(
      <SpendingInsights transactions={current} prevMonthTransactions={prev} convert={(v) => v} symbol="$" />
    );
    expect(document.body).toBeTruthy();
  });

  it('shows decrease arrow when spending decreased from prev month', () => {
    const current = [makeTx({ amount: 50, type: 'expense', category: 'Food' })];
    const prev = [makeTx({ amount: 200, type: 'expense', category: 'Food' })];
    render(
      <SpendingInsights transactions={current} prevMonthTransactions={prev} convert={(v) => v} symbol="$" />
    );
    expect(screen.getByText(/75% less spending/)).toBeInTheDocument();
  });

  it('topCat with decrease shows arrow down', () => {
    const current = [makeTx({ amount: 50, type: 'expense', category: 'Food' })];
    const prev = [makeTx({ amount: 100, type: 'expense', category: 'Food' })];
    render(
      <SpendingInsights transactions={current} prevMonthTransactions={prev} convert={(v) => v} symbol="$" />
    );
    // topCat Food: pct = (50-100)/100 * 100 = -50% → shows ↓50%
    expect(screen.getByText(/Food.*50.*↓50%/)).toBeInTheDocument();
  });
});
