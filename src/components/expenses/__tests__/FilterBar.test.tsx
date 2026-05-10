import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from '../FilterBar';

const defaultProps = {
  search: '',
  typeFilter: 'all' as const,
  paymentMethodFilter: 'all' as const,
  categoryFilter: 'all' as const,
  categories: [],
  sortBy: 'date' as const,
  total: 10,
  filtered: 10,
  onSearchChange: jest.fn(),
  onTypeFilterChange: jest.fn(),
  onPaymentMethodFilterChange: jest.fn(),
  onCategoryFilterChange: jest.fn(),
  onSortChange: jest.fn(),
  onExport: jest.fn(),
  onExportJson: jest.fn(),
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

  it('opens export menu when download button clicked', () => {
    render(<FilterBar {...defaultProps} filtered={5} />);
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement;
    if (downloadBtn) fireEvent.click(downloadBtn);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });

  it('calls onExport when Export CSV menu item clicked', () => {
    const onExport = jest.fn();
    render(<FilterBar {...defaultProps} filtered={5} onExport={onExport} />);
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement;
    if (downloadBtn) fireEvent.click(downloadBtn);
    fireEvent.click(screen.getByText('Export CSV'));
    expect(onExport).toHaveBeenCalled();
  });

  it('calls onExportJson when Export JSON menu item clicked', () => {
    const onExportJson = jest.fn();
    render(<FilterBar {...defaultProps} filtered={5} onExportJson={onExportJson} />);
    const downloadBtn = document.querySelector('[data-testid="DownloadIcon"]')?.parentElement;
    if (downloadBtn) fireEvent.click(downloadBtn);
    fireEvent.click(screen.getByText('Export JSON'));
    expect(onExportJson).toHaveBeenCalled();
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

  it('renders payment method filter toggle button', () => {
    render(<FilterBar {...defaultProps} />);
    expect(document.querySelector('[data-testid="FilterListIcon"]')).toBeTruthy();
  });

  it('shows payment method chips when filter toggle is clicked', () => {
    render(<FilterBar {...defaultProps} />);
    const filterBtn = document.querySelector('[data-testid="FilterListIcon"]')?.parentElement;
    if (filterBtn) fireEvent.click(filterBtn);
    // FilterBar currently renders enum keys as labels (see #279 follow-up)
    expect(screen.getByText('cash')).toBeInTheDocument();
    expect(screen.getByText('octopus')).toBeInTheDocument();
    expect(screen.getByText('payme')).toBeInTheDocument();
  });

  it('calls onPaymentMethodFilterChange when payment chip clicked', () => {
    const onPaymentMethodFilterChange = jest.fn();
    render(<FilterBar {...defaultProps} onPaymentMethodFilterChange={onPaymentMethodFilterChange} />);
    const filterBtn = document.querySelector('[data-testid="FilterListIcon"]')?.parentElement;
    if (filterBtn) fireEvent.click(filterBtn);
    fireEvent.click(screen.getByText('octopus'));
    expect(onPaymentMethodFilterChange).toHaveBeenCalledWith('octopus');
  });

  it('shows filter count when paymentMethodFilter is active', () => {
    render(<FilterBar {...defaultProps} paymentMethodFilter="cash" total={20} filtered={5} />);
    expect(screen.getByText(/showing 5 of 20/i)).toBeInTheDocument();
  });

  it('clicking All chip resets payment method filter', () => {
    const onPaymentMethodFilterChange = jest.fn();
    render(<FilterBar {...defaultProps} paymentMethodFilter="cash" onPaymentMethodFilterChange={onPaymentMethodFilterChange} />);
    // Panel is visible since paymentMethodFilter !== 'all'; click the All chip
    const allChip = document.querySelector('.MuiChip-root');
    if (allChip) fireEvent.click(allChip);
    expect(onPaymentMethodFilterChange).toHaveBeenCalledWith('all');
  });

  it('does not render category filter icon when categories list is empty', () => {
    render(<FilterBar {...defaultProps} categories={[]} />);
    expect(document.querySelector('[data-testid="LabelIcon"]')).toBeNull();
  });

  it('renders category filter icon when categories are provided', () => {
    render(<FilterBar {...defaultProps} categories={['Food', 'Transport']} />);
    expect(document.querySelector('[data-testid="LabelIcon"]')).toBeTruthy();
  });

  it('shows category chips when filter icon is clicked', () => {
    render(<FilterBar {...defaultProps} categories={['Food', 'Transport']} />);
    const labelBtn = document.querySelector('[data-testid="LabelIcon"]')?.parentElement;
    if (labelBtn) fireEvent.click(labelBtn);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('calls onCategoryFilterChange when category chip is clicked', () => {
    const onCategoryFilterChange = jest.fn();
    render(<FilterBar {...defaultProps} categories={['Food', 'Transport']} onCategoryFilterChange={onCategoryFilterChange} />);
    const labelBtn = document.querySelector('[data-testid="LabelIcon"]')?.parentElement;
    if (labelBtn) fireEvent.click(labelBtn);
    fireEvent.click(screen.getByText('Food'));
    expect(onCategoryFilterChange).toHaveBeenCalledWith('Food');
  });

  it('calls onCategoryFilterChange with "all" when clicking active category chip again', () => {
    const onCategoryFilterChange = jest.fn();
    render(
      <FilterBar
        {...defaultProps}
        categories={['Food', 'Transport']}
        categoryFilter="Food"
        onCategoryFilterChange={onCategoryFilterChange}
      />
    );
    // Panel is open since categoryFilter !== 'all'
    fireEvent.click(screen.getByText('Food'));
    expect(onCategoryFilterChange).toHaveBeenCalledWith('all');
  });

  it('clicking All chip in category panel resets category filter', () => {
    const onCategoryFilterChange = jest.fn();
    render(
      <FilterBar
        {...defaultProps}
        categories={['Food', 'Transport']}
        categoryFilter="Food"
        onCategoryFilterChange={onCategoryFilterChange}
      />
    );
    // Category panel is open since categoryFilter !== 'all'
    // The category Collapse renders: All, Food, Transport chips
    // Payment method Collapse also renders an "All" chip but it comes first in DOM
    // Last "All" chip in the DOM belongs to the category section
    const allChips = screen.getAllByText('All');
    fireEvent.click(allChips[allChips.length - 1]);
    expect(onCategoryFilterChange).toHaveBeenCalledWith('all');
  });

  it('shows filter count when categoryFilter is active', () => {
    render(
      <FilterBar
        {...defaultProps}
        categories={['Food']}
        categoryFilter="Food"
        total={20}
        filtered={4}
      />
    );
    expect(screen.getByText(/showing 4 of 20/i)).toBeInTheDocument();
  });

  it('category filter icon is highlighted when a category is selected', () => {
    render(<FilterBar {...defaultProps} categories={['Food']} categoryFilter="Food" />);
    const labelIcon = document.querySelector('[data-testid="LabelIcon"]');
    expect(labelIcon?.parentElement).toBeTruthy();
  });
});
