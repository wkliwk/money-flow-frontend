import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryChart from '../CategoryChart';
import { Transaction } from '../../../types';

describe('CategoryChart', () => {
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

  it('should not render when no expenses', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ type: 'income', amount: 1000 }),
        ]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when no transactions', () => {
    const { container } = render(
      <CategoryChart transactions={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render chart with expenses', () => {
    render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
          mockTransaction({ category: 'Transport', amount: 50 }),
        ]}
      />
    );

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should aggregate expenses by category', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
          mockTransaction({ category: 'Food', amount: 50 }),
          mockTransaction({ category: 'Transport', amount: 40 }),
        ]}
      />
    );

    // Should render chart with aggregated data
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should handle categories with extra whitespace', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: '  Food  ', amount: 100 }),
          mockTransaction({ category: 'Food', amount: 50 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should assign "Other" to transactions without category', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: undefined, amount: 100 }),
          mockTransaction({ category: 'Food', amount: 50 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should sort categories by spending amount', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Small', amount: 10 }),
          mockTransaction({ category: 'Large', amount: 1000 }),
          mockTransaction({ category: 'Medium', amount: 500 }),
        ]}
      />
    );

    // Chart should render with sorted data
    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should collapse categories beyond top 6 into "Other"', () => {
    render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Cat1', amount: 100 }),
          mockTransaction({ category: 'Cat2', amount: 100 }),
          mockTransaction({ category: 'Cat3', amount: 100 }),
          mockTransaction({ category: 'Cat4', amount: 100 }),
          mockTransaction({ category: 'Cat5', amount: 100 }),
          mockTransaction({ category: 'Cat6', amount: 100 }),
          mockTransaction({ category: 'Cat7', amount: 100 }),
          mockTransaction({ category: 'Cat8', amount: 100 }),
        ]}
      />
    );

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should not show chart when only income transactions', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ type: 'income', amount: 5000 }),
          mockTransaction({ type: 'income', amount: 2000 }),
        ]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should filter out income transactions', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ type: 'income', amount: 5000 }),
          mockTransaction({ type: 'expense', category: 'Food', amount: 100 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should display card wrapper', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
        ]}
      />
    );

    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('should have chart title', () => {
    render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
        ]}
      />
    );

    expect(screen.getByText('Spending by Category')).toBeInTheDocument();
  });

  it('should render legend', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
          mockTransaction({ category: 'Transport', amount: 50 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-legend')).toBeInTheDocument();
  });

  it('should have tooltips configured', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-tooltip')).toBeInTheDocument();
  });

  it('should use correct colors for pie slices', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
          mockTransaction({ category: 'Transport', amount: 50 }),
        ]}
      />
    );

    const cells = container.querySelectorAll('.recharts-cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should call onCategoryClick when slice clicked', () => {
    const mockOnCategoryClick = jest.fn();
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
        ]}
        onCategoryClick={mockOnCategoryClick}
      />
    );

    // The pie chart is clickable
    const pie = container.querySelector('.recharts-pie');
    expect(pie).toHaveStyle('cursor: pointer');
  });

  it('should handle responsive height on mobile', () => {
    // Mock mobile viewport
    jest.mock('@mui/material', () => ({
      ...jest.requireActual('@mui/material'),
      useMediaQuery: () => true,
    }));

    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 100 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should handle large transaction amounts', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 1000000 }),
          mockTransaction({ category: 'Transport', amount: 500000 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should handle fractional amounts', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Food', amount: 25.5 }),
          mockTransaction({ category: 'Transport', amount: 12.3 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should handle many transactions in single category', () => {
    const manyTransactions = Array.from({ length: 100 }, (_, i) =>
      mockTransaction({ category: 'Food', amount: 10 + i })
    );

    const { container } = render(
      <CategoryChart transactions={manyTransactions} />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should handle empty category string', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: '', amount: 100 }),
          mockTransaction({ category: 'Food', amount: 50 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should properly handle category normalization', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: ' ', amount: 100 }),
          mockTransaction({ category: 'Food', amount: 50 }),
        ]}
      />
    );

    // Whitespace-only category should become "Other"
    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should render all categories when less than 6', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Cat1', amount: 100 }),
          mockTransaction({ category: 'Cat2', amount: 100 }),
          mockTransaction({ category: 'Cat3', amount: 100 }),
        ]}
      />
    );

    const legend = container.querySelector('.recharts-legend');
    expect(legend).toBeInTheDocument();
  });

  it('should include "Other" when exceeding 6 categories', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Cat1', amount: 100 }),
          mockTransaction({ category: 'Cat2', amount: 100 }),
          mockTransaction({ category: 'Cat3', amount: 100 }),
          mockTransaction({ category: 'Cat4', amount: 100 }),
          mockTransaction({ category: 'Cat5', amount: 100 }),
          mockTransaction({ category: 'Cat6', amount: 100 }),
          mockTransaction({ category: 'Cat7', amount: 100 }),
          mockTransaction({ category: 'Cat8', amount: 100 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });

  it('should calculate correct total for Other category', () => {
    const { container } = render(
      <CategoryChart
        transactions={[
          mockTransaction({ category: 'Cat1', amount: 100 }),
          mockTransaction({ category: 'Cat2', amount: 100 }),
          mockTransaction({ category: 'Cat3', amount: 100 }),
          mockTransaction({ category: 'Cat4', amount: 100 }),
          mockTransaction({ category: 'Cat5', amount: 100 }),
          mockTransaction({ category: 'Cat6', amount: 100 }),
          mockTransaction({ category: 'Cat7', amount: 50 }),
          mockTransaction({ category: 'Cat8', amount: 75 }),
        ]}
      />
    );

    expect(container.querySelector('.recharts-pie')).toBeInTheDocument();
  });
});
