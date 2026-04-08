import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoalsPage from '../GoalsPage';

const mockAddGoal = jest.fn();
const mockUpdateAmount = jest.fn();
const mockDeleteGoal = jest.fn();
let mockGoals: any[] = [];

jest.mock('../../../hooks/useGoals', () => ({
  useGoals: () => ({
    goals: mockGoals,
    addGoal: mockAddGoal,
    updateAmount: mockUpdateAmount,
    deleteGoal: mockDeleteGoal,
  }),
}));

const defaultProps = {
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('GoalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGoals = [];
  });

  it('renders empty state when no goals', () => {
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
    expect(screen.getByText('Start saving towards a goal')).toBeInTheDocument();
  });

  it('renders header with Add Goal button', () => {
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getAllByText(/Add Goal/i).length).toBeGreaterThan(0);
  });

  it('opens add dialog when clicking header Add Goal button', () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    expect(screen.getByText('New Savings Goal')).toBeInTheDocument();
  });

  it('opens add dialog from empty state button', () => {
    render(<GoalsPage {...defaultProps} />);
    // Empty state has its own Create goal button
    fireEvent.click(screen.getByText('Create goal'));
    expect(screen.getByText('New Savings Goal')).toBeInTheDocument();
  });

  it('add dialog has all form fields', () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    expect(screen.getByLabelText('Goal name')).toBeInTheDocument();
    expect(screen.getByLabelText('Target amount (HKD)')).toBeInTheDocument();
    expect(screen.getByLabelText('Deadline (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Category (optional)')).toBeInTheDocument();
  });

  it('Create button is disabled when form is empty', () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    expect(screen.getByText('Create')).toBeDisabled();
  });

  it('Create button enables when name and amount are filled', () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: 'Vacation' } });
    fireEvent.change(screen.getByLabelText('Target amount (HKD)'), { target: { value: '5000' } });
    expect(screen.getByText('Create')).not.toBeDisabled();
  });

  it('calls addGoal and closes dialog on Create', async () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: 'Vacation' } });
    fireEvent.change(screen.getByLabelText('Target amount (HKD)'), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText('Category (optional)'), { target: { value: 'Travel' } });
    fireEvent.click(screen.getByText('Create'));
    expect(mockAddGoal).toHaveBeenCalledWith({
      name: 'Vacation',
      targetAmount: 5000,
      deadline: undefined,
      category: 'Travel',
    });
    await waitFor(() => {
      expect(screen.queryByText('New Savings Goal')).not.toBeInTheDocument();
    });
  });

  it('closes add dialog on Cancel', async () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    expect(screen.getByText('New Savings Goal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByText('New Savings Goal')).not.toBeInTheDocument();
    });
  });

  it('renders goal cards when goals exist', () => {
    mockGoals = [
      { id: '1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 3000, createdAt: '2026-01-01' },
      { id: '2', name: 'Vacation', targetAmount: 5000, currentAmount: 0, createdAt: '2026-02-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Vacation')).toBeInTheDocument();
    expect(screen.queryByText('No goals yet')).not.toBeInTheDocument();
  });

  it('shows progress percentage', () => {
    mockGoals = [
      { id: '1', name: 'Test Goal', targetAmount: 1000, currentAmount: 500, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('50% complete')).toBeInTheDocument();
  });

  it('shows formatted amounts with symbol', () => {
    mockGoals = [
      { id: '1', name: 'Test', targetAmount: 10000, currentAmount: 5000, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('HK$5,000')).toBeInTheDocument();
    expect(screen.getByText('of HK$10,000')).toBeInTheDocument();
  });

  it('shows days remaining for goals with deadlines', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    mockGoals = [
      { id: '1', name: 'Goal', targetAmount: 1000, currentAmount: 0, deadline: futureDate.toISOString().split('T')[0], createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText(/\d+d left/)).toBeInTheDocument();
  });

  it('shows overdue for past deadline goals', () => {
    mockGoals = [
      { id: '1', name: 'Overdue', targetAmount: 1000, currentAmount: 0, deadline: '2020-01-01', createdAt: '2019-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText(/\d+d overdue/)).toBeInTheDocument();
  });

  it('shows completion state for 100% goals', () => {
    mockGoals = [
      { id: '1', name: 'Done Goal', targetAmount: 1000, currentAmount: 1000, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('100% complete')).toBeInTheDocument();
  });

  it('shows category chip when category is set', () => {
    mockGoals = [
      { id: '1', name: 'Tagged', targetAmount: 1000, currentAmount: 0, category: 'Travel', createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('Travel')).toBeInTheDocument();
  });

  it('opens update amount dialog when clicking a goal card', () => {
    mockGoals = [
      { id: '1', name: 'Clickable', targetAmount: 1000, currentAmount: 500, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Clickable'));
    expect(screen.getByText('Update Progress')).toBeInTheDocument();
    expect(screen.getByLabelText('Current amount saved (HKD)')).toBeInTheDocument();
  });

  it('calls updateAmount on save', () => {
    mockGoals = [
      { id: '1', name: 'Update Me', targetAmount: 1000, currentAmount: 500, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getByText('Update Me'));
    fireEvent.change(screen.getByLabelText('Current amount saved (HKD)'), { target: { value: '750' } });
    fireEvent.click(screen.getByText('Save'));
    expect(mockUpdateAmount).toHaveBeenCalledWith('1', 750);
  });

  it('calls deleteGoal when clicking delete icon', () => {
    mockGoals = [
      { id: '1', name: 'Delete Me', targetAmount: 1000, currentAmount: 0, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    const deleteBtn = document.querySelector('[data-testid="DeleteIcon"]')?.closest('button');
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
    }
    expect(mockDeleteGoal).toHaveBeenCalledWith('1');
  });

  it('sorts completed goals after active goals', () => {
    mockGoals = [
      { id: '1', name: 'Complete', targetAmount: 100, currentAmount: 100, createdAt: '2026-03-01' },
      { id: '2', name: 'Active', targetAmount: 100, currentAmount: 50, createdAt: '2026-01-01' },
    ];
    render(<GoalsPage {...defaultProps} />);
    const cards = screen.getAllByText(/% complete/);
    // Active should appear first
    expect(cards[0].textContent).toBe('50% complete');
    expect(cards[1].textContent).toBe('100% complete');
  });
});
