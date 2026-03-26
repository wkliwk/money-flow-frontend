import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import DateRangeControl from '../DateRangeControl';

const defaultProps = {
  preset: 'month' as const,
  selectedMonth: dayjs('2026-03-01'),
  customStart: '',
  customEnd: '',
  currency: 'HKD' as const,
  onPresetChange: jest.fn(),
  onMonthChange: jest.fn(),
  onCustomChange: jest.fn(),
  onCurrencyChange: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('DateRangeControl', () => {
  it('renders all preset chips', () => {
    render(<DateRangeControl {...defaultProps} />);
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getAllByText('Month').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Last Month')).toBeInTheDocument();
    expect(screen.getAllByText('All Time').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('calls onPresetChange when a chip is clicked', () => {
    render(<DateRangeControl {...defaultProps} />);
    fireEvent.click(screen.getByText('Week'));
    expect(defaultProps.onPresetChange).toHaveBeenCalledWith('week');
  });

  it('shows MonthPicker when preset is month', () => {
    render(<DateRangeControl {...defaultProps} />);
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('hides MonthPicker when preset is not month', () => {
    render(<DateRangeControl {...defaultProps} preset="all-time" />);
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument();
  });

  it('clicking custom chip when active opens popover', () => {
    render(<DateRangeControl {...defaultProps} preset="custom" customStart="2026-03-01" customEnd="2026-03-15" />);
    // When custom is active, the chip shows the date range
    const chip = screen.getByText(/Mar 1/);
    fireEvent.click(chip);
    expect(screen.getByText('Custom date range')).toBeInTheDocument();
  });

  it('clicking custom chip when inactive calls onPresetChange', () => {
    render(<DateRangeControl {...defaultProps} preset="month" />);
    fireEvent.click(screen.getByText('Custom'));
    expect(defaultProps.onPresetChange).toHaveBeenCalledWith('custom');
  });

  it('Apply button in custom popover calls onCustomChange', () => {
    render(<DateRangeControl {...defaultProps} preset="custom" customStart="2026-03-01" customEnd="2026-03-15" />);
    const chip = screen.getByText(/Mar 1/);
    fireEvent.click(chip);
    const applyBtn = screen.getByText('Apply');
    fireEvent.click(applyBtn);
    expect(defaultProps.onCustomChange).toHaveBeenCalled();
  });
});
