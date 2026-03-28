import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('../../../hooks/useGoals', () => {
  const goals: any[] = [];
  return {
    useGoals: () => ({
      goals,
      addGoal: jest.fn((g: any) => {
        goals.push({ ...g, id: 'test-id', currentAmount: 0, createdAt: new Date().toISOString() });
      }),
      updateAmount: jest.fn(),
      deleteGoal: jest.fn((id: string) => {
        const idx = goals.findIndex((g: any) => g.id === id);
        if (idx >= 0) goals.splice(idx, 1);
      }),
    }),
  };
});

import GoalsPage from '../GoalsPage';

const defaultProps = {
  convert: (n: number) => n,
  symbol: 'HK$',
};

describe('GoalsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty state', () => {
    render(<GoalsPage {...defaultProps} />);
    expect(screen.getByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText('Savings Goals')).toBeInTheDocument();
  });

  it('opens add dialog when clicking Add Goal button', () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    expect(screen.getByText('New Savings Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Goal name')).toBeInTheDocument();
  });

  it('add dialog has all required fields', () => {
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

  it('closes dialog on Cancel', async () => {
    render(<GoalsPage {...defaultProps} />);
    fireEvent.click(screen.getAllByText(/Add Goal/i)[0]);
    expect(screen.getByText('New Savings Goal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByText('New Savings Goal')).not.toBeInTheDocument();
    });
  });
});
