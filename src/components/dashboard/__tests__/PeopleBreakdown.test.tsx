import React from 'react';
import { render, screen } from '@testing-library/react';
import PeopleBreakdown from '../PeopleBreakdown';
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

describe('PeopleBreakdown', () => {
  it('returns null when no expense transactions with participants', () => {
    const { container } = render(
      <PeopleBreakdown
        transactions={[makeTransaction({ type: 'income' })]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders person rows when participants are present', () => {
    const transactions = [
      makeTransaction({ participants: ['Alice', 'Bob'], amount: 500 }),
    ];
    render(
      <PeopleBreakdown
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows "Treated" section heading', () => {
    const transactions = [
      makeTransaction({ participants: ['Alice'], amount: 200 }),
    ];
    render(
      <PeopleBreakdown
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Treated')).toBeInTheDocument();
  });

  it('displays correct amount for participant', () => {
    const transactions = [
      makeTransaction({ participants: ['Alice'], amount: 300 }),
    ];
    render(
      <PeopleBreakdown
        transactions={transactions}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('HK$300')).toBeInTheDocument();
  });
});
