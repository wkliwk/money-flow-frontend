import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  SummaryCardsSkeleton,
  CategoryChartSkeleton,
  SpendingBreakdownSkeleton,
  TrendsChartSkeleton,
  BudgetProgressSkeleton,
} from '../DashboardSkeletons';

describe('DashboardSkeletons', () => {
  it('SummaryCardsSkeleton renders 3 skeleton card placeholders', () => {
    const { container } = render(<SummaryCardsSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    // 3 cards x 3 skeletons each (label, icon, value, delta) = at least 9
    expect(skeletons.length).toBeGreaterThanOrEqual(9);
  });

  it('CategoryChartSkeleton renders a circular skeleton placeholder', () => {
    const { container } = render(<CategoryChartSkeleton />);
    const circular = container.querySelectorAll('.MuiSkeleton-circular');
    // 1 large circle + 4 legend dots
    expect(circular.length).toBeGreaterThanOrEqual(5);
  });

  it('SpendingBreakdownSkeleton renders 5 skeleton rows', () => {
    const { container } = render(<SpendingBreakdownSkeleton />);
    const rectangles = container.querySelectorAll('.MuiSkeleton-rectangular');
    expect(rectangles.length).toBe(5);
  });

  it('TrendsChartSkeleton renders bar-shaped skeleton placeholders', () => {
    const { container } = render(<TrendsChartSkeleton />);
    const rectangles = container.querySelectorAll('.MuiSkeleton-rectangular');
    // 6 groups x 2 bars = 12
    expect(rectangles.length).toBe(12);
  });

  it('BudgetProgressSkeleton renders 3 skeleton progress bars', () => {
    const { container } = render(<BudgetProgressSkeleton />);
    const rectangles = container.querySelectorAll('.MuiSkeleton-rectangular');
    expect(rectangles.length).toBe(3);
  });

  it('all skeletons use pulse animation by default', () => {
    const { container } = render(
      <>
        <SummaryCardsSkeleton />
        <CategoryChartSkeleton />
        <SpendingBreakdownSkeleton />
        <TrendsChartSkeleton />
        <BudgetProgressSkeleton />
      </>,
    );
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    skeletons.forEach((skeleton) => {
      expect(skeleton.classList.contains('MuiSkeleton-pulse')).toBe(true);
    });
  });
});
