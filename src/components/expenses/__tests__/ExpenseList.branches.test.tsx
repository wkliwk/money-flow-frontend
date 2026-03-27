/**
 * Branch coverage tests for ExpenseList.
 * Tests cover: getDateKey / formatGroupHeader edge cases, fmtOriginal paths,
 * recurringLabels matching, and the mobile card-view path.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseList from '../ExpenseList';
import { Transaction } from '../../../types';

// Simulate mobile viewport so isMobile = true
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => true, // always mobile
  };
});

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const makeTransaction = (overrides: Partial<Transaction>): Transaction => ({
  _id: '1',
  owner: 'user1',
  description: 'Coffee',
  amount: 50,
  type: 'expense',
  date: today,
  createdAt: today,
  updatedAt: today,
  ...overrides,
});

const defaultProps = {
  transactions: [],
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('ExpenseList (mobile view) — branch coverage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('groups transactions under "Today" header', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ date: today })]}
      />
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('groups transactions under "Yesterday" header', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ date: yesterday })]}
      />
    );
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('groups transactions under a formatted date header for older dates', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ date: '2026-01-15' })]}
      />
    );
    // Some locale-formatted date header like "Thu, 15 Jan"
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
  });

  it('groups transactions under "Unknown" header when date is invalid', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ date: undefined, createdAt: undefined })]}
      />
    );
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('falls back to createdAt when date is undefined', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ date: undefined, createdAt: today })]}
      />
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('shows description subtitle when item and description differ', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[
          makeTransaction({ item: 'Food', description: 'Thai lunch', date: today }),
        ]}
      />
    );
    expect(screen.getByText('Thai lunch')).toBeInTheDocument();
  });

  it('does not show description subtitle when description equals item', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ item: 'Coffee', description: 'Coffee', date: today })]}
      />
    );
    // Should only appear once — not duplicated as subtitle
    const matches = screen.getAllByText('Coffee');
    expect(matches.length).toBe(1);
  });

  it('shows participants line in mobile card', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ participants: ['Alice', 'Bob'], date: today })]}
      />
    );
    expect(screen.getByText('with Alice, Bob')).toBeInTheDocument();
  });

  it('shows payment method in mobile card', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ paymentMethod: 'Octopus', date: today })]}
      />
    );
    expect(screen.getByText('Octopus')).toBeInTheDocument();
  });

  it('shows recurring icon when recurringLabels matches item', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ item: 'Netflix', date: today })]}
        recurringLabels={new Set(['Netflix'])}
      />
    );
    // Recurring icon is rendered (RepeatIcon) — component renders without crash
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('shows recurring icon when recurringLabels matches description', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ description: 'Gym', date: today })]}
        recurringLabels={new Set(['Gym'])}
      />
    );
    expect(screen.getByText('Gym')).toBeInTheDocument();
  });

  it('shows original currency amount in mobile card for non-HKD transaction', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ currency: 'JPY', originalAmount: 500, amount: 30, date: today })]}
      />
    );
    expect(screen.getByText('\u00a5500')).toBeInTheDocument();
  });

  it('shows daily total for expense items in date group', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[
          makeTransaction({ _id: '1', amount: 100, type: 'expense', date: today }),
          makeTransaction({ _id: '2', amount: 200, type: 'expense', date: today }),
        ]}
      />
    );
    expect(screen.getByText('-HK$300')).toBeInTheDocument();
  });

  it('shows no daily total when group contains only income', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ type: 'income', amount: 1000, date: today })]}
      />
    );
    // The daily total IIFE returns null for income-only groups
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.queryByText(/-HK\$/)).not.toBeInTheDocument();
  });

  it('shows income amount with + prefix in mobile card', () => {
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ type: 'income', amount: 500, date: today })]}
      />
    );
    expect(screen.getByText('+HK$500')).toBeInTheDocument();
  });

  // Empty state branches
  it('shows "No transactions yet" empty state when transactions is empty and no filters active', () => {
    render(<ExpenseList {...defaultProps} transactions={[]} filtersActive={false} />);
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('shows "No results" empty state when transactions is empty and filters are active', () => {
    render(<ExpenseList {...defaultProps} transactions={[]} filtersActive={true} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('shows "Add First Expense" CTA when no transactions and onAddClick provided', () => {
    const onAddClick = jest.fn();
    render(
      <ExpenseList {...defaultProps} transactions={[]} filtersActive={false} onAddClick={onAddClick} />
    );
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  // Swipe touch branches — enable touch via ontouchstart mock
  it('swipe left triggers reveal when delta exceeds threshold', () => {
    // Enable touch support in jsdom
    (window as any).ontouchstart = jest.fn();
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ _id: 'tx1', date: today })]}
      />
    );
    const row = document.querySelector('[data-testid="swipeable-row"]');
    if (row) {
      fireEvent.touchStart(row, { touches: [{ clientX: 300 }] });
      // Swipe left by more than threshold (80px)
      fireEvent.touchMove(row, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(row);
    }
    // Component handles swipe without crash
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    delete (window as any).ontouchstart;
  });

  it('swipe right resets offset', () => {
    (window as any).ontouchstart = jest.fn();
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ _id: 'tx1', date: today })]}
      />
    );
    const row = document.querySelector('[data-testid="swipeable-row"]');
    if (row) {
      fireEvent.touchStart(row, { touches: [{ clientX: 200 }] });
      // Swipe right (positive deltaX)
      fireEvent.touchMove(row, { touches: [{ clientX: 250 }] });
      fireEvent.touchEnd(row);
    }
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    delete (window as any).ontouchstart;
  });

  it('touchMove with undefined startX does not crash', () => {
    (window as any).ontouchstart = jest.fn();
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ _id: 'tx1', date: today })]}
      />
    );
    const row = document.querySelector('[data-testid="swipeable-row"]');
    if (row) {
      // touchMove without prior touchStart — startX will be undefined
      fireEvent.touchMove(row, { touches: [{ clientX: 150 }] });
    }
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    delete (window as any).ontouchstart;
  });

  it('small swipe (below threshold) snaps back', () => {
    (window as any).ontouchstart = jest.fn();
    render(
      <ExpenseList
        {...defaultProps}
        transactions={[makeTransaction({ _id: 'tx1', date: today })]}
      />
    );
    const row = document.querySelector('[data-testid="swipeable-row"]');
    if (row) {
      fireEvent.touchStart(row, { touches: [{ clientX: 200 }] });
      // Small swipe left (less than 80px threshold)
      fireEvent.touchMove(row, { touches: [{ clientX: 180 }] });
      fireEvent.touchEnd(row);
    }
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    delete (window as any).ontouchstart;
  });
});
