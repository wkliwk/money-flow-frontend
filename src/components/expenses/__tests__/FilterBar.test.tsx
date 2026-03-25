import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../FilterBar';

const defaultProps = {
  search: '',
  typeFilter: 'all' as const,
  sortBy: 'date' as const,
  total: 10,
  filtered: 10,
  onSearchChange: jest.fn(),
  onTypeFilterChange: jest.fn(),
  onSortChange: jest.fn(),
  onExport: jest.fn(),
};

describe('FilterBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders search input', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search transactions…')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search', () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Search transactions…'), { target: { value: 'coffee' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('coffee');
  });

  it('shows clear button icon when search has value', () => {
    render(<FilterBar {...defaultProps} search="coffee" />);
    expect(document.querySelector('[data-testid="ClearIcon"]')).toBeTruthy();
  });

  it('calls onSearchChange with empty string when clear is clicked', () => {
    const onSearchChange = jest.fn();
    render(<FilterBar {...defaultProps} search="coffee" onSearchChange={onSearchChange} />);
    const clearIcon = document.querySelector('[data-testid="ClearIcon"]');
    if (clearIcon?.parentElement) fireEvent.click(clearIcon.parentElement);
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('renders All/Income/Expense toggle buttons', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Income' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expense' })).toBeInTheDocument();
  });

  it('calls onTypeFilterChange when Income button clicked', () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Income' }));
    expect(defaultProps.onTypeFilterChange).toHaveBeenCalledWith('income');
  });

  it('calls onTypeFilterChange when Expense button clicked', () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expense' }));
    expect(defaultProps.onTypeFilterChange).toHaveBeenCalledWith('expense');
  });

  it('calls onSortChange when sort icon clicked', () => {
    render(<FilterBar {...defaultProps} />);
    // Sort button is the IconButton with SortIcon
    const sortBtn = document.querySelector('[data-testid="SortIcon"]')?.parentElement;
    if (sortBtn) fireEvent.click(sortBtn);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('amount');
  });

  it('calls onSortChange to date when currently sorted by amount', () => {
    render(<FilterBar {...defaultProps} sortBy="amount" />);
    const sortBtn = document.querySelector('[data-testid="SortIcon"]')?.parentElement;
    if (sortBtn) fireEvent.click(sortBtn);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('date');
  });

  it('disables export button when filtered is 0', () => {
    render(<FilterBar {...defaultProps} filtered={0} />);
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement as HTMLButtonElement | null;
    expect(downloadBtn?.disabled).toBe(true);
  });

  it('enables export button when transactions exist', () => {
    render(<FilterBar {...defaultProps} filtered={5} />);
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement as HTMLButtonElement | null;
    expect(downloadBtn?.disabled).toBeFalsy();
  });

  it('calls onExport when export button clicked', () => {
    render(<FilterBar {...defaultProps} filtered={5} />);
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement;
    if (downloadBtn) fireEvent.click(downloadBtn);
    expect(defaultProps.onExport).toHaveBeenCalled();
  });

  it('shows filter count when search is active', () => {
    render(<FilterBar {...defaultProps} search="coffee" total={20} filtered={3} />);
    expect(screen.getByText(/showing 3 of 20/i)).toBeInTheDocument();
  });

  it('shows filter count when typeFilter is not all', () => {
    render(<FilterBar {...defaultProps} typeFilter="expense" total={20} filtered={8} />);
    expect(screen.getByText(/showing 8 of 20/i)).toBeInTheDocument();
  });

  it('shows "all time" label when searchAllTime is true', () => {
    render(<FilterBar {...defaultProps} search="test" searchAllTime={true} total={10} filtered={2} />);
    expect(screen.getByText(/all time/i)).toBeInTheDocument();
  });
});
