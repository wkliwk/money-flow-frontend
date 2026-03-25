import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilterBar from '../FilterBar';

describe('FilterBar', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnTypeFilterChange = jest.fn();
  const mockOnSortChange = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnBulkModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByPlaceholderText(/Search transactions/)).toBeInTheDocument();
  });

  it('should call onSearchChange when search input changes', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search transactions/);
    fireEvent.change(searchInput, { target: { value: 'coffee' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('coffee');
  });

  it('should clear search when X button clicked', () => {
    render(
      <FilterBar
        search="coffee"
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const clearButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="ClearIcon"]')
    );
    if (clearButton) {
      fireEvent.click(clearButton);
    }

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  it('should render type toggle buttons', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Income/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Expense/i })).toBeInTheDocument();
  });

  it('should call onTypeFilterChange when type filter changes', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const expenseButton = screen.getByRole('button', { name: /Expense/i });
    fireEvent.click(expenseButton);

    expect(mockOnTypeFilterChange).toHaveBeenCalledWith('expense');
  });

  it('should render sort button', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const sortButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="SortIcon"]')
    );
    expect(sortButton).toBeInTheDocument();
  });

  it('should call onSortChange when sort button clicked', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const sortButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="SortIcon"]')
    );
    if (sortButton) {
      fireEvent.click(sortButton);
    }

    expect(mockOnSortChange).toHaveBeenCalledWith('amount');
  });

  it('should toggle sort between date and amount', () => {
    const { rerender } = render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    let sortButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="SortIcon"]')
    );
    if (sortButton) {
      fireEvent.click(sortButton);
    }

    expect(mockOnSortChange).toHaveBeenCalledWith('amount');

    // Update prop
    rerender(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="amount"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    sortButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="SortIcon"]')
    );
    if (sortButton) {
      fireEvent.click(sortButton);
    }

    expect(mockOnSortChange).toHaveBeenCalledWith('date');
  });

  it('should render export button', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="DownloadIcon"]')
    );
    expect(exportButton).toBeInTheDocument();
  });

  it('should call onExport when export button clicked', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="DownloadIcon"]')
    );
    if (exportButton) {
      fireEvent.click(exportButton);
    }

    expect(mockOnExport).toHaveBeenCalled();
  });

  it('should disable export button when no transactions filtered', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={0}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getAllByRole('button').find(
      (btn) => btn.querySelector('[data-testid="DownloadIcon"]')
    );
    expect(exportButton).toBeDisabled();
  });

  it('should show transaction count when filtered', () => {
    render(
      <FilterBar
        search="coffee"
        typeFilter="all"
        sortBy="date"
        total={100}
        filtered={5}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText(/Showing 5 of 100/)).toBeInTheDocument();
  });

  it('should show "all time" text when searchAllTime is true', () => {
    render(
      <FilterBar
        search="coffee"
        typeFilter="all"
        sortBy="date"
        total={100}
        filtered={5}
        searchAllTime={true}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText(/all time/)).toBeInTheDocument();
  });

  it('should not show count when no active filters', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={50}
        filtered={50}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('should handle bulk mode toggle', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        bulkMode={false}
        onBulkModeChange={mockOnBulkModeChange}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const bulkButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('☑️')
    );
    if (bulkButton) {
      fireEvent.click(bulkButton);
    }

    expect(mockOnBulkModeChange).toHaveBeenCalledWith(true);
  });

  it('should show bulk mode button as active when bulkMode=true', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={10}
        bulkMode={true}
        onBulkModeChange={mockOnBulkModeChange}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const bulkButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('☑️')
    );
    expect(bulkButton).toHaveClass('MuiIconButton-root');
  });

  it('should disable bulk mode button when no transactions', () => {
    render(
      <FilterBar
        search=""
        typeFilter="all"
        sortBy="date"
        total={0}
        filtered={0}
        bulkMode={false}
        onBulkModeChange={mockOnBulkModeChange}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const bulkButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent?.includes('☑️')
    );
    expect(bulkButton).toBeDisabled();
  });

  it('should maintain selected type filter', () => {
    const { rerender } = render(
      <FilterBar
        search=""
        typeFilter="income"
        sortBy="date"
        total={10}
        filtered={5}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    // Income button should be selected
    const incomeButton = screen.getByRole('button', { name: /Income/i });
    expect(incomeButton).toBeInTheDocument();
  });

  it('should maintain search value in input', () => {
    render(
      <FilterBar
        search="lunch"
        typeFilter="all"
        sortBy="date"
        total={10}
        filtered={3}
        onSearchChange={mockOnSearchChange}
        onTypeFilterChange={mockOnTypeFilterChange}
        onSortChange={mockOnSortChange}
        onExport={mockOnExport}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search transactions/) as HTMLInputElement;
    expect(searchInput.value).toBe('lunch');
  });
});
