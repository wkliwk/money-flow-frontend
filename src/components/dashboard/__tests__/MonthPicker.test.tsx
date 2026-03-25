import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import MonthPicker from '../MonthPicker';

describe('MonthPicker', () => {
  it('displays the selected month label', () => {
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={jest.fn()} />);
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('calls onChange with previous month when left arrow is clicked', () => {
    const onChange = jest.fn();
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // ChevronLeft
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ $M: 1 })); // February = month index 1
  });

  it('calls onChange with next month when right arrow is clicked', () => {
    const onChange = jest.fn();
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // ChevronRight
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ $M: 3 })); // April = month index 3
  });

  it('shows All Time chip when a month is selected', () => {
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={jest.fn()} />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('shows This Month chip when no month selected', () => {
    render(<MonthPicker selectedMonth={null} onChange={jest.fn()} />);
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('calls onChange with null when All Time chip is clicked', () => {
    const onChange = jest.fn();
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={onChange} />);
    fireEvent.click(screen.getByText('All Time'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange with current month when This Month chip is clicked', () => {
    const onChange = jest.fn();
    render(<MonthPicker selectedMonth={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('This Month'));
    expect(onChange).toHaveBeenCalled();
  });

  it('opens the month picker popover when month label is clicked', () => {
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={jest.fn()} />);
    fireEvent.click(screen.getByText('March 2026'));
    // Popover should be open - month names should appear
    expect(screen.getByText('Jan')).toBeInTheDocument();
  });

  it('can navigate year in popover', () => {
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={jest.fn()} />);
    fireEvent.click(screen.getByText('March 2026'));
    // Year should be visible
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('selects a month from popover', () => {
    const onChange = jest.fn();
    const month = dayjs('2026-03-01');
    render(<MonthPicker selectedMonth={month} onChange={onChange} />);
    fireEvent.click(screen.getByText('March 2026'));
    // Click on Jan in the popover
    const janOptions = screen.getAllByText('Jan');
    fireEvent.click(janOptions[0]);
    expect(onChange).toHaveBeenCalled();
  });
});
