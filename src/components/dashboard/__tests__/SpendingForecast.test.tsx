import React from 'react';
import { render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import SpendingForecast from '../SpendingForecast';
import { Transaction } from '../../../types';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Test',
  amount: 100,
  type: 'expense',
  date: dayjs().format('YYYY-MM-DD'),
  createdAt: dayjs().format('YYYY-MM-DD'),
  updatedAt: dayjs().format('YYYY-MM-DD'),
  ...overrides,
});

describe('SpendingForecast', () => {
  it('returns null when there are no expense transactions', () => {
    const { container } = render(
      <SpendingForecast
        transactions={[makeTransaction({ type: 'income' })]}
        budgets={{}}
        selectedMonth={dayjs()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the forecast section with expenses', () => {
    const transactions = [
      makeTransaction({ amount: 200, category: 'Food & Drink' }),
      makeTransaction({ _id: '2', amount: 150, category: 'Transport' }),
    ];
    render(
      <SpendingForecast
        transactions={transactions}
        budgets={{}}
        selectedMonth={dayjs()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Spending Forecast')).toBeInTheDocument();
    expect(screen.getByText(/projected/)).toBeInTheDocument();
  });

  it('shows on-track status when projected is under budget', () => {
    const transactions = [
      makeTransaction({ amount: 50, category: 'Food & Drink' }),
    ];
    render(
      <SpendingForecast
        transactions={transactions}
        budgets={{ 'Food & Drink': 10000 }}
        selectedMonth={dayjs()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    const onTrackLabels = screen.getAllByText('On track');
    expect(onTrackLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows over budget status when projected exceeds budget', () => {
    const transactions = [
      makeTransaction({ amount: 5000, category: 'Food & Drink' }),
    ];
    render(
      <SpendingForecast
        transactions={transactions}
        budgets={{ 'Food & Drink': 100 }}
        selectedMonth={dayjs()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    const overBudgetLabels = screen.getAllByText('Over budget');
    expect(overBudgetLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('returns null for past months', () => {
    const lastMonth = dayjs().subtract(1, 'month');
    const transactions = [
      makeTransaction({ amount: 200, date: lastMonth.format('YYYY-MM-DD') }),
    ];
    const { container } = render(
      <SpendingForecast
        transactions={transactions}
        budgets={{}}
        selectedMonth={lastMonth}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows per-category projections', () => {
    const transactions = [
      makeTransaction({ amount: 200, category: 'Food & Drink' }),
      makeTransaction({ _id: '2', amount: 100, category: 'Transport' }),
    ];
    render(
      <SpendingForecast
        transactions={transactions}
        budgets={{ 'Food & Drink': 5000, 'Transport': 2000 }}
        selectedMonth={dayjs()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Food & Drink')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows daily rate info', () => {
    const transactions = [
      makeTransaction({ amount: 300 }),
    ];
    render(
      <SpendingForecast
        transactions={transactions}
        budgets={{}}
        selectedMonth={dayjs()}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText(/\/day over/)).toBeInTheDocument();
  });
});
