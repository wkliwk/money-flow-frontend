import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('PeopleBreakdown — branch coverage', () => {
  it('shows "1 time" (singular) for a person with count = 1', () => {
    render(
      <PeopleBreakdown
        transactions={[makeTransaction({ participants: ['Alice'], amount: 200 })]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('1 time')).toBeInTheDocument();
  });

  it('shows "N times" (plural) for a person with count > 1', () => {
    render(
      <PeopleBreakdown
        transactions={[
          makeTransaction({ _id: '1', participants: ['Bob'], amount: 100 }),
          makeTransaction({ _id: '2', participants: ['Bob'], amount: 150 }),
        ]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('2 times')).toBeInTheDocument();
  });

  it('calls onPersonClick when row is clicked', () => {
    const onPersonClick = jest.fn();
    render(
      <PeopleBreakdown
        transactions={[makeTransaction({ participants: ['Alice'], amount: 300 })]}
        convert={(n) => n}
        symbol="HK$"
        onPersonClick={onPersonClick}
      />
    );
    fireEvent.click(screen.getByText('Alice'));
    expect(onPersonClick).toHaveBeenCalledWith('Alice');
  });

  it('does not call onPersonClick when no handler is provided (default cursor)', () => {
    render(
      <PeopleBreakdown
        transactions={[makeTransaction({ participants: ['Alice'], amount: 300 })]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    // No crash on click
    fireEvent.click(screen.getByText('Alice'));
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('returns null when transactions have participants but all are income type', () => {
    const { container } = render(
      <PeopleBreakdown
        transactions={[makeTransaction({ type: 'income', participants: ['Alice'] })]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('excludes expense transactions with empty participants array', () => {
    const { container } = render(
      <PeopleBreakdown
        transactions={[makeTransaction({ participants: [] })]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    // No participants → rows empty → returns null
    expect(container.firstChild).toBeNull();
  });

  it('aggregates multiple participants from multiple transactions', () => {
    render(
      <PeopleBreakdown
        transactions={[
          makeTransaction({ _id: '1', participants: ['Alice', 'Bob'], amount: 400 }),
          makeTransaction({ _id: '2', participants: ['Alice'], amount: 200 }),
        ]}
        convert={(n) => n}
        symbol="HK$"
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Alice appears in 2 transactions
    expect(screen.getByText('2 times')).toBeInTheDocument();
  });
});
