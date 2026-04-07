import React from 'react';
import { render, screen, within } from '@testing-library/react';
import BudgetsPage from '../BudgetsPage';
import * as api from '../../../services/api';
import * as budgetsHook from '../../../hooks/useBudgets';

jest.mock('../../../services/api');
jest.mock('../../../hooks/useBudgets');

const mockGetBudgetSummary = api.getBudgetSummary as jest.MockedFunction<typeof api.getBudgetSummary>;
const mockUseBudgets = budgetsHook.useBudgets as jest.MockedFunction<typeof budgetsHook.useBudgets>;

const convert = (v: number) => v;
const symbol = '$';

const defaultProps = {
  convert,
  symbol,
  categorySpend: {} as Record<string, number>,
};

describe('BudgetsPage — non-zero spend rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBudgetSummary.mockResolvedValue([]);
  });

  it('renders progress bars with correct percentages for non-zero spend', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { 'Food & Drink': 500, Transport: 200 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Food & Drink', limit: 500, spend: 350, remaining: 150, percentUsed: 70, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
      { category: 'Transport', limit: 200, spend: 180, remaining: 20, percentUsed: 90, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    // Wait for summary fetch
    expect(await screen.findByText('70% used')).toBeInTheDocument();
    expect(screen.getByText('90% used')).toBeInTheDocument();
    expect(screen.getByText('$350')).toBeInTheDocument();
    expect(screen.getByText('of $500')).toBeInTheDocument();
    expect(screen.getByText('$180')).toBeInTheDocument();
    expect(screen.getByText('of $200')).toBeInTheDocument();
  });

  it('shows exceeded state with red chip when spend exceeds limit', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { Shopping: 300 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Shopping', limit: 300, spend: 450, remaining: -150, percentUsed: 150, exceeds: true, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    expect(await screen.findByText('Over budget')).toBeInTheDocument();
    expect(screen.getByText('$150 over')).toBeInTheDocument();
    expect(screen.getByText('100% used')).toBeInTheDocument();
  });

  it('shows remaining amount when under budget', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { 'Food & Drink': 500 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Food & Drink', limit: 500, spend: 200, remaining: 300, percentUsed: 40, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    expect(await screen.findByText('$300 remaining')).toBeInTheDocument();
    expect(screen.getByText('40% used')).toBeInTheDocument();
  });

  it('falls back to categorySpend when summary API returns no match', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { Entertainment: 400 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([]);

    render(
      <BudgetsPage
        {...defaultProps}
        categorySpend={{ Entertainment: 120 }}
      />
    );

    // Should use categorySpend fallback
    expect(await screen.findByText('$120')).toBeInTheDocument();
    expect(screen.getByText('30% used')).toBeInTheDocument();
    expect(screen.getByText('$280 remaining')).toBeInTheDocument();
  });

  it('sorts categories by percentage descending', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { 'Food & Drink': 1000, Transport: 100 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Food & Drink', limit: 1000, spend: 100, remaining: 900, percentUsed: 10, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
      { category: 'Transport', limit: 100, spend: 90, remaining: 10, percentUsed: 90, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    // Wait for summary data to load and re-render
    expect(await screen.findByText('90% used')).toBeInTheDocument();
    const cards = screen.getAllByText(/% used/);
    expect(cards[0]).toHaveTextContent('90% used');
    expect(cards[1]).toHaveTextContent('10% used');
  });

  it('renders empty state when no budgets exist', () => {
    mockUseBudgets.mockReturnValue({
      budgets: {},
      setBudget: jest.fn(),
    });

    render(<BudgetsPage {...defaultProps} />);

    expect(screen.getByText('No budgets yet')).toBeInTheDocument();
    expect(screen.getByText('Create Your First Budget')).toBeInTheDocument();
  });

  it('applies warning color for 70-89% usage', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { Utilities: 200 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Utilities', limit: 200, spend: 150, remaining: 50, percentUsed: 75, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    expect(await screen.findByText('75% used')).toBeInTheDocument();
    // Progress bar should be present with warning-level spend
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(1);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '75');
  });

  it('applies error color for 90%+ usage', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { Rent: 10000 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Rent', limit: 10000, spend: 9500, remaining: 500, percentUsed: 95, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    expect(await screen.findByText('95% used')).toBeInTheDocument();
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(1);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '95');
  });

  it('applies success color for under 70% usage', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { Education: 600 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Education', limit: 600, spend: 180, remaining: 420, percentUsed: 30, exceeds: false, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    expect(await screen.findByText('30% used')).toBeInTheDocument();
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(1);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '30');
  });

  it('caps progress bar at 100% even when spend exceeds limit', async () => {
    mockUseBudgets.mockReturnValue({
      budgets: { Health: 100 },
      setBudget: jest.fn(),
    });
    mockGetBudgetSummary.mockResolvedValue([
      { category: 'Health', limit: 100, spend: 250, remaining: -150, percentUsed: 250, exceeds: true, alertTriggered: false, thresholdPercentage: 80 },
    ]);

    render(<BudgetsPage {...defaultProps} />);

    await screen.findByText('Over budget');
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(1);
    // Value should be capped at 100
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '100');
  });
});
